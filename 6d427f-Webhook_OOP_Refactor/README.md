# Webhook OOP Refactor

## Problem Statement
The existing webhook handler in api/webhook.py is implemented procedurally, with request processing, signature verification, validation logic, and database persistence all combined inside a single Flask route function. This design violates core OOP principles such as separation of concerns and single responsibility, making the code difficult to maintain, extend, and unit test. Changes to any part of the logic require modifying the entire function, increasing complexity and risk of regressions. Additionally, the current tests in tests/test_webhook.py mirror this procedural structure and lack modularity. Both the webhook implementation and its tests must be refactored into a clean, object-oriented architecture while preserving existing behavior and functionality.

## Requirements
1. The webhook implementation must be refactored to follow Object-Oriented Programming principles.
2. Business logic must be moved out of the Flask route into dedicated class-based components.
3. Signature verification must be encapsulated within a reusable service or utility class.
4. Payload validation logic must be separated from HTTP request handling.
5. Database interaction must be handled through an independent class or layer.
6. The Flask route must act only as a thin controller that delegates processing to classes.
7. Dependency injection should be used to improve modularity and testability.
8. The refactored code must preserve all existing functional behavior and response formats.
9. No external libraries or frameworks may be introduced during the refactor.
10. Existing unit tests must be refactored to align with the new OOP-based design.
11. All current test scenarios must continue to pass after refactoring.
12. Tests must remain deterministic and isolated from real database dependencies.
13. Database operations in tests must continue to be properly mocked.
14. No changes may be made to the public API contract or endpoint behavior.
15. The final design must be clean, maintainable, and production-ready.

## Commands

### Run Tests on Original Code (`repository_before`)
```bash
docker compose run test-before
```
*Note: This is expected to fail on `test_database_error_handling` due to a bug in the original test implementation.*

### Run Tests on Refactored Code (`repository_after`)
```bash
docker compose run test-after
```

### Run Evaluation
This command runs both test suites and generates a report comparing them.
```bash
docker compose run evaluation
```

### Run Meta-Test
Verifies that the refactored test suite covers all scenarios from the original suite.
```bash
docker compose run meta_test
```
