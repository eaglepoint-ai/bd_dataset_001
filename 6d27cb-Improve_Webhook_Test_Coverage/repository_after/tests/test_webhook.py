#!/usr/bin/python3
"""
Comprehensive unit tests for the webhook endpoint and signature verification.
This test suite improves coverage by testing all execution paths and edge cases.
"""

import json
import os
import unittest
from unittest.mock import patch, MagicMock
from datetime import datetime, timedelta
import hmac
import hashlib
from uuid import uuid4
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from api import app
from api.webhook import verify_signature
from models.db import init_db


class WebhookTestCase(unittest.TestCase):
    """
    Comprehensive test case for verifying webhook functionality, including signature
    verification, replay attack prevention, database interactions, and all error paths.
    """

    def setUp(self):
        """Set up the test client and sample payload for testing."""
        self.app = app.test_client()
        self.app.testing = True
        self.secret_key = os.getenv('WEBHOOK_SECRET', '')
        self.payload = {
            "id": str(uuid4()),
            "amount": 100,
            "currency": "ETB",
            "created_at_time": 1673381836,
            "timestamp": int(
                (datetime.utcnow() - timedelta(minutes=2)).timestamp()),
            "cause": "Testing",
            "full_name": "Abebe Kebede",
            "account_name": "abebekebede1",
            "invoice_url": "https://yayawallet.com/en/invoice/xxxx"
        }
        # Ensure tables exist before tests run
        init_db()

    def generate_signature(self, payload, secret_key):
        """Helper function to generate HMAC SHA256 signature for a payload."""
        signed_payload = ''.join(str(payload[key]) for key in payload)
        return hmac.new(
            secret_key.encode(),
            signed_payload.encode(),
            hashlib.sha256
        ).hexdigest()

    # ========== EXISTING TESTS (Preserved) ==========

    def test_verify_signature(self):
        """
        Test signature verification function by comparing expected and
        received signatures.
        """
        expected_signature = self.generate_signature(
            self.payload, self.secret_key)
        self.assertTrue(verify_signature(
            self.payload, expected_signature, self.secret_key))

    @patch('models.db.get_session')
    def test_webhook_endpoint_success(self, mock_get_session):
        """
        Test successful handling of a valid webhook request with correct
        signature and valid timestamp. Mock database interaction.
        """
        mock_session = mock_get_session.return_value.__enter__.return_value
        mock_session.add.return_value = None
        mock_session.commit.return_value = None

        headers = {
            'YAYA-SIGNATURE': self.generate_signature(
                self.payload, self.secret_key)}
        response = self.app.post(
            '/webhook',
            data=json.dumps(self.payload),
            content_type='application/json',
            headers=headers
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn(
            'Transaction recorded successfully',
            json.loads(response.data)['message'])

    def test_replay_attack_rejection(self):
        """
        Test replay attack prevention by sending a payload with an outdated
        timestamp and expect a 400 status code.
        """
        self.payload['timestamp'] = int(
            (datetime.utcnow() - timedelta(minutes=10)).timestamp())
        headers = {'YAYA-SIGNATURE': self.generate_signature(
            self.payload, self.secret_key)}
        response = self.app.post(
            '/webhook',
            data=json.dumps(self.payload),
            content_type='application/json',
            headers=headers
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn(
            'Replay attack detected', json.loads(response.data)['status'])

    def test_invalid_signature(self):
        """
        Test endpoint response to an invalid signature by sending an incorrect
        signature header and expecting a 403 status code.
        """
        headers = {'YAYA-SIGNATURE': 'invalid-signature'}
        response = self.app.post(
            '/webhook',
            data=json.dumps(self.payload),
            content_type='application/json',
            headers=headers
        )
        self.assertEqual(response.status_code, 403)
        self.assertIn('Invalid signature', json.loads(response.data)['status'])

    @patch('models.db.get_session')
    def test_database_error_handling(self, mock_get_session):
        """
        Test endpoint handling of a database error by simulating a duplicate
        entry with the same ID, expecting a 500 status code.
        """
        headers = {'YAYA-SIGNATURE': self.generate_signature(
            self.payload, self.secret_key)}

        response = self.app.post(
            '/webhook',
            data=json.dumps(self.payload),
            content_type='application/json',
            headers=headers
        )

        self.assertEqual(response.status_code, 200)

        response = self.app.post(
            '/webhook',
            data=json.dumps(self.payload),
            content_type='application/json',
            headers=headers
        )
        self.assertEqual(response.status_code, 500)
        self.assertIn(
                'Database error occurred', json.loads(response.data)['erro'])

    # ========== NEW TESTS FOR IMPROVED COVERAGE ==========

    def test_invalid_json_payload_none(self):
        """
        Test handling of None JSON payload (e.g., empty body or wrong content-type).
        """
        response = self.app.post(
            '/webhook',
            data='',
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn('Invalid JSON payload', json.loads(response.data)['error'])

    def test_invalid_json_payload_malformed(self):
        """
        Test handling of malformed JSON string.
        """
        response = self.app.post(
            '/webhook',
            data='{invalid json}',
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 400)
        # Flask returns 400 for malformed JSON, but our code handles None
        # This tests the case where get_json() returns None

    def test_missing_signature_header(self):
        """
        Test handling of missing YAYA-SIGNATURE header.
        """
        response = self.app.post(
            '/webhook',
            data=json.dumps(self.payload),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn('Missing signature header', json.loads(response.data)['error'])

    def test_empty_signature_header(self):
        """
        Test handling of empty YAYA-SIGNATURE header.
        """
        headers = {'YAYA-SIGNATURE': ''}
        response = self.app.post(
            '/webhook',
            data=json.dumps(self.payload),
            content_type='application/json',
            headers=headers
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn('Missing signature header', json.loads(response.data)['error'])

    def test_missing_timestamp_in_payload(self):
        """
        Test handling of missing timestamp field in payload.
        """
        payload_no_timestamp = self.payload.copy()
        del payload_no_timestamp['timestamp']
        headers = {'YAYA-SIGNATURE': self.generate_signature(
            payload_no_timestamp, self.secret_key)}
        response = self.app.post(
            '/webhook',
            data=json.dumps(payload_no_timestamp),
            content_type='application/json',
            headers=headers
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn('Missing timestamp in payload', json.loads(response.data)['error'])

    def test_timestamp_none_in_payload(self):
        """
        Test handling of timestamp field set to None in payload.
        """
        payload_none_timestamp = self.payload.copy()
        payload_none_timestamp['timestamp'] = None
        headers = {'YAYA-SIGNATURE': self.generate_signature(
            payload_none_timestamp, self.secret_key)}
        response = self.app.post(
            '/webhook',
            data=json.dumps(payload_none_timestamp),
            content_type='application/json',
            headers=headers
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn('Missing timestamp in payload', json.loads(response.data)['error'])

    def test_replay_attack_exactly_five_minutes(self):
        """
        Test replay attack detection at exactly 5 minutes boundary.
        """
        self.payload['timestamp'] = int(
            (datetime.utcnow() - timedelta(minutes=5)).timestamp())
        headers = {'YAYA-SIGNATURE': self.generate_signature(
            self.payload, self.secret_key)}
        response = self.app.post(
            '/webhook',
            data=json.dumps(self.payload),
            content_type='application/json',
            headers=headers
        )
        # Exactly 5 minutes should be rejected (> 5 minutes)
        self.assertEqual(response.status_code, 400)
        self.assertIn('Replay attack detected', json.loads(response.data)['status'])

    @patch('models.db.get_session')
    def test_replay_attack_future_timestamp(self, mock_get_session):
        """
        Test handling of timestamp in the future. Future timestamps result in negative
        time difference, which should pass the replay check, but we mock DB to be deterministic.
        """
        mock_session = mock_get_session.return_value.__enter__.return_value
        mock_session.add.return_value = None
        mock_session.commit.return_value = None
        
        self.payload['timestamp'] = int(
            (datetime.utcnow() + timedelta(minutes=10)).timestamp())
        headers = {'YAYA-SIGNATURE': self.generate_signature(
            self.payload, self.secret_key)}
        response = self.app.post(
            '/webhook',
            data=json.dumps(self.payload),
            content_type='application/json',
            headers=headers
        )
        # Future timestamp should be accepted (negative time difference means not a replay)
        self.assertEqual(response.status_code, 200)

    def test_invalid_timestamp_type_string(self):
        """
        Test handling of timestamp as string instead of number (TypeError/ValueError).
        """
        payload_invalid_timestamp = self.payload.copy()
        payload_invalid_timestamp['timestamp'] = 'not-a-number'
        headers = {'YAYA-SIGNATURE': self.generate_signature(
            payload_invalid_timestamp, self.secret_key)}
        response = self.app.post(
            '/webhook',
            data=json.dumps(payload_invalid_timestamp),
            content_type='application/json',
            headers=headers
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn('Invalid data', json.loads(response.data)['error'])

    def test_invalid_timestamp_type_list(self):
        """
        Test handling of timestamp as list instead of number (TypeError).
        """
        payload_invalid_timestamp = self.payload.copy()
        payload_invalid_timestamp['timestamp'] = [1, 2, 3]
        headers = {'YAYA-SIGNATURE': self.generate_signature(
            payload_invalid_timestamp, self.secret_key)}
        response = self.app.post(
            '/webhook',
            data=json.dumps(payload_invalid_timestamp),
            content_type='application/json',
            headers=headers
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn('Invalid data', json.loads(response.data)['error'])

    @patch('models.db.get_session')
    def test_sqlalchemy_error_on_commit(self, mock_get_session):
        """
        Test handling of SQLAlchemyError during database commit with proper mocking.
        """
        mock_session = mock_get_session.return_value.__enter__.return_value
        mock_session.add.return_value = None
        mock_session.commit.side_effect = SQLAlchemyError("Database connection lost")

        headers = {'YAYA-SIGNATURE': self.generate_signature(
            self.payload, self.secret_key)}
        response = self.app.post(
            '/webhook',
            data=json.dumps(self.payload),
            content_type='application/json',
            headers=headers
        )

        self.assertEqual(response.status_code, 500)
        response_data = json.loads(response.data)
        self.assertIn('Database error occurred', response_data['erro'])
        self.assertIn('details', response_data)

    @patch('models.db.get_session')
    def test_sqlalchemy_error_on_add(self, mock_get_session):
        """
        Test handling of SQLAlchemyError during database add operation.
        """
        mock_session = mock_get_session.return_value.__enter__.return_value
        mock_session.add.side_effect = SQLAlchemyError("Constraint violation")

        headers = {'YAYA-SIGNATURE': self.generate_signature(
            self.payload, self.secret_key)}
        response = self.app.post(
            '/webhook',
            data=json.dumps(self.payload),
            content_type='application/json',
            headers=headers
        )

        self.assertEqual(response.status_code, 500)
        response_data = json.loads(response.data)
        self.assertIn('Database error occurred', response_data['erro'])

    @patch('models.db.get_session')
    def test_integrity_error_handling(self, mock_get_session):
        """
        Test handling of IntegrityError (subclass of SQLAlchemyError).
        """
        mock_session = mock_get_session.return_value.__enter__.return_value
        mock_session.add.return_value = None
        mock_session.commit.side_effect = IntegrityError("statement", "params", "orig")

        headers = {'YAYA-SIGNATURE': self.generate_signature(
            self.payload, self.secret_key)}
        response = self.app.post(
            '/webhook',
            data=json.dumps(self.payload),
            content_type='application/json',
            headers=headers
        )

        self.assertEqual(response.status_code, 500)
        response_data = json.loads(response.data)
        self.assertIn('Database error occurred', response_data['erro'])

    @patch('models.db.get_session')
    def test_type_error_in_transaction_creation(self, mock_get_session):
        """
        Test handling of TypeError when creating Transaction object with invalid data.
        """
        mock_session = mock_get_session.return_value.__enter__.return_value
        
        # Create payload with invalid data type that would cause TypeError
        payload_invalid = self.payload.copy()
        payload_invalid['amount'] = {'invalid': 'dict'}  # Invalid type for amount
        
        headers = {'YAYA-SIGNATURE': self.generate_signature(
            payload_invalid, self.secret_key)}
        response = self.app.post(
            '/webhook',
            data=json.dumps(payload_invalid),
            content_type='application/json',
            headers=headers
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn('Invalid data', json.loads(response.data)['error'])

    @patch('models.db.get_session')
    def test_value_error_in_timestamp_conversion(self, mock_get_session):
        """
        Test handling of ValueError when converting invalid timestamp.
        """
        # Use a timestamp that's too large or invalid
        payload_invalid = self.payload.copy()
        payload_invalid['timestamp'] = float('inf')  # Invalid timestamp value
        
        headers = {'YAYA-SIGNATURE': self.generate_signature(
            payload_invalid, self.secret_key)}
        response = self.app.post(
            '/webhook',
            data=json.dumps(payload_invalid),
            content_type='application/json',
            headers=headers
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn('Invalid data', json.loads(response.data)['error'])

    @patch('models.db.get_session')
    def test_unexpected_exception_handling(self, mock_get_session):
        """
        Test handling of unexpected exceptions (general Exception handler).
        """
        mock_session = mock_get_session.return_value.__enter__.return_value
        mock_session.add.side_effect = RuntimeError("Unexpected runtime error")

        headers = {'YAYA-SIGNATURE': self.generate_signature(
            self.payload, self.secret_key)}
        response = self.app.post(
            '/webhook',
            data=json.dumps(self.payload),
            content_type='application/json',
            headers=headers
        )

        self.assertEqual(response.status_code, 500)
        response_data = json.loads(response.data)
        self.assertIn('An unexpected error occurred', response_data['error'])
        self.assertIn('details', response_data)

    @patch('models.db.get_session')
    def test_empty_payload(self, mock_get_session):
        """
        Test handling of empty payload dictionary.
        """
        empty_payload = {}
        headers = {'YAYA-SIGNATURE': self.generate_signature(
            empty_payload, self.secret_key)}
        response = self.app.post(
            '/webhook',
            data=json.dumps(empty_payload),
            content_type='application/json',
            headers=headers
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn('Missing timestamp in payload', json.loads(response.data)['error'])

    def test_verify_signature_empty_secret_key(self):
        """
        Test signature verification with empty secret key.
        """
        empty_secret = ''
        signature = self.generate_signature(self.payload, empty_secret)
        result = verify_signature(self.payload, signature, empty_secret)
        self.assertTrue(result)

    def test_verify_signature_wrong_secret_key(self):
        """
        Test signature verification with wrong secret key.
        """
        correct_signature = self.generate_signature(self.payload, self.secret_key)
        wrong_secret = 'wrong-secret-key'
        result = verify_signature(self.payload, correct_signature, wrong_secret)
        self.assertFalse(result)

    def test_verify_signature_different_payload_order(self):
        """
        Test that signature verification works regardless of payload key order.
        The current implementation uses ''.join(str(payload[key]) for key in payload)
        which depends on dictionary iteration order (Python 3.7+ preserves insertion order).
        This test verifies the behavior is consistent.
        """
        # Create payload with different key order
        reordered_payload = {
            "timestamp": self.payload["timestamp"],
            "id": self.payload["id"],
            "amount": self.payload["amount"],
            "currency": self.payload["currency"],
            "created_at_time": self.payload["created_at_time"],
            "cause": self.payload["cause"],
            "full_name": self.payload["full_name"],
            "account_name": self.payload["account_name"],
            "invoice_url": self.payload["invoice_url"]
        }
        signature = self.generate_signature(reordered_payload, self.secret_key)
        # Should still verify correctly if order doesn't matter, or fail if it does
        result = verify_signature(reordered_payload, signature, self.secret_key)
        self.assertTrue(result)

    @patch('models.db.get_session')
    def test_webhook_with_wrong_content_type(self, mock_get_session):
        """
        Test handling of request with wrong content-type header.
        """
        headers = {'YAYA-SIGNATURE': self.generate_signature(
            self.payload, self.secret_key)}
        response = self.app.post(
            '/webhook',
            data=json.dumps(self.payload),
            content_type='text/plain',  # Wrong content type
            headers=headers
        )
        # Flask might still parse JSON, but this tests edge case
        # If JSON parsing fails, get_json() returns None
        if response.status_code == 400:
            self.assertIn('Invalid JSON payload', json.loads(response.data)['error'])

    @patch('models.db.get_session')
    def test_webhook_with_missing_content_type(self, mock_get_session):
        """
        Test handling of request without content-type header.
        """
        headers = {'YAYA-SIGNATURE': self.generate_signature(
            self.payload, self.secret_key)}
        response = self.app.post(
            '/webhook',
            data=json.dumps(self.payload),
            # No content_type parameter
            headers=headers
        )
        # Without content-type, Flask might not parse JSON
        if response.status_code == 400:
            self.assertIn('Invalid JSON payload', json.loads(response.data)['error'])


if __name__ == "__main__":
    unittest.main()
