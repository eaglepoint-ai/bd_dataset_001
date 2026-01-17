# Reusable Toast Notification System

This dataset task contains a professional-grade Vue 3 + TypeScript toast notification system. The objective is to provide a centralized, reactive, and aesthetic notification layer using the Composition API.

## Folder layout
- `repository_before/`: Baseline state (Empty/Placeholder).
- `repository_after/`: Mechanically refactored and fully implemented toast notification system.
- `tests/`: Comprehensive unit tests (Vitest) covering logic, rendering, and auto-dismissal.
- `patches/`: Diff between before and after implementations.
- `evaluation/`: Automated evaluation script and comparative reporting.

## Run with Docker

### Build image
```bash
docker compose build
```

### Run tests (After – expected all pass)
Verify the implementation in `repository_after` using the automated test runner:
```bash
docker compose up --build toast-app
```
**Expected behavior:**
- Functional & Requirement tests: ✅ PASS
- Exit code: 0

### Run evaluation (Compares both implementations)
Run the standardized evaluation comparing both implementations:
```bash
docker compose up --build evaluate --abort-on-container-exit
```
**This will:**
- Run tests for both `before` and `after` implementations.
- Run structure and equivalence tests.
- Generate a report at `evaluation/reports/latest.json`.

## Run locally

### Install dependencies
Navigate to the implementation directory:
```bash
cd repository_after
npm install
```

### Run all tests
Run the 8-case test suite in quiet mode:
```bash
npm test -- --run
```

## Regenerate patch

From repo root:
```bash
git diff --no-index repository_before repository_after > patches/task_001.patch
```
