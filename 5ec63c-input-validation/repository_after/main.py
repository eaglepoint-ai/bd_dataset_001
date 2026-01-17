import random
import time
from error_handling_lib.enums import ErrorCategory, ErrorSeverity
from error_handling_lib.handlers import ErrorHandler
from error_handling_lib.validators import InputValidator
from error_handling_lib.decorators import safe_execute, retry_on_error
from error_handling_lib.errors import NetworkError, ValidationError, DatabaseError

# Initialize Central Handler
handler = ErrorHandler(min_severity=ErrorSeverity.LOW)

def graceful_shutdown_mock():
    print("\n[!!!] System performing graceful shutdown cleanup...\n")

# Attach shutdown callback
handler.shutdown_callback = graceful_shutdown_mock

# Example 1: Validation
def register_user(email: str, age: int, password: str):
    print(f"\n--- Registering User: {email} ---")
    
    # Using InputValidator
    InputValidator.email(email, "Email")
    InputValidator.range(age, 18, 120, "Age")
    InputValidator.length(password, 8, None, "Password")
    
    print("User registered successfully!")

# Example 2: Retry Logic for Network Operations
@retry_on_error(max_retries=2, backoff_factor=0.5, retryable_categories={ErrorCategory.NETWORK})
def fetch_data_from_api():
    print("Fetching data from API...")
    if random.choice([True, False]):
        raise NetworkError("Connection timed out", details={"url": "http://api.example.com", "timeout": 5000})
    print("Data fetched successfully!")

# Example 3: Safe Execution with Error Handling
@safe_execute(error_handler=handler)
def risky_database_operation():
    print("Performing database query...")
    # Simulate a critical error
    raise DatabaseError("Connection pool exhausted", details={"db_host": "localhost", "pool_size": 0})

def run_demo():
    print("=== Python Error Handling Lib Demo ===")

    # Test Validation (Valid)
    try:
        register_user("test@example.com", 25, "securepassword")
    except Exception as e:
        handler.handle(e)

    # Test Validation (Invalid)
    try:
        register_user("invalid-email", 150, "short")
    except Exception as e:
        handler.handle(e) # Should log VALIDATION errors

    # Test Retry Logic
    try:
        fetch_data_from_api()
    except Exception as e:
        handler.handle(e)

    # Test Safe Execution (Critical Error)
    risky_database_operation()

    # Show Stats
    print("\n--- Error Statistics ---")
    print(handler.get_stats())
    
    print("\n--- Error History (Last 5) ---")
    for err in handler.get_history()[-5:]:
        print(f"[{err['timestamp']}] {err['severity']} {err['category']}: {err['message']}")

if __name__ == "__main__":
    run_demo()