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

The development of a linear programming solver requires a robust implementation of the Simplex Algorithm to handle standard and non-standard constraint types through the two-stage method. A Python class must be designed to manage simplex tableau matrices, correctly execute pivot operations, and transition between stages when artificial variables are introduced. Finally, this solver must accurately extract the optimal values for all decision variables from the final, optimized tableau state.

## Prompt Used

Implement a Simplex Algorithm solver for linear programming optimization problems. Create a Python class that operates on simplex tableaus (matrix representations of linear programs) to find optimal solutions for decision variables. The solver should handle both standard linear programs with less-than-or-equal-to constraints and non-standard programs with greater-than-or-equal-to or equality constraints using the two-stage simplex method. The implementation must correctly identify pivot elements, perform row operations to maintain tableau validity, transition between optimization stages when artificial variables are present, and extract the final optimal values for all decision variables from the completed tableau.

## Requirement

Criteria that must be met for this task

1. accept tableau as numpy array with float64 dtype and validate RHS values are non-negative
2. Support both maximization and minimization objective functions
3. Handle decision variables, slack variables, and artificial variables
4. Implement pivot selection using ratio test (minimum quotient rule)
5. Perform pivot operations to transform tableau with proper row operations
6. Support two-stage simplex for non-standard constraints (>=, =)
7. Detect optimal solution when no improving pivots exist
8. Extract final variable values from basic feasible solution in optimal tableau
9. Prevent infinite cycling with maximum iteration limit
10. Generate appropriate column labels (x1, x2, s1, s2, etc.) for variables
11. Return solution as dictionary mapping variable names to their optimal values

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
