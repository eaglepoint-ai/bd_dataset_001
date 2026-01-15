# AI Reasoning Trajectory: Piecewise Potential Barrier Kinematics

## Overview

This document outlines the systematic thought process an AI model should follow when implementing a kinematics simulation for a dual-zone gravitational field with non-standard physics (gravity inversion at a specific altitude).

---

## Phase 1: Understanding the Context

### Step 1.1: Read the Problem Statement

**Action**: Deeply understand the goal: "Compute time-to-impact and final velocity for an object in a dual-zone gravitational field".

**Key Questions to Ask**:

- **What is the physical setup?** (Object dropped from rest in a field with altitude-dependent gravity)
- **What are the zone boundaries?** (100m threshold)
- **What is the gravity behavior in each zone?** (Repulsive above, Attractive below)
- **What edge cases exist?** (Object may never reach the ground)

**Expected Understanding**:

- This is a **piecewise kinematics problem**, not a simple constant-acceleration scenario.
- The system has a "potential barrier" at 100m that can trap objects released from above.
- We must correctly handle the case where impact **never occurs**.

### Step 1.2: Define the Physics Model

**Action**: Formalize the gravitational zones.

| Zone           | Altitude | Acceleration  | Physical Effect                        |
| -------------- | -------- | ------------- | -------------------------------------- |
| **Repulsive**  | y > 100m | a = +9.8 m/s² | Pushes object upward (away from Earth) |
| **Attractive** | y ≤ 100m | a = -9.8 m/s² | Pulls object downward (toward Earth)   |

**Critical Insight**:

An object released from rest at h > 100m will experience **upward acceleration**. Since v₀ = 0 and a > 0, it will accelerate **away** from the 100m boundary, never entering the attractive zone.

---

## Phase 2: Requirements Analysis

### Step 2.1: Enumerate Constraints from Problem Statement

**Action**: Extract explicit requirements.

1. Calculate zone transitions **independently** using a piecewise approach.
2. Maintain `a = +9.8` for `y > 100` without directional correction.
3. Maintain `a = -9.8` for `y ≤ 100`.
4. Do **NOT** assume a terrestrial "fix" to force the object toward the ground.
5. Return `math.inf` if the object fails to reach the 100m transition boundary.
6. Do **NOT** use average acceleration or simplified heuristics across zones.
7. Carry the precise terminal velocity of Phase 1 as the initial velocity for Phase 2.

### Step 2.2: Define Expected Outputs

**Action**: Map input scenarios to expected outputs.

| Start Height | Expected Time | Expected Velocity | Reasoning                                       |
| ------------ | ------------- | ----------------- | ----------------------------------------------- |
| h = 150m     | `math.inf`    | `None`            | Starts in repulsive zone, drifts upward forever |
| h = 100m     | ~4.52s        | ~-44.3 m/s        | Starts at boundary, falls normally              |
| h = 50m      | ~3.19s        | ~-31.3 m/s        | Starts in attractive zone, falls normally       |

---

## Phase 3: Algorithm Design

### Step 3.1: Identify Decision Points

**Action**: Determine the branching logic.

```
START
  │
  ├─ IF h > 100m (Repulsive Zone)
  │     │
  │     └─ With v₀=0 and a=+9.8, object moves upward
  │        ∴ It NEVER reaches 100m boundary
  │        ∴ Return (math.inf, None)
  │
  └─ ELSE h ≤ 100m (Attractive Zone)
        │
        └─ Standard kinematics to ground (y=0)
           ∴ Solve quadratic for time
           ∴ Calculate final velocity
           ∴ Return (time, velocity)
```

### Step 3.2: Select Kinematic Equations

**Action**: Choose appropriate equations for Phase 2 (Attractive Zone).

**Position equation**:

```
y(t) = y₀ + v₀t + ½at²
```

**Setting y(t) = 0** (ground level):

```
0 = h + v₀t + ½(-9.8)t²
0 = h + v₀t - 4.9t²
```

**Rearranging as quadratic** (standard form `at² + bt + c = 0`):

```
-4.9t² + v₀t + h = 0
```

**Solving with quadratic formula**:

```
t = (-v₀ ± √(v₀² + 4×4.9×h)) / (2×(-4.9))
```

**Velocity equation**:

```
v = v₀ + at
```

---

## Phase 4: Implementation

### Step 4.1: Function Skeleton

**Action**: Create the function structure.

```python
import math

def compute_dual_zone_impact(start_height):
    """
    Computes time to impact and final velocity for an object in a dual-zone
    gravitational field.

    Args:
        start_height (float): Initial height in meters (released from rest).

    Returns:
        tuple: (total_time, final_velocity)
               Returns (math.inf, None) if the object never hits the ground.
    """

    BOUNDARY = 100.0
    ACCEL_REPULSIVE = 9.8   # Upward acceleration
    ACCEL_ATTRACTIVE = -9.8  # Downward acceleration
    V_INITIAL = 0.0

    current_height = start_height
    current_velocity = V_INITIAL
    total_time = 0.0
```

### Step 4.2: Implement Repulsive Zone Check

**Action**: Handle the case where object starts above 100m.

```python
    # CASE 1: Above 100m (Repulsive Zone)
    if current_height > BOUNDARY:
        # With v₀=0 and a=+9.8, object accelerates upward
        # It will never reach the 100m boundary
        return math.inf, None
```

**Key Insight**: No calculation needed. The physics guarantees the object moves away from the boundary.

### Step 4.3: Implement Attractive Zone Calculation

**Action**: Standard kinematics for falling to ground.

```python
    # CASE 2: At or Below 100m (Attractive Zone)
    if current_height <= BOUNDARY:
        # Quadratic formula: 0.5at² + vt + h = 0
        a_quad = 0.5 * ACCEL_ATTRACTIVE  # -4.9
        b_quad = current_velocity         # 0.0
        c_quad = current_height           # h

        discriminant = (b_quad**2) - (4 * a_quad * c_quad)

        if discriminant < 0:
            return math.inf, None  # Should not happen for valid inputs

        t1 = (-b_quad + math.sqrt(discriminant)) / (2 * a_quad)
        t2 = (-b_quad - math.sqrt(discriminant)) / (2 * a_quad)

        time_phase_2 = max(t1, t2)

        total_time += time_phase_2
        final_velocity = current_velocity + (ACCEL_ATTRACTIVE * time_phase_2)

        return total_time, final_velocity
```

---

## Phase 5: Testing Strategy

### Step 5.1: Define Test Cases

**Action**: Create pytest tests covering all scenarios.

```python
def test_repulsive_zone_start():
    """Object starts above 100m -> should never reach ground."""
    t, v = compute_dual_zone_impact(150)
    assert t == math.inf
    assert v is None

def test_attractive_zone_start():
    """Object starts at 100m -> should fall normally."""
    t, v = compute_dual_zone_impact(100)
    expected_t = math.sqrt(100 / 4.9)
    expected_v = -9.8 * expected_t
    assert t == pytest.approx(expected_t, abs=1e-5)
    assert v == pytest.approx(expected_v, abs=1e-5)

def test_exact_boundary():
    """Boundary condition: h=100 should use attractive zone."""
    t, v = compute_dual_zone_impact(100)
    assert t != math.inf
    assert v is not None
```

### Step 5.2: Verify Test Results

**Action**: Run pytest and confirm all pass.

```bash
pytest -v tests/test_calculate.py
```

**Expected Output**:

```
tests/test_calculate.py::test_repulsive_zone_start PASSED
tests/test_calculate.py::test_attractive_zone_start PASSED
tests/test_calculate.py::test_exact_boundary PASSED
```

---

## Phase 6: Validation

### Step 6.1: Manual Calculation Check

**Action**: Verify h=100m case by hand.

```
Given: h = 100m, v₀ = 0, a = -9.8 m/s²

Equation: 0 = 100 + 0×t - 4.9×t²
         4.9t² = 100
         t² = 100/4.9 ≈ 20.408
         t ≈ 4.517 seconds

Velocity: v = 0 + (-9.8)(4.517) ≈ -44.27 m/s
```

**Matches implementation?** ✅

### Step 6.2: Edge Case Analysis

**Action**: Verify h=150m case reasoning.

```
Given: h = 150m, v₀ = 0, a = +9.8 m/s²

Position: y(t) = 150 + 0×t + 0.5×9.8×t²
               = 150 + 4.9t²

As t → ∞, y(t) → ∞

The object accelerates upward forever, never reaching y=100.
```

**Conclusion**: Returning `(math.inf, None)` is correct. ✅

---

## Phase 7: Reflection

### Key Success Factors for Piecewise Kinematics

1. **Zone Identification First**:

   - Before any calculation, determine which zone the object occupies.
   - Different zones require fundamentally different handling.

2. **Respecting Non-Standard Physics**:

   - Do NOT apply intuition from normal gravity.
   - If a > 0 and v₀ = 0, the object moves in the +y direction, period.

3. **Handling Unreachable Goals**:

   - If physics prevents reaching the target (ground), return infinity.
   - Don't force a solution where none exists.

4. **Quadratic Formula for Time**:
   - When acceleration is constant, time-of-flight is a quadratic problem.
   - Always check the discriminant for validity.

### Summary Checklist

- [x] Identified dual-zone gravitational model.
- [x] Recognized that h > 100m with v₀ = 0 leads to infinite time.
- [x] Implemented separate logic for each zone.
- [x] Used quadratic formula for attractive zone.
- [x] Verified results with manual calculations.
- [x] Created comprehensive test suite.
- [x] Dockerized for reproducible evaluation.
