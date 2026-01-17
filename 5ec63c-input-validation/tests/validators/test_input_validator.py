import pytest
from error_handling_lib.validators.input_validator import InputValidator
from error_handling_lib.errors.specific_errors import ValidationError

# --- Requirement: Email ---
def test_email_valid():
    InputValidator.email("user@example.com", "Email")

def test_email_invalid():
    with pytest.raises(ValidationError) as excinfo:
        InputValidator.email("invalid-email", "Email")
    assert "must be a valid email" in str(excinfo.value)

# --- Requirement: Range ---
def test_range_valid():
    InputValidator.range(25, 0, 120, "Age")

def test_range_invalid_high():
    with pytest.raises(ValidationError):
        InputValidator.range(150, 0, 120, "Age")

def test_range_invalid_low():
    with pytest.raises(ValidationError):
        InputValidator.range(-5, 0, 120, "Age")

# --- Requirement: Length ---
def test_length_valid():
    InputValidator.length("password123", 8, None, "Password")

def test_length_too_short():
    with pytest.raises(ValidationError):
        InputValidator.length("short", 8, None, "Password")

def test_length_too_long():
    with pytest.raises(ValidationError):
        InputValidator.length("toolongpassword", 5, 10, "Password")

# --- Others ---
def test_not_none_fail():
    with pytest.raises(ValidationError):
        InputValidator.not_none(None, "Val")

def test_positive_fail():
    with pytest.raises(ValidationError):
        InputValidator.positive(-1, "Val")

def test_in_choices_fail():
    with pytest.raises(ValidationError):
        InputValidator.in_choices("A", ["B", "C"], "Val")
