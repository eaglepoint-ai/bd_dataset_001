# Go Proxy Architectural Scalability & Performance Hardening

This repository demonstrates a Go-based proxy implementation with an architectural scalability and performance hardening framework. The `repository_before` directory represents the initial state, while `repository_after` contains the completed implementation.

## Requirements

- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/)

## Quick Start

### 1. Run Tests for `repository_before`

```bash
docker compose run --rm tests go run repository_before/main.go
```

### 2. Run Tests for `repository_after`

```bash
# No tests to run
```

### 3. Run Evaluations

```bash
docker compose run --rm tests go run evaluation/evaluation.go
```

## Projects

| Directory            | Description                                    |
| -------------------- | ---------------------------------------------- |
| `repository_before/` | Initial state                                  |
| `repository_after/`  | Completed implementation of the Go Proxy       |
| `tests/`             | Meta-test suite for the Go Proxy               |
| `evaluation/`        | Evaluation script to verify the implementation |
