# Go Proxy Architectural Scalability & Performance Hardening

### 1. Run Tests for `repository_before`

```bash
docker compose run --rm tests go test -v ./tests -tags=before
```

### 2. Run Tests for `repository_after`

```bash
docker compose run --rm tests go test -v ./tests -tags=after
```

### 3. Run Evaluations

```bash
docker compose run --rm tests go run evaluation/evaluation.go --root .
```

## Generate patch

```bash
git diff --no-index repository_before repository_after > patches/task_001.patch
```
