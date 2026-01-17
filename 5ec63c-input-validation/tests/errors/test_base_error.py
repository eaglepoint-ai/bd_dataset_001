import pytest
from error_handling_lib.errors.base import CategorizedError
from error_handling_lib.enums.error_types import ErrorCategory, ErrorSeverity

def test_categorized_error_init():
    err = CategorizedError("Test message", ErrorCategory.SYSTEM, ErrorSeverity.HIGH, details={"foo": "bar"})
    assert err.message == "Test message"
    assert err.category == ErrorCategory.SYSTEM
    assert err.severity == ErrorSeverity.HIGH
    assert err.details == {"foo": "bar"}
    assert err.timestamp is not None

def test_categorized_error_to_dict():
    err = CategorizedError("msg", ErrorCategory.VALIDATION, ErrorSeverity.LOW)
    data = err.to_dict()
    assert data["message"] == "msg"
    assert data["category"] == "VALIDATION"
    assert data["severity"] == "LOW"
    assert "timestamp" in data
