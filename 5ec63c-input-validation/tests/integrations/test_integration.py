import pytest
from error_handling_lib.handlers.error_handler import ErrorHandler
from error_handling_lib.validators.input_validator import InputValidator
from error_handling_lib.decorators import safe_execute
from error_handling_lib.errors.specific_errors import ValidationError

def test_full_integration_flow():
    # 1. Setup Handler
    handler = ErrorHandler()
    
    # 2. Define Protected Function
    @safe_execute(error_handler=handler)
    def register(age):
        InputValidator.range(age, 18, 100, "Age")
        return "Registered"

    # 3. Success Case
    assert register(25) == "Registered"
    assert handler.stats["total"] == 0

    # 4. Failure Case (Validation Fail -> Error -> Safe Execute Catch -> Handler Log)
    res = register(10) # Too young
    assert res is None # safe_execute returns None on error by default
    
    # 5. Verify Stats
    assert handler.stats["total"] == 1
    assert handler.stats["by_category"]["VALIDATION"] == 1
    assert "Age must be between" in handler.history[0]["message"]
