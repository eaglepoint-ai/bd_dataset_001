# Docker Commands

All Docker commands for testing and evaluating the application.

## Build the Docker Image

```bash
docker compose build
```

## Run Evaluation (Complete Test)

This runs the full evaluation which tests everything and generates a report:

```bash
docker compose run --rm app python evaluation/evaluation.py
```

## Individual Test Commands

### Test 1: Verify repository_before Files

```bash
docker compose run --rm app python3 -c "import os; from pathlib import Path; root = Path('/app'); files = ['repository_before/Resources/html/form.html', 'repository_before/Resources/html/formdisplay.html', 'repository_before/Resources/js/formgenerator.js', 'repository_before/Resources/js/formdisplay.js']; missing = [f for f in files if not (root / f).exists()]; exit(0 if not missing else 1)"
```

### Test 2: Run Tests on repository_after

This installs dependencies, runs type checking, and runs Jest tests:

```bash
docker compose run --rm app sh -c "cd repository_after && npm ci && npm run type-check && npm test -- --passWithNoTests --ci"
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
