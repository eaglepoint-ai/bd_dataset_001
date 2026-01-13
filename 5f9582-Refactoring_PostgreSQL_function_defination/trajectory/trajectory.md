# Engineering Trajectory

## Analysis

The prompt required refactoring a PostgreSQL PL/pgSQL function while preserving
and validating correctness through automated testing.

Initial analysis revealed that:
- The function performed name validation and normalization
- Unicode handling was incorrect
- Whitespace normalization was broken
- Array processing used invalid SQL constructs
- Error signaling was inconsistent with PostgreSQL semantics

The task therefore required both:
1. Correcting the database function
2. Designing an evaluation system that proves correctness objectively

---

## Strategy

I chose a test-driven refactor strategy using:

- A real PostgreSQL database (not mocks)
- Docker Compose for environment isolation
- Pytest for correctness assertions
- A before/after repository comparison model

This approach ensures:
- Deterministic, reproducible results
- Clear demonstration of improvement
- No reliance on local developer setup

Tests were written to assert:
- Unicode name acceptance
- Empty name rejection
- Whitespace normalization
- Maximum name part limits

---

## Execution

### 1. Environment Setup

- Created a Docker Compose stack with:
  - PostgreSQL 15
  - A Python test runner container
- Used health checks to ensure DB readiness

### 2. Test Design

- Implemented pytest fixtures for:
  - Database connections
  - Schema setup
  - Dynamic repository selection via `REPO_UNDER_TEST`
- Ensured each test runs against a clean schema

### 3. Refactor Implementation

Key fixes in the refactored function included:
- Proper Unicode-safe regular expressions
- Correct array filtering using PostgreSQL-supported syntax
- Consistent exception types
- Robust whitespace normalization logic

### 4. Evaluation Automation

- Built an evaluation runner that:
  - Executes tests against both repositories
  - Captures stdout, return codes, and timing
  - Produces a structured JSON report
- Added a Makefile interface for one-command execution

---

## Resources

- PostgreSQL PL/pgSQL Documentation  
  https://www.postgresql.org/docs/current/plpgsql.html

- PostgreSQL Error Codes
  https://www.postgresql.org/docs/current/errcodes-appendix.html

- PostgreSQL Array Functions  
  https://www.postgresql.org/docs/current/functions-array.html

- Pytest Documentation  
  https://docs.pytest.org/

- Docker Compose  
  https://docs.docker.com/compose/

---

## Outcome

The refactored implementation passes all correctness tests while
the original implementation fails as expected.

The solution is fully reproducible, isolated, and suitable for
automated evaluation and peer review.
