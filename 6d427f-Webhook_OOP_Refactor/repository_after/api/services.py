import hmac
import hashlib
import os
import datetime
from sqlalchemy.exc import SQLAlchemyError
from models.db import Transaction

class InvalidSignatureError(Exception):
    pass

class ReplayAttackError(Exception):
    pass

class SignatureVerifier:
    """
    Encapsulates logic for HMAC SHA256 signature verification.
    """
    def verify(self, payload, received_signature, secret_key):
        """
        Verify the HMAC SHA256 signature of the incoming payload.
        """
        signed_payload = ''.join(str(payload[key]) for key in payload)
        expected_signature = hmac.new(
                secret_key.encode(),
                signed_payload.encode(),
                hashlib.sha256).hexdigest()
        return hmac.compare_digest(expected_signature, received_signature)

class WebhookService:
    """
    Handles business logic for processing webhooks, including validation,
    signature verification, and database persistence.
    """
    def __init__(self, verifier, session_factory, secret_key):
        self.verifier = verifier
        self.session_factory = session_factory
        self.secret_key = secret_key

    def validate_timestamp(self, timestamp):
        """
        Check for replay attacks by validating the timestamp.
        """
        if timestamp is None:
            raise ValueError("Missing timestamp in payload") # Will be caught as ValueError in controller

        # Check for replay attacks
        time_difference = datetime.datetime.utcnow() - \
            datetime.datetime.fromtimestamp(timestamp)
        if time_difference > datetime.timedelta(minutes=5):
            raise ReplayAttackError('Replay attack detected')

    def process_webhook(self, request_data, signature):
        """
        Process the webhook request.
        """
        # Validate timestamp (Replay Attack)
        timestamp = request_data.get('timestamp')
        self.validate_timestamp(timestamp)

        # Verify Signature
        if not self.verifier.verify(request_data, signature, self.secret_key):
            raise InvalidSignatureError('Invalid signature')

        # Store in Database
        with self.session_factory() as session:
            transaction = Transaction(**request_data)
            session.add(transaction)
            session.commit()
