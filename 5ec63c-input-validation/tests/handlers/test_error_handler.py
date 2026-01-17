import pytest
from error_handling_lib.handlers.error_handler import ErrorHandler
from error_handling_lib.enums.error_types import ErrorCategory, ErrorSeverity
from error_handling_lib.errors.specific_errors import ValidationError, DatabaseError

def test_handler_filtering_severity():
    # Only Log HIGH and above
    handler = ErrorHandler(min_severity=ErrorSeverity.HIGH)
    
    # LOW - Should be ignored
    err_low = ValidationError("Low error") # ValidationError is MEDIUM by default, wait.
    # ValidationError is MEDIUM. So if min is HIGH, MEDIUM should be ignored.
    handler.handle(err_low)
    assert handler.stats["total"] == 0

    # CRITICAL - Should be captured
    err_crit = DatabaseError("Crit error") # CRITICAL
    handler.handle(err_crit)
    assert handler.stats["total"] == 1
    assert handler.stats["by_severity"]["CRITICAL"] == 1

def test_handler_filtering_category():
    handler = ErrorHandler(ignored_categories=[ErrorCategory.VALIDATION])
    
    err = ValidationError("Ignored")
    handler.handle(err)
    assert handler.stats["total"] == 0

def test_handler_history_and_stats():
    handler = ErrorHandler()
    handler.handle(ValidationError("Err1"))
    handler.handle(ValidationError("Err2"))
    
    assert handler.stats["total"] == 2
    assert handler.stats["by_category"]["VALIDATION"] == 2
    assert len(handler.history) == 2
    assert handler.history[0]["message"] == "Err1"

def test_graceful_shutdown_trigger():
    shutdown_called = False
    def mock_shutdown():
        nonlocal shutdown_called
        shutdown_called = True
    
    handler = ErrorHandler(shutdown_callback=mock_shutdown)
    handler.handle(DatabaseError("Crash")) # CRITICAL
    
    assert shutdown_called is True
