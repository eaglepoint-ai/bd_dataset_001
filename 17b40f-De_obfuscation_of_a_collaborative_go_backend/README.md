# De-obfuscation of a Collaborative Go Backend

This repository demonstrates a collaborative Go backend implementation requiring de-obfuscation. The `repository_before` directory represents the initial obfuscated state, while `repository_after` contains the completed de-obfuscated implementation.

## Requirements

- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/)

## Quick Start

### 1. Run Tests for `repository_before`

```bash
docker compose exec db sh -c "mongosh godoc --eval 'db.users.deleteMany({}); db.documents.deleteMany({})'" && docker compose run --rm tests go test -v ./...
```

### 2. Run Tests for `repository_after`

```bash
# No tests to run
```

### 3. Run Evaluations

```bash
docker compose run --rm tests go run ../evaluation/evaluation.go
```

## Projects

| Directory            | Description                                    |
| -------------------- | ---------------------------------------------- |
| `repository_before/` | Initial obfuscated state of the Go backend     |
| `repository_after/`  | De-obfuscated implementation with clean code   |
| `tests/`             | Meta-test suite for the Go backend             |
| `evaluation/`        | Evaluation script to verify the implementation |
