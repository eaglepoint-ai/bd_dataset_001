# Advanced ASCII Art Generator

### Run with Docker

### Build image

```bash
docker compose build
```

### Run tests before

- No repository_before

### Run tests after

```bash
docker compose run --rm app pytest -v

```

#### Run evaluation

```bash
docker compose run --rm app python evaluation/evaluation.py
```

This will:

- Run tests for after implementations
- Run structure and equivalence tests
- Generate a report at `evaluation/YYYY-MM-DD/HH-MM-SS/report.json`

#### Run evaluation with custom output file

```bash
docker compose run --rm app python evaluation/evaluation.py --output /path/to/custom/report.json
```

### Generate patch

From repo root:

```bash
git diff --no-index repository_before repository_after > patches/task_001.patch
```
