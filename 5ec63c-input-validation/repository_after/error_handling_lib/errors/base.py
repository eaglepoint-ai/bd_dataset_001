import datetime
from typing import Optional, Dict, Any
from error_handling_lib.enums.error_types import ErrorCategory, ErrorSeverity

class CategorizedError(Exception):
    """
    Base class for all categorized errors in the library.
    """
    def __init__(
        self,
        message: str,
        category: ErrorCategory,
        severity: ErrorSeverity,
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(message)
        self.message = message
        self.category = category
        self.severity = severity
        self.details = details or {}
        self.timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat()

    def to_dict(self) -> Dict[str, Any]:
        """
        Returns a dictionary representation of the error, suitable for JSON serialization.
        """
        return {
            "message": self.message,
            "category": self.category.value,
            "severity": self.severity.value,
            "details": self.details,
            "timestamp": self.timestamp
        }