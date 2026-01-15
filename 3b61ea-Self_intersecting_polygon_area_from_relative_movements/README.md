# Self-Intersecting Polygon Area Calculator

A Python script that computes the total enclosed area of a polygon traced by relative directional movements, handling self-intersecting paths correctly.

## Problem Statement

Design a generic Python script that computes the total enclosed area of a polygon traced by relative directional movements starting from the origin. The script must translate a sequence of (direction, distance) commands into Cartesian vertices, then accurately calculate the polygon's area using a robust implementation of the Shoelace Formula. Unlike simple polygons, the movement path may self-intersect, so the solution must correctly determine the absolute total area formed by all enclosed loops rather than relying on a signed net area, while remaining modular, reusable, and free of external numerical libraries.

## Prompt Used

Write a generic script that calculates the area of a polygon defined by a sequence of directional relative movements (UP, DOWN, LEFT, RIGHT). The script must include:

- **A Movement Processor**: A function that takes a starting coordinate (0,0) and a list of tuples (direction, distance) and converts them into a list of (x, y) vertices
- **The Shoelace Algorithm**: A robust implementation of the Shoelace Formula to calculate the area
- **Self-Intersection Logic**: Address the fact that the path crosses itself. Provide a method to calculate the absolute total area (sum of all enclosed loops) rather than just the signed net area

## Requirements Specified

| #   | Requirement                                                                                |
| --- | ------------------------------------------------------------------------------------------ |
| 1   | Accept a starting point at (0, 0) and a list of (direction, distance) tuples as input      |
| 2   | Convert relative movements (UP, DOWN, LEFT, RIGHT) into an ordered list of (x, y) vertices |
| 3   | Implement the Shoelace Formula manually using basic Python arithmetic and control flow     |
| 4   | Correctly handle self-intersecting paths by computing the absolute total enclosed area     |
| 5   | Avoid using external libraries (e.g., NumPy, Pandas, SciPy) for area computation           |
| 6   | Avoid hardcoding movement data inside functions; inputs must remain generic                |
| 7   | Encapsulate all logic within functions, with no reliance on global variables               |

## Project Structure

```
3b61ea-Self_intersecting_polygon_area_from_relative_movements/
├── repository_before/     # Baseline (empty implementation)
├── repository_after/      # Complete implementation
│   └── self_intersecting_polygon_area.py
├── tests/                 # Test suite
│   └── test_self_intersecting_polygon_area.py
├── evaluation/            # Evaluation scripts and reports
│   ├── evaluation.py
│   └── reports/
├── instances/             # Problem instance definition
│   └── instance.json
├── patches/               # Git patches
├── trajectory/            # Development notes
│   └── trajectory.md
├── Dockerfile
├── docker-compose.yml
└── requirements.txt
```

## Commands

### Run Tests on `repository_before`

> **Note:** `repository_before` contains only an empty `__init__.py` file (no implementation), so tests will fail.

```bash
# No tests to run - repository_before has no implementation
```

### Run Tests on `repository_after`

```bash
# Using docker-compose
docker-compose run --rm test-after

```

### Run Evaluation and Generate Reports

```bash
# Using docker-compose
docker-compose run --rm evaluatation

```

The evaluation script will:

1. Run all tests against `repository_after`
2. Print a summary to the terminal
3. Generate a JSON report at `evaluation/reports/latest.json`

## Report Schema

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
    "tests": {
      "passed": false,
      "return_code": -1,
      "output": "Skipped - no implementation"
    },
    "metrics": {}
  },
  "after": {
    "tests": {
      "passed": true,
      "return_code": 0,
      "output": "pytest output"
    },
    "metrics": {
      "lines_of_code": 210,
      "non_empty_lines": 175
    }
  },
  "comparison": {
    "passed_gate": true,
    "improvement_summary": "Implementation passed all correctness tests"
  },
  "success": true,
  "error": null
}
```
