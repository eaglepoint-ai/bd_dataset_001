from typing import Optional, Dict, Any
from error_handling_lib.enums.error_types import ErrorCategory, ErrorSeverity
from error_handling_lib.errors.base import CategorizedError

class ValidationError(CategorizedError):
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message, ErrorCategory.VALIDATION, ErrorSeverity.MEDIUM, details)

class TypeError(CategorizedError):
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message, ErrorCategory.TYPE, ErrorSeverity.MEDIUM, details)

class RangeError(CategorizedError):
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message, ErrorCategory.RANGE, ErrorSeverity.MEDIUM, details)

class NetworkError(CategorizedError):
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message, ErrorCategory.NETWORK, ErrorSeverity.HIGH, details)

class DatabaseError(CategorizedError):
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message, ErrorCategory.DATABASE, ErrorSeverity.CRITICAL, details)

class FileSystemError(CategorizedError):
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message, ErrorCategory.FILE_SYSTEM, ErrorSeverity.HIGH, details)

class AuthError(CategorizedError):
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message, ErrorCategory.AUTH, ErrorSeverity.CRITICAL, details)

class BusinessLogicError(CategorizedError):
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message, ErrorCategory.BUSINESS_LOGIC, ErrorSeverity.MEDIUM, details)

class SystemError(CategorizedError):
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message, ErrorCategory.SYSTEM, ErrorSeverity.CRITICAL, details)

class UnknownError(CategorizedError):
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message, ErrorCategory.UNKNOWN, ErrorSeverity.LOW, details)