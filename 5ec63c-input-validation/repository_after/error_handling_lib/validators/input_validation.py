import re
from typing import Any, Optional, Union

from ..errors.specific_errors import ValidationError, RangeError, TypeError


def not_none(value: Any, field_name: str = "value") -> None:
    """Ensure the value is not None."""
    if value is None:
        raise ValidationError(
            f"{field_name} cannot be None",
            details={
                "field": field_name,
                "received_value": None,
                "expected": "not None",
                "type_received": type(value).__name__
            }
        )


def not_empty(value: Any, field_name: str = "value") -> None:
    """Ensure the value is neither None nor empty (for types with length)."""
    not_none(value, field_name)

    if hasattr(value, "__len__") and len(value) == 0:
        raise ValidationError(
            f"{field_name} cannot be empty",
            details={
                "field": field_name,
                "received_value": value,
                "received_length": 0,
                "expected": "non-empty",
                "type": type(value).__name__
            }
        )


def type_check(
    value: Any,
    expected_type: Union[type, tuple[type, ...]],
    field_name: str = "value"
) -> None:
    """Verify that value is of the expected type(s)."""
    if not isinstance(value, expected_type):
        expected_str = (
            str(expected_type)
            if isinstance(expected_type, type)
            else f"one of {tuple(t.__name__ for t in expected_type)}"
        )

        raise TypeError(
            f"Invalid type for {field_name}: expected {expected_str}, got {type(value).__name__}",
            details={
                "field": field_name,
                "received_value": value,
                "received_type": type(value).__name__,
                "expected_type": expected_str
            }
        )


def positive(
    value: Union[int, float],
    field_name: str = "value",
    strict: bool = False  # False → ≥ 0, True → > 0
) -> None:
    """Check if value is positive (or non-negative if not strict)."""
    type_check(value, (int, float), field_name)

    limit = 0 if not strict else 0.0000000001  # small epsilon for float comparison

    if value < limit:
        message = f"{field_name} must be strictly positive (> 0)" if strict else f"{field_name} must be non-negative (≥ 0)"

        raise RangeError(
            message,
            details={
                "field": field_name,
                "received_value": value,
                "minimum_allowed": 0 if not strict else "greater than 0",
                "strict": strict
            }
        )


def in_range(
    value: Union[int, float],
    min_val: Optional[Union[int, float]] = None,
    max_val: Optional[Union[int, float]] = None,
    field_name: str = "value",
    inclusive: bool = True
) -> None:
    """Check if value is within the specified range [min_val, max_val]."""
    type_check(value, (int, float), field_name)

    if min_val is not None:
        if (inclusive and value < min_val) or (not inclusive and value <= min_val):
            raise RangeError(
                f"{field_name} is below the minimum ({min_val})",
                details={
                    "field": field_name,
                    "received_value": value,
                    "minimum_allowed": min_val,
                    "inclusive": inclusive
                }
            )

    if max_val is not None:
        if (inclusive and value > max_val) or (not inclusive and value >= max_val):
            raise RangeError(
                f"{field_name} exceeds the maximum ({max_val})",
                details={
                    "field": field_name,
                    "received_value": value,
                    "maximum_allowed": max_val,
                    "inclusive": inclusive
                }
            )


def length(
    value: Any,
    min_len: Optional[int] = None,
    max_len: Optional[int] = None,
    field_name: str = "value"
) -> None:
    """Validate length of a value that supports len()."""
    if not hasattr(value, "__len__"):
        raise TypeError(
            f"Cannot check length of {field_name} (type has no __len__)",
            details={"field": field_name, "type_received": type(value).__name__}
        )

    current_len = len(value)

    if min_len is not None and current_len < min_len:
        raise ValidationError(
            f"{field_name} is too short (length {current_len}, minimum {min_len})",
            details={
                "field": field_name,
                "received_value": value,
                "received_length": current_len,
                "minimum_length": min_len
            }
        )

    if max_len is not None and current_len > max_len:
        raise ValidationError(
            f"{field_name} is too long (length {current_len}, maximum {max_len})",
            details={
                "field": field_name,
                "received_value": value,
                "received_length": current_len,
                "maximum_length": max_len
            }
        )


EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')


def email(value: str, field_name: str = "email") -> None:
    """Validate email format."""
    type_check(value, str, field_name)

    if not EMAIL_REGEX.match(value):
        raise ValidationError(
            f"Invalid email format for {field_name}",
            details={
                "field": field_name,
                "received_value": value,
                "expected_format": "standard email (user@domain.tld)"
            }
        )


# You can follow the same pattern for:
# - url
# - phone_number
# - alphanumeric
# - etc.