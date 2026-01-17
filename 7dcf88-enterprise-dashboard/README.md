# Enterprise Dashboard

### 1. Run Tests on `repository_before` (Expect Failure)
```bash
docker compose run --build verify-before
```

### 2. Run Tests on `repository_after` (Expect Success)
```bash
docker compose run --build verify-after
```

### 3. Run Evaluation & Generate Report
```bash
docker compose run --build evaluate
```
