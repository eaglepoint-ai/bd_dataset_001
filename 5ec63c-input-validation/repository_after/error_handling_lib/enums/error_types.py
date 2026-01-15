from enum import Enum

class ErrorCategory(str, Enum):
    """
    Categorizes errors into specific domains for better filtering and handling.
    """
    VALIDATION = "VALIDATION"
    TYPE = "TYPE"
    RANGE = "RANGE"
    NETWORK = "NETWORK"
    DATABASE = "DATABASE"
    FILE_SYSTEM = "FILE_SYSTEM"
    AUTH = "AUTH"
    BUSINESS_LOGIC = "BUSINESS_LOGIC"
    SYSTEM = "SYSTEM"
    UNKNOWN = "UNKNOWN"

class ErrorSeverity(str, Enum):
    """
    Defines the severity level of an error to determine the urgency of the response.
    Ordered from lowest to highest urgency.
    """
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"