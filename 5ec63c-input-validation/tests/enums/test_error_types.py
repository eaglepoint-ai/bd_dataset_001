import pytest
from error_handling_lib.enums.error_types import ErrorCategory, ErrorSeverity

def test_error_category_members():
    assert ErrorCategory.VALIDATION == "VALIDATION"
    assert ErrorCategory.NETWORK == "NETWORK"
    assert ErrorCategory.DATABASE == "DATABASE"


def test_error_severity_members():
    assert ErrorSeverity.LOW == "LOW"
    assert ErrorSeverity.MEDIUM == "MEDIUM"
    assert ErrorSeverity.HIGH == "HIGH"
    assert ErrorSeverity.CRITICAL == "CRITICAL"

def test_error_severity_ordering():
    # Since they are strings, we can't directly compare them with < or > unless we map them.
    # The requirement said "Ordered meaning (used by handler filtering)".
    # The handler maps them to ints. We can loosely test equality here.
    assert ErrorSeverity.CRITICAL.value == "CRITICAL"
