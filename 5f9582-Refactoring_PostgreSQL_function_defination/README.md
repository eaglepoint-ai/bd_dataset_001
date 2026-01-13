# Refactoring PostgreSQL Function Definition

This repository demonstrates a correctness-preserving refactor of a PostgreSQL
PL/pgSQL function that validates and formats student names.

The project includes:
- A real PostgreSQL database running in Docker
- Deterministic pytest-based correctness tests
- A before/after repository comparison
- An automated evaluation gate

---

## Repository Structure

├── `repository_before/` # Original (buggy) SQL implementation
├── `repository_after/` # Refactored and corrected SQL implementation
├── `tests/` # Pytest correctness tests
├── `evaluation/` # Automated evaluation runner & reports
├── `docker-compose.yml` # PostgreSQL + test runner
├── `Dockerfile` # Test environment
├── `Makefile` # One-command execution
└── `trajectory/trajectory.md`


---

## Requirements

- Docker
- Docker Compose
- Make

No local Python or PostgreSQL installation is required.

---

## Running Tests

### Run tests against the corrected implementation (default)

```bash
make test
```

### Run tests against the original implementation (expected to fail)

```
make test-before
```

### Run tests against the refactored implementation only

```
make test-after
```

## Run Full Evaluation

The evaluation compares `repository_before` and `repository_after`
and produces a structured JSON report.

```
make evaluate
```

### Report output:

```
evaluation/reports/report.json
```

### Notes

- PostgreSQL error logs during tests are expected.

- Tests assert correct failure behavior as part of validation.

- The database is fully isolated and disposable.

### Result

The refactored implementation passes all correctness tests while
the original implementation fails, demonstrating a successful refactor.
