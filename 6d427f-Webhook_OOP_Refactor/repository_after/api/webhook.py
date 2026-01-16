#!/usr/bin/python3
"""
API endpoint to handle incoming webhooks and verify their authenticity.
"""
import os
from flask import Blueprint, request, jsonify
from sqlalchemy.exc import SQLAlchemyError
from models.db import get_session
from api.services import WebhookService, SignatureVerifier, InvalidSignatureError, ReplayAttackError

webhook_blueprint = Blueprint('webhook', __name__)

# Dependency Injection Setup
# In a real app, this might be handled by a container or factory.
# Here we instantiate them at module level or inside the route.
# To allow easy testing/mocking, we can allow them to be overridden or passed.
# For simplicity and adhering to Flask patterns, we will instantiate the service here.

def get_webhook_service():
    secret_key = os.getenv('WEBHOOK_SECRET', '')
    verifier = SignatureVerifier()
    return WebhookService(verifier, get_session, secret_key)


@webhook_blueprint.route('/webhook', methods=['POST'])
def webhook():
    """
    Handle incoming webhook requests by verifying the signature,
    checking for replay attacks, and storing the data if valid.
    """
    try:
        request_data = request.get_json()
        if request_data is None:
            return jsonify({'error': 'Invalid JSON payload'}), 400

        signature = request.headers.get('YAYA-SIGNATURE')
        if not signature:
            return jsonify({'error': 'Missing signature header'}), 400
        
        # Timestamp check logic 'Missing timestamp in payload' logic was inside try block 
        # in original code, accessed via request_data.get('timestamp').
        # If I delegate to service, service raises ValueError "Missing timestamp...".
        # Original:
        # timestamp = request_data.get('timestamp')
        # if timestamp is None: return ... 400
        
        # Note: In my service `validate_timestamp` raises ValueError.
        # The controller catches ValueError and returns 400.
        # The message in original was "Missing timestamp in payload" (explicit check)
        # vs "Invalid data: ..." (catch all).
        # Wait, original had explicit check:
        # if timestamp is None: return jsonify({'error': 'Missing timestamp in payload'}), 400
        # BUT later `except (TypeError, ValueError) as e: return jsonify({'error': f'Invalid data: {str(e)}'}), 400`
        # If I let `validate_timestamp` raise ValueError, it hits the catch block and returns "Invalid data: Missing timestamp..."
        # This CHANGES the error message from "Missing timestamp in payload" to "Invalid data: Missing timestamp in payload".
        # Strict requirement: "No existing functional behavior should change ... Response formats".
        # So I must either:
        # 1. Handle timestamp missing explicitly in controller (as original).
        # 2. Or ensure the exception message matches exactly what is expected and the controller handles it.
        
        # Original code:
        # if timestamp is None:
        #     return jsonify({'error': 'Missing timestamp in payload'}), 400
        
        service = get_webhook_service()
        
        # I should probably pull timestamp check into controller OR handle the specific error from service.
        # To be safe and clean, I will keep validation that produces specific HTTP responses in the controller 
        # IF it was explicit in the original, OR make the service raise a specific exception that I catch.
        
        # Re-reading original `webhook()`:
        # It checks `request_data is None`.
        # It checks `signature`.
        # It checks `timestamp`.
        
        # I will keep these checks in the controller to preserve exact error messages 100%.
        # The service will handle the rest (replay check calculation, signature verification, DB).
        
        timestamp = request_data.get('timestamp')
        if timestamp is None:
            return jsonify({'error': 'Missing timestamp in payload'}), 400

        # Delegate to Service
        service.process_webhook(request_data, signature)

        return jsonify({'message': 'Transaction recorded successfully'}), 200

    except ReplayAttackError:
        return jsonify({'status': 'Replay attack detected'}), 400
    except InvalidSignatureError:
        return jsonify({'status': 'Invalid signature'}), 403
    except (TypeError, ValueError) as e:
        return jsonify({'error': f'Invalid data: {str(e)}'}), 400
    except SQLAlchemyError as e:
        return jsonify(
            {'erro': 'Database error occurred', 'details': str(e)}), 500
    except Exception as e:
        return jsonify(
            {'error': 'An unexpected error occurred', 'details': str(e)}), 500
