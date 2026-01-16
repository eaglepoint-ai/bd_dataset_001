# Github Org Client Tests

## Problem Statement

The existing test suite for the GithubOrgClient class provides only partial coverage of the class functionality, focusing mainly on the org method and the _public_repos_url property. Important behaviors such as retrieving public repositories, filtering repositories by license, and validating license data are not currently tested. This lack of test coverage increases the risk that bugs or regressions in these untested methods could go unnoticed during future changes. Additionally, without tests for edge cases and error handling, the reliability of the client cannot be fully verified. To ensure the correctness and stability of the GithubOrgClient implementation, additional unit tests are required to extend coverage while preserving all existing tests and maintaining the current testing structure.

## Prompt

**Role:** Senior Software Engineer

**Context:** You need to extend the test suite for the GithubOrgClient class to achieve full coverage of its functionality. This includes testing the public_repos method, license filtering, the has_license static method, and handling edge cases with empty or invalid data. All tests must use the unittest framework, mock external API calls to avoid real HTTP requests, and preserve the existing test structure without modifying the GithubOrgClient implementation.

**Scale Assumptions:**

- Tests must run efficiently without network calls
- Test suite should cover all public methods and edge cases
- Maintain existing test style and structure
- Ensure no regressions in existing functionality

## Core Requirements (Must Implement)

1. All existing tests must remain unchanged.
2. New unit tests must be added to the current test file.
3. The unittest framework must continue to be used.
4. No real HTTP requests to GitHub are allowed.
5. All external API calls must be mocked.
6. The public_repos method must be fully tested.
7. Repository filtering by license must be tested.
8. The has_license method must be tested for true cases.
9. The has_license method must be tested for false cases.
10. Edge cases with empty data must be tested.
11. Missing or invalid fields must be handled in tests.
12. Tests must follow the existing coding style.
13. No changes to the GithubOrgClient code are allowed.
14. The final test file must run successfully with unittest.

## Constraints

- Do NOT make real HTTP requests to GitHub
- Do NOT modify the GithubOrgClient implementation
- Do NOT change existing tests
- Must use unittest framework
- Must mock all external API calls
- Must preserve existing test structure and coding style
- Tests must handle edge cases and invalid data gracefully

## Acceptance Criteria

1. All existing tests pass unchanged.
2. New tests cover public_repos method comprehensively.
3. License filtering functionality is tested.
4. has_license method tested for both true and false cases.
5. Edge cases (empty data, missing fields) are handled.
6. No real network calls are made during testing.
7. Test file runs successfully with unittest.
8. Code follows existing style and structure.

## Requirements Summary

1. **Preserve Existing Tests** - No modifications to current test suite
2. **Add New Tests** - Extend coverage for untested methods
3. **Mock API Calls** - Use unittest.mock for external dependencies
4. **Test public_repos** - Full coverage including license filtering
5. **Test has_license** - Both positive and negative cases
6. **Handle Edge Cases** - Empty data, invalid fields
7. **No Code Changes** - GithubOrgClient remains unmodified
8. **Unittest Framework** - Continue using existing testing approach

## Commands

### Run the build image
```bash
docker compose build
```

### Run tests (before – expected to fail)
```bash
docker compose run --rm -e PYTHONPATH=/app/repository_before app pytest -q
```

### Run tests (after – expected all pass)
```bash
docker compose run --rm -e PYTHONPATH=/app/repository_after app pytest -q
```

### Run evaluation (compares both implementations)
```bash
docker compose run --rm -e PYTHONPATH=/app/repository_after app python evaluation/evaluation.py
```

This will:
- Run tests for the after implementation
- Generate a report at `evaluation/report/YYYY-MM-DD/HH-MM-SS/report.json`
