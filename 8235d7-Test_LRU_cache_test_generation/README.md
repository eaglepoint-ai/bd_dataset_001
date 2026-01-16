# LRU Cache Test Generation

This repository demonstrates an LRU Cache implementation with a meta-testing framework. The `repository_before` directory represents the initial state, while `repository_after` contains the completed implementation.

## Requirements

- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/)

## Quick Start

### 1. Run Tests for `repository_before`

There are no tests for the initial state.

```bash
# No tests to run
```

### 2. Run Tests for `repository_after`

```bash
docker compose run --rm tests pytest tests/meta_test.py
```

### 3. Run Evaluations

```bash
docker compose run --rm tests python evaluation/evaluation.py
```

## Projects

| Directory            | Description                                    |
| -------------------- | ---------------------------------------------- |
| `repository_before/` | Initial state                                  |
| `repository_after/`  | Completed implementation of the LRU Cache      |
| `tests/`             | Meta-test suite for the LRU Cache              |
| `evaluation/`        | Evaluation script to verify the implementation |
