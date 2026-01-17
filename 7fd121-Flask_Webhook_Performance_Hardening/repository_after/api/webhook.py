#!/usr/bin/python3
"""
API endpoint to handle incoming webhooks and verify their authenticity.
"""
import hmac
import hashlib
import os
import time
from flask import Blueprint, request, jsonify
from sqlalchemy.exc import SQLAlchemyError
from models.db import get_session, Transaction

webhook_blueprint = Blueprint('webhook', __name__)

WEBHOOK_SECRET = os.getenv('WEBHOOK_SECRET')

if not WEBHOOK_SECRET:
    raise EnvironmentError(
        'WEBHOOK_SECRET environment variable is not set.')


def verify_signature(raw_body: bytes, received_signature: str) -> bool:
    """
    Verify the HMAC SHA256 signature of the incoming payload.
    """
    expected_signature = hmac.new(
            WEBHOOK_SECRET.encode(),
            raw_body,
            hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected_signature, received_signature)


@webhook_blueprint.route('/webhook', methods=['POST'])
def webhook():
    """
    Handle incoming webhook requests by verifying the signature,
    checking for replay attacks, and storing the data if valid.
    """
    try:
        raw_body = request.get_data()
        request_data = request.get_json(silent=True)

        if not isinstance(request_data, dict):
            return jsonify({'error': 'Invalid JSON payload'}), 400

        signature = request.headers.get('YAYA-SIGNATURE')
        if not signature:
            return jsonify({'error': 'Missing signature header'}), 400

        timestamp = request_data.get('timestamp')
        if not isinstance(timestamp, int):
            return jsonify({'error': 'Missing timestamp in payload'}), 400

        current_ts = int(time.time())
        if abs(current_ts - timestamp) > 300:
            return jsonify({'status': 'Replay attack detected'}), 400

        if not verify_signature(raw_body, signature):
            return jsonify({'status': 'Invalid signature'}), 403

        with get_session() as session:
            transaction = Transaction(**request_data)
            session.add(transaction)
            session.commit()

        return jsonify({'message': 'Transaction recorded successfully'}), 200
    except SQLAlchemyError:
        return jsonify({'error': 'Database error occurred'}), 500
    except Exception:
        return jsonify({'error': 'An unexpected error occurred'}), 500
