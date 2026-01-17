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
docker compose run --rm app sh -c "cd repository_after && npm run type-check && npm test -- --passWithNoTests --ci"
```

**What it does:** Runs TypeScript type checking and Jest tests on the `repository_after` implementation.

### TEST & REPORT COMMAND
```bash
docker compose run --rm app python evaluation/evaluation.py
```

**What it does:** Runs the complete evaluation which:
- Tests both `repository_before` and `repository_after`
- Compares results
- Generates `report.json` in the project root (required by evaluator)
- Also creates timestamped reports in `evaluation/reports/YYYY-MM-DD/HH-MM-SS/report.json`

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

This runs type checking and Jest tests (dependencies are already installed in Dockerfile):

```bash
docker compose run --rm app sh -c "cd repository_after && npm run type-check && npm test -- --passWithNoTests --ci"
```

### Test 3: Type Check Only

```bash
docker compose run --rm app sh -c "cd repository_after && npm run type-check"
```

### Test 4: Run Tests Only
  
  docker compose run test
  
```bash
docker compose run --rm app sh -c "cd repository_after && npm test -- --ci"
```

## View Reports

After running the evaluation, view the latest report:

```bash
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
