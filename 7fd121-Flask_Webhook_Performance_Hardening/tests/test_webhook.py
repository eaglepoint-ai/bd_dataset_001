import os
import sys
import json
import time
import hmac
import hashlib
import pytest
from flask import Flask
from unittest.mock import patch, MagicMock
import importlib


# --------------------------------------------------
# Mock models.db before importing webhook
# --------------------------------------------------

mock_models_db = MagicMock()
mock_models_db.get_session = MagicMock()
mock_models_db.Transaction = MagicMock()
sys.modules['models'] = MagicMock()
sys.modules['models.db'] = mock_models_db


# --------------------------------------------------
# Resolve target repository dynamically
# --------------------------------------------------

TARGET_REPO = os.getenv("TARGET_REPOSITORY")

if not TARGET_REPO:
    raise RuntimeError("TARGET_REPOSITORY environment variable is not set")

try:
    webhook_module = importlib.import_module(
        f"{TARGET_REPO}.api.webhook"
    )
except ImportError as e:
    raise RuntimeError(
        f"Could not import webhook from {TARGET_REPO}"
    ) from e

webhook_blueprint = webhook_module.webhook_blueprint


# --------------------------------------------------
# Flask app setup
# --------------------------------------------------

@pytest.fixture
def app():
    app = Flask(__name__)
    app.register_blueprint(webhook_blueprint)
    return app


@pytest.fixture
def client(app):
    return app.test_client()


# --------------------------------------------------
# Helpers
# --------------------------------------------------

WEBHOOK_SECRET = os.getenv("WEBHOOK_SECRET", "test-secret")


def generate_signature(payload: dict) -> str:
    """
    Generate signature EXACTLY as production expects:
    - Raw JSON bytes
    - No reordering
    """
    raw_body = json.dumps(payload, separators=(",", ":")).encode()

    return hmac.new(
        WEBHOOK_SECRET.encode(),
        raw_body,
        hashlib.sha256
    ).hexdigest()


def valid_payload():
    return {
        "timestamp": int(time.time()),
        "amount": 100,
        "currency": "USD",
        "reference": "tx-123"
    }


# --------------------------------------------------
# Tests
# --------------------------------------------------

def test_valid_webhook_request(client):
    payload = valid_payload()
    raw_body = json.dumps(payload, separators=(",", ":"))
    signature = generate_signature(payload)

    with patch(f"{TARGET_REPO}.api.webhook.get_session") as mock_session:
        mock_db = MagicMock()
        mock_session.return_value.__enter__.return_value = mock_db

        response = client.post(
            "/webhook",
            data=raw_body,
            headers={"YAYA-SIGNATURE": signature},
            content_type="application/json"
        )

    assert response.status_code == 200
    assert response.get_json() == {
        "message": "Transaction recorded successfully"
    }


def test_missing_signature_header(client):
    payload = valid_payload()

    response = client.post(
        "/webhook",
        data=json.dumps(payload),
        content_type="application/json"
    )

    assert response.status_code == 400
    assert response.get_json()["error"] == "Missing signature header"


def test_invalid_signature(client):
    payload = valid_payload()

    response = client.post(
        "/webhook",
        data=json.dumps(payload),
        headers={"YAYA-SIGNATURE": "invalid"},
        content_type="application/json"
    )

    assert response.status_code == 403
    assert response.get_json()["status"] == "Invalid signature"


def test_replay_attack_detected(client):
    payload = valid_payload()
    payload["timestamp"] = int(time.time()) - 1000

    signature = generate_signature(payload)

    response = client.post(
        "/webhook",
        data=json.dumps(payload),
        headers={"YAYA-SIGNATURE": signature},
        content_type="application/json"
    )

    assert response.status_code == 400
    assert response.get_json()["status"] == "Replay attack detected"


def test_missing_timestamp(client):
    payload = valid_payload()
    payload.pop("timestamp")

    signature = generate_signature(payload)

    response = client.post(
        "/webhook",
        data=json.dumps(payload),
        headers={"YAYA-SIGNATURE": signature},
        content_type="application/json"
    )

    assert response.status_code == 400
    assert response.get_json()["error"] == "Missing timestamp in payload"


def test_invalid_json_payload(client):
    response = client.post(
        "/webhook",
        data="not-json",
        headers={"YAYA-SIGNATURE": "anything"},
        content_type="application/json"
    )

    assert response.status_code == 400
    assert response.get_json()["error"] == "Invalid JSON payload"


def test_database_error_is_hidden(client):
    payload = valid_payload()
    raw_body = json.dumps(payload, separators=(",", ":"))
    signature = generate_signature(payload)

    with patch(f"{TARGET_REPO}.api.webhook.get_session") as mock_session:
        mock_session.side_effect = Exception("DB exploded")

        response = client.post(
            "/webhook",
            data=raw_body,
            headers={"YAYA-SIGNATURE": signature},
            content_type="application/json"
        )

    assert response.status_code == 500
    assert response.get_json()["error"] in {
        "Database error occurred",
        "An unexpected error occurred"
    }
