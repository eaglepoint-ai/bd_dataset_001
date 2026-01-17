# Piecewise Potential Barrier Kinematics

This dataset task contains a Python kinematics simulation for a dual-zone gravitational field. The objective is to correctly compute time-to-impact and final velocity for an object released from rest, accounting for a gravity inversion at a specific altitude threshold.

## Folder layout

```
repository_before/    # Original implementation (placeholder)
repository_after/     # Implemented kinematics solution
tests/                # pytest tests for behavior validation
patches/              # Diff between before/after
evaluation/           # Evaluation runner and generated reports
instances/            # Task metadata
trajectory/           # AI reasoning documentation
```

## Run with Docker

### Build image

```bash
docker compose build
```

### Run tests

```bash
docker compose run --rm test
```

**Expected behavior:**

- ✅ `test_repulsive_zone_start`: PASS (h=150 returns infinite time)
- ✅ `test_attractive_zone_start`: PASS (h=100 falls correctly)
- ✅ `test_exact_boundary`: PASS (boundary condition handled)

### Run evaluation

```bash
docker compose run --rm evaluate
```

This will:

1. Run `test_calculate.py` (expected to PASS)
2. Generate a report at `evaluation/YYYY-MM-DD/HH-MM-SS/report.json`

## Run locally

### Prerequisites

- Python 3.11+

### Install dependencies

```bash
pip install -r requirements.txt
```

### Run tests

```bash
# Activate virtual environment
source venv/bin/activate  # or venv/bin/activate.fish

# Run all tests
pytest tests/ -v

# Run specific test file
pytest tests/test_calculate.py -v
```

### Run the script directly

```bash
python repository_after/calculate.py
```

## Physics Model

### Dual-Zone Gravity

| Zone           | Altitude | Acceleration | Effect                     |
| -------------- | -------- | ------------ | -------------------------- |
| **Repulsive**  | y > 100m | +9.8 m/s²    | Pushes object upward       |
| **Attractive** | y ≤ 100m | -9.8 m/s²    | Pulls object toward ground |

### Key Behavior

- Object released from **h > 100m** with **v₀ = 0**:

  - Repulsive gravity accelerates it **away** from the ground
  - It never reaches the 100m boundary
  - Returns `(math.inf, None)`

- Object released from **h ≤ 100m** with **v₀ = 0**:
  - Normal attractive gravity applies
  - Falls to ground using standard kinematics
  - Returns `(time, final_velocity)`

## What Changed (Before → After)

| Aspect             | Before            | After                           |
| ------------------ | ----------------- | ------------------------------- |
| Implementation     | Empty/placeholder | Full piecewise kinematics       |
| Zone handling      | None              | Separate logic for each zone    |
| Infinite time case | Not handled       | Returns `math.inf, None`        |
| Quadratic solver   | None              | Proper discriminant calculation |

## Scenario: h = 150m

```
Start Height: 150m
Time to Impact: inf
Velocity at Impact: None
```

The object starts in the repulsive zone (above 100m) with zero velocity. The upward acceleration prevents it from ever reaching the attractive zone, so it drifts away indefinitely.

## Success Criteria

- ✅ `test_calculate.py` passes (all 3 tests)
- ✅ Piecewise gravity correctly modeled
- ✅ Infinite time returned for unreachable ground scenarios
- ✅ Standard kinematics for attractive zone
