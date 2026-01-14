# HFT Bridge Bit-Perfect Mechanical Refactor

This repository demonstrates an HFT bridge implementation with a focus on bit-perfect mechanical refactoring. The `repository_before` directory represents the initial state, while `repository_after` contains the completed implementation.

## Requirements

- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/)

## Quick Start

### 1. Run Tests for `repository_before`

```bash
docker compose run --rm tests python repository_before/hft_parity_refactor.py
```

### 2. Run Tests for `repository_after`

```bash
# No tests to run
```

### 3. Run Evaluations

```bash
docker compose run --rm tests python evaluation/evaluation.py
```

## Projects

| Directory            | Description                                    |
| -------------------- | ---------------------------------------------- |
| `repository_before/` | Initial state with legacy HFT bridge logic     |
| `repository_after/`  | Refactored implementation with behavior parity |
| `tests/`             | Meta-test suite for parity verification        |
| `evaluation/`        | Evaluation script to verify the implementation |
