import pytest
from error_handling_lib.decorators import safe_execute, retry_on_error
from error_handling_lib.handlers.error_handler import ErrorHandler
from error_handling_lib.errors.specific_errors import NetworkError, ValidationError, DatabaseError
from error_handling_lib.enums.error_types import ErrorCategory

def test_safe_execute_catches_error():
    handler = ErrorHandler()
    
    @safe_execute(error_handler=handler)
    def fail_func():
        raise ValidationError("Oops")
    
    # Should not raise
    fail_func()
    assert handler.stats["total"] == 1

def test_safe_execute_reraise():
    handler = ErrorHandler()
    
    @safe_execute(error_handler=handler, re_raise=True)
    def fail_func():
        raise ValidationError("Oops")
    
    with pytest.raises(ValidationError):
        fail_func()
    assert handler.stats["total"] == 1

def test_retry_on_error_success_after_retry():
    attempts = 0
    @retry_on_error(max_retries=2, backoff_factor=0.01, retryable_categories={ErrorCategory.NETWORK})
    def flaky_func():
        nonlocal attempts
        attempts += 1
        if attempts < 2:
            raise NetworkError("Fail")
        return "Success"
    
    res = flaky_func()
    assert res == "Success"
    assert attempts == 2

def test_retry_on_error_fails_max_retries():
    attempts = 0
    @retry_on_error(max_retries=2, backoff_factor=0.01, retryable_categories={ErrorCategory.NETWORK})
    def always_fail():
        nonlocal attempts
        attempts += 1
        raise NetworkError("Fail")
    
    with pytest.raises(NetworkError):
        always_fail()
    assert attempts == 3 # Initial + 2 retries

def test_retry_on_ignore_other_categories():
    attempts = 0
    # Only retry NETWORK, but we raise VALIDATION
    @retry_on_error(max_retries=2, retryable_categories={ErrorCategory.NETWORK})
    def wrong_error():
        nonlocal attempts
        attempts += 1
        raise ValidationError("Invalid")
    
    with pytest.raises(ValidationError):
        wrong_error()
    assert attempts == 1 # No retry
