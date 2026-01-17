import pytest
import ast
import os

# ---------------------------------------------------------------------------
# PATH CONFIGURATION
# ---------------------------------------------------------------------------
# We need to point to the actual location of the unit tests.
# Structure:
# /app
# ├── repository_after/
# │   └── test_message_scraper.py  <-- Target file
# └── tests/
#     └── test_repository_after.py <-- This file (Current location)

TEST_FILE_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), '..', 'repository_after', 'test_message_scraper.py')
)

def get_test_functions():
    """Parses the test file and returns a list of function definitions (Sync and Async)."""
    if not os.path.exists(TEST_FILE_PATH):
        pytest.fail(f"Could not find test file at: {TEST_FILE_PATH}")

    with open(TEST_FILE_PATH, "r") as f:
        tree = ast.parse(f.read())

    functions = []
    for node in ast.walk(tree):
        # FIX: Check for both FunctionDef (def) and AsyncFunctionDef (async def)
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)) and node.name.startswith("test_"):
            functions.append(node.name)
    return functions

def check_requirement(requirement_id, description, coverage_map, existing_tests):
    """Verifies that the required tests exist."""
    required_tests = coverage_map.get(requirement_id, [])
    if not required_tests:
        return False, f"Req {requirement_id}: No test mapped for '{description}'"

    found = any(test in existing_tests for test in required_tests)
    if not found:
        return False, f"Req {requirement_id}: FAILED. Missing test for '{description}'. Expected one of: {required_tests}"

    return True, f"Req {requirement_id}: PASSED. Covered by {required_tests}"

def test_requirements_coverage():
    """
    Meta-test to verify that the unit test file covers all 15 requirements.
    """
    existing_tests = get_test_functions()

    # Mapping Requirements to the specific Test Functions that cover them
    coverage_map = {
        1:  ['test_main_execution'],
        2:  ['test_multiple_channels_processing'],
        3:  ['test_happy_path_2024_message'],
        4:  ['test_ignore_messages_outside_2024'],
        5:  ['test_happy_path_2024_message'],
        6:  ['test_happy_path_2024_message'],
        7:  ['test_happy_path_2024_message'],
        8:  ['test_happy_path_2024_message'],
        9:  ['test_missing_optional_fields'],
        10: ['test_channel_invalid_error'],
        11: ['test_flood_wait_error'],
        12: ['test_flood_wait_error'],
        13: ['test_channel_invalid_error', 'test_generic_unexpected_exception'],
        14: ['test_happy_path_2024_message'],
        15: ['test_main_execution', 'test_happy_path_2024_message']
    }

    requirements_text = {
        1: "Connect to Telegram using valid API credentials",
        2: "Retrieve messages only from the specified channels",
        3: "Process only messages from the year 2024",
        4: "Ignore messages from other years",
        5: "Extract message details correctly",
        6: "Write extracted data to a CSV file",
        7: "Create the CSV file if it does not exist",
        8: "Include a header row in the CSV file",
        9: "Handle missing message fields gracefully",
        10: "Log errors for invalid channels",
        11: "Handle Telegram rate limit errors properly",
        12: "Wait and retry when a FloodWaitError occurs",
        13: "Continue processing after non-critical errors",
        14: "Support asynchronous execution",
        15: "Testable without real Telegram access"
    }

    errors = []
    print("\n=== Meta-Test Coverage Report ===")
    for req_id, desc in requirements_text.items():
        passed, message = check_requirement(req_id, desc, coverage_map, existing_tests)
        if not passed:
            errors.append(message)
        else:
            print(message) # Print passed tests for confirmation

    # Additional Verification: Check for mock usage and async keywords
    with open(TEST_FILE_PATH, "r") as f:
        content = f.read()

    if "mock" not in content.lower() and "patch" not in content.lower():
         errors.append("Req 15: FAILED. No mocks detected in test file.")

    if "async def" not in content:
        errors.append("Req 14: FAILED. No asynchronous tests detected.")

    assert not errors, f"Meta-test failed with {len(errors)} missing requirements:\n" + "\n".join(errors)