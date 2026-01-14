# Hardened Zero Knowledge Authentication Module

This repository contains a secure, zero-knowledge authentication system implementation. It refactors a legacy insecure system to use the Web Crypto API, immutable storage, and constant-time comparisons.

## Requirements

- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/)

## Quick Start

### 1. Run Tests for `repository_before`

```bash
docker compose run --rm tests node repository_before/AuthModule.js
```

### 2. Run Tests for `repository_after`

```bash
# No command specified
```

### 3. Run Evaluations

```bash
# No command specified
```

## Projects

| Directory            | Description              |
| -------------------- | ------------------------ |
| `repository_before/` | Initial state (Insecure) |
| `repository_after/`  | Completed implementation |
| `tests/`             | Test suite               |
| `evaluation/`        | Evaluation scripts       |
