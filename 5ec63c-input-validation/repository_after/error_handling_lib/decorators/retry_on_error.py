from functools import wraps
import time
from typing import Callable, Optional, Tuple, Type, Union

from ..errors.base import CategorizedError
from ..enums.error_types import ErrorCategory, ErrorSeverity
from ..handlers.error_handler import ErrorHandler


def retry_on_error(
    max_retries: int = 3,
    retryable_categories: Optional[set[ErrorCategory]] = None,
    retryable_exceptions: Optional[tuple[Type[Exception], ...]] = None,
    backoff_factor: float = 1.0,           # exponential backoff multiplier
    min_wait: float = 0.5,                 # seconds
    max_wait: float = 30.0,
    handler: Optional[ErrorHandler] = None,
    raise_final: bool = True
) -> Callable:
    """
    Decorator that retries the function on specific error categories/exceptions.

    Args:
        max_retries: Maximum number of retry attempts (not counting initial)
        retryable_categories: Set of ErrorCategory values that are retryable
        retryable_exceptions: Additional exception types to retry on
        backoff_factor: Multiplier for exponential backoff
        min_wait / max_wait: Range of sleep time between retries
        handler: ErrorHandler instance (if None → uses default)
        raise_final: Whether to raise the last exception after all retries fail
    """
    if retryable_categories is None:
        retryable_categories = {
            ErrorCategory.NETWORK,
            ErrorCategory.DATABASE,
            ErrorCategory.FILE_SYSTEM,
            ErrorCategory.UNKNOWN
            # Add more transient-like categories as needed
        }

    if retryable_exceptions is None:
        retryable_exceptions = (CategorizedError,)

    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            active_handler = handler or ErrorHandler.get_default()
            last_exc = None

            for attempt in range(max_retries + 1):
                try:
                    return func(*args, **kwargs)

                except retryable_exceptions as exc:
                    last_exc = exc

                    # Check if this error is retryable
                    if isinstance(exc, CategorizedError):
                        if exc.category not in retryable_categories:
                            raise  # immediately raise non-retryable categorized errors

                    # Log the attempt
                    active_handler.handle(
                        exc,
                        extra_info={
                            "retry_attempt": attempt,
                            "max_retries": max_retries
                        }
                    )

                    if attempt == max_retries:
                        # Last attempt failed
                        if raise_final:
                            raise
                        return None

                    # Calculate exponential backoff with jitter
                    wait_time = min(
                        max_wait,
                        min_wait * (backoff_factor ** attempt)
                    )
                    time.sleep(wait_time)

            # Should not reach here if raise_final=True
            return None

        return wrapper

    return decorator