import pytest
from error_handling_lib.errors.specific_errors import (
    ValidationError, NetworkError, DatabaseError, UnknownError
)
from error_handling_lib.enums.error_types import ErrorCategory, ErrorSeverity

def test_validation_error_defaults():
    err = ValidationError("Invalid input")
    assert err.category == ErrorCategory.VALIDATION
    assert err.severity == ErrorSeverity.MEDIUM

def test_network_error_defaults():
    err = NetworkError("Timeout")
    assert err.category == ErrorCategory.NETWORK
    assert err.severity == ErrorSeverity.HIGH

def test_database_error_defaults():
    err = DatabaseError("Connection failed")
    assert err.category == ErrorCategory.DATABASE
    assert err.severity == ErrorSeverity.CRITICAL

def test_unknown_error_defaults():
    err = UnknownError("Whoops")
    assert err.category == ErrorCategory.UNKNOWN
    assert err.severity == ErrorSeverity.LOW
