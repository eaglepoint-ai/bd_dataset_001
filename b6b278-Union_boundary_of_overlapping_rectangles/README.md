# Union Boundary of Overlapping Rectangles

## Commands

### Run tests before

- No repository_before

### Run test for after

```bash
docker compose run --rm app pytest -v

```

#### Run evaluation

This will show the detail for repository_after test (we don't have repository_before).

```bash
docker compose run --rm app python evaluation/evaluation.py
```

### Generate patch

From repo root:

```bash
git diff --no-index repository_before repository_after > patches/task_001.patch
```
