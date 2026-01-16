# Task Scheduler

A Python-based task scheduling system that assigns tasks across multiple days while respecting time windows and dependency constraints.

## Problem Overview

The scheduler reads task definitions from a JSON file (`task.json`) where each task has:
- **duration**: How long the task takes (in hours)
- **earliest**: Earliest start time (hour of day, 0-24)
- **latest**: Latest finish time (hour of day, 0-24)
- **after**: (Optional) Task must start after this task completes
- **not_same_day_as**: (Optional) Task cannot be on the same day as this task

## Project Structure

```
├── repository_before/     # Original buggy code
│   ├── scheduler.py
│   └── task.json
├── repository_after/      # Fixed code
│   ├── scheduler.py
│   └── task.json
├── tests/                 # Test suite
│   └── test_scheduler.py
├── evaluation/            # Evaluation scripts
│   ├── evaluation.py
│   └── reports/          # Generated reports (YYYY-MM-DD/HH-MM-SS/)
├── patches/               # Diff between before/after
│   └── diff.patch
├── trajectory/            # Development notes
│   └── trajectory.md
├── Dockerfile
├── docker-compose.yml
└── requirements.txt
```

## Issues Fixed

The original `repository_before/scheduler.py` had these critical bugs:

1. **File path handling**: Used `open("task.json")` which fails when run from different directories
2. **Null value handling**: `task.get("earliest", 0)` returns `None` for explicit null values, causing TypeError
3. **Infinite recursion**: `not_same_day_as` constraint called itself without a base case
4. **Global state**: Poor management of the `day` variable
5. **Missing validation**: No checks for invalid time windows, circular dependencies, or missing fields
6. **No error handling**: Missing required JSON fields caused cryptic errors

## Quick Start

### Run Locally

```bash
# Run the fixed scheduler
cd repository_after
python3 scheduler.py

# Run the broken scheduler (will crash with RecursionError)
cd repository_before
python3 scheduler.py
```

### Run Tests

```bash
# Test the before version
python3 tests/test_scheduler.py repository_before/scheduler.py "BEFORE"

# Test the after version
python3 tests/test_scheduler.py repository_after/scheduler.py "AFTER"
```

### Run Evaluation

```bash
# Run full evaluation (generates report)
python3 evaluation/evaluation.py
```

## Docker Commands

### Build the Docker Image

```bash
docker build -t task-scheduler .
```

### Run Individual Services

```bash
# Run tests on the BEFORE version (buggy)
docker compose run --rm test-before

# Run tests on the AFTER version (fixed)
docker compose run --rm test-after

# Run full evaluation (compares before and after)
docker compose run --rm evaluation
```

### Run All Services

```bash
# Run all services (tests + evaluation)
docker compose up
```

### Clean Up

```bash
# Remove containers and images
docker compose down --rmi all

# Remove orphaned containers
docker compose down --remove-orphans
```

## Test Results

| Version | Tests Passed | Pass Rate |
|---------|--------------|-----------|
| Before  | 3/9          | 33%       |
| After   | 9/9          | 100%      |

**Improvements**: +6 tests fixed, +66.7% pass rate

## Example Output

### Fixed Scheduler Output

```
Scheduling process:

Scheduling 'Task A'...
  ✓ Scheduled 'Task A' on Day 1, 8:00 to 10:00

Scheduling 'Task B'...
  ✓ Scheduled 'Task B' on Day 1, 10:00 to 11:00

Scheduling 'Task C'...
  Moving 'Task C' to day 2 (not_same_day_as 'Task A')
  ✓ Scheduled 'Task C' on Day 2, 0:00 to 0.5:00

==================================================
Final Schedule:
==================================================
Day 1: Task A -> 8:00 to 10:00
Day 1: Task B -> 10:00 to 11:00
Day 2: Task C -> 0:00 to 0.5:00
```

## Reports

Evaluation reports are generated in:
```
evaluation/reports/YYYY-MM-DD/HH-MM-SS/
├── report.json      # Machine-readable results
├── report.txt       # Human-readable summary
├── before_results.json
└── after_results.json
```

## License

MIT

### Report Schema

```json
{
  "run_id": "uuid",
  "started_at": "ISO-8601",
  "finished_at": "ISO-8601",
  "duration_seconds": 0.0,
  "environment": {
    "python_version": "3.x",
    "platform": "os-arch"
  },
  "before": {
    "tests": {},
    "metrics": {}
  },
  "after": {
    "tests": {},
    "metrics": {}
  },
  "comparison": {},
  "success": true,
  "error": null
}
```

The developer should add any additional metrics and keys that reflect the runs (e.g., data seeded to test the code on before/after repository).

---

## Final README Contents
> **Note:** Replace the template content above with the following sections before pushing:

1. **Problem Statement**
2. **Prompt Used**
3. **Requirements Specified**
4. **Commands:**
   - Commands to spin up the app and run tests on `repository_before`
   - Commands to run tests on `repository_after`
   - Commands to run `evaluation/evaluation.py` and generate reports
   
   > **Note:** For full-stack app tasks, the `repository_before` commands will be empty since there is no app initially.
