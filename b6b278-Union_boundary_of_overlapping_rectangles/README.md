# project template

Starter scaffold for bd dataset task.

## Structure

- repository_before/: baseline code (`__init__.py`)
- repository_after/: optimized code (`__init__.py`)
- tests/: test suite (`__init__.py`)
- evaluation/: evaluation scripts (`evaluation.py`)
- instances/: sample/problem instances (JSON)
- patches/: patches for diffing
- trajectory/: notes or write-up (Markdown)

---

## Template Instructions

> **Note:** The task gen team should delete this section after creating the task.

### Setup Steps

1. **Create a directory** with the format: `uuid-task_title`

   - Task title words should be joined by underscores (`_`)
   - UUID and task title should be joined with a dash (`-`)
   - Example: `5g27e7-My_Task_Title`

2. **Update `instances/instance.json`** — the following fields are empty by default; fill in appropriate values:

   - `"instance_id"`
   - `"problem_statement"`
   - `"github_url"`

3. **Update `.gitignore`** to reflect your language and library setup

4. **Add `reports/` inside `evaluation/` to `.gitignore`**
   - Each report run should be organized by date/time

---

## Reports Generation

> **Note:** The developer should delete this section after completing the task before pushing to GitHub.

When the evaluation command is run, it should generate reports in the following structure:

```
evaluation/
└── reports/
    └── YYYY-MM-DD/
        └── HH-MM-SS/
            └── report.json
```

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

## Problem Statement

```
The core of the issue is an IndexError caused by a logical assumption that every point in your shape's boundary has exactly two connections (one leading in and one leading out). In the function, the code attempts to access neighbors[1] to find the next point in the path; however, because the sweep-line logic generates some segments that don't perfectly align or form "dead ends," the program encounters points with only a single neighbor. When the list contains only one item, trying to access the second index (index 1) fails, crashing the script.
```

## Prompt Used

```
Create a Python function to calculate the outer boundary (the union) of multiple overlapping rectangles.
Data Structures:
Input: An array of Rectangle objects: { x: number; y: number; width: number; height: number; }.
Output: An array of Point objects: { x: number; y: number; } representing the vertices of the bounding path.
Constraints & Requirements:
Coordinate System: Origin (0,0) is top-left.
Algorithm: Use a Sweep-line algorithm (or an efficiency-equivalent approach like a Scanline) to ensure the solution scales better than $O(N^2)$.
Holes & Islands: * If the rectangles form multiple disconnected groups (islands), the function should return an array of paths (an array of point arrays).
Clearly specify if internal ""holes"" (empty spaces surrounded by rectangles) should be ignored or returned as separate paths.
Edge Cleaning: The path should be ""tight."" Consecutive collinear points (e.g., three points in a straight line) must be simplified into a single line segment by removing the middle point.
Edge Cases: Handle cases with zero-width/height rectangles, perfectly adjacent rectangles (touching but not overlapping), and identical overlapping rectangles.
```

## Requirements

Criteria that must be met for this task

1. Computes the union of all rectangles using an efficient algorithm (e.g., sweep-line or scanline) with better-than-O(N²) complexity.
2. If the rectangles form multiple disconnected regions, return a separate boundary path for each region.
3. The resulting boundary must be cleaned by removing unnecessary collinear points so that each path is minimal.
4. Handle edge cases such as:
5. Rectangles with zero width or height
6. Rectangles that exactly touch at edges or corners
7. Fully or partially overlapping identical rectangles

## Commands

### Run with Docker

### Build image

```bash
docker compose build
```

### Run tests before

- No repository_before

### Run test for after

```bash
docker compose run --rm app pytest -v

```

**Expected behavior:**

- All test cases are expected to pass for all edge cases

#### Run evaluation

This will show the detail for repository_after test (we don't have repository_before).

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
