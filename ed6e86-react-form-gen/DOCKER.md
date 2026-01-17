# Docker Commands

All Docker commands for testing and evaluating the application.

## Build the Docker Image

```bash
docker compose build
```

## Commands for AQUILA Evaluator Interface

Use these commands in the AQUILA evaluator interface:

### BEFORE TEST COMMAND
```bash
docker compose run --rm app python check_before.py
```

**What it does:** Verifies that all required files exist in `repository_before` directory.

### AFTER TEST COMMAND
```bash
docker compose run --rm app sh /usr/local/bin/run-tests-after.sh
```

**What it does:** Runs TypeScript type checking and Jest tests on the `repository_after` implementation. (npm commands are in Dockerfile, not in commands)

### TEST & REPORT COMMAND
```bash
docker compose run --rm app python evaluation/evaluation.py
```

**What it does:** Runs the complete evaluation which:
- Tests both `repository_before` and `repository_after`
- Compares results
- Generates `report.json` in `evaluation/reports/report.json` (required by evaluator)
- Also creates `latest.json` in `evaluation/reports/latest.json`

## Run Evaluation (Complete Test)

This runs the full evaluation which tests everything and generates a report:

```bash
docker compose run --rm app python evaluation/evaluation.py
```

## Individual Test Commands

### Test 1: Verify repository_before Files

```bash
docker compose run --rm app python check_before.py
```

### Test 2: Run Tests on repository_after

This runs type checking and Jest tests (dependencies and npm commands are in Dockerfile):

```bash
docker compose run --rm app sh /usr/local/bin/run-tests-after.sh
```

### Test 3: Type Check Only

```bash
docker compose run --rm app sh /usr/local/bin/run-type-check.sh
```

### Test 4: Run Tests Only

```bash
docker compose run --rm app sh /usr/local/bin/run-test-only.sh
```

## View Reports

After running the evaluation, view the reports:

```bash
# View the main report (required by evaluator)
docker compose run --rm app cat evaluation/reports/report.json

# View the latest report
docker compose run --rm app cat evaluation/reports/latest.json
```

## Clean Up

Remove containers:

```bash
docker compose down
```

Remove containers and images:

```bash
docker compose down --rmi all
```

Full cleanup:

```bash
docker compose down --rmi all --volumes
docker system prune -f
```
