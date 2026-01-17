1. **Deconstruct the Piecewise Acceleration Profile:**
   The problem specifies a discontinuous gravitational field:
   - For $y > 100.0$: $a = +9.8\text{ m/s}^2$ (Repulsive)
   - For $y \le 100.0$: $a = -9.8\text{ m/s}^2$ (Attractive)
     This discontinuity creates a "potential barrier" effect at the 100m interface.

2. **Establish the "No-Return" Condition for the Repulsive Zone:**
   Consider an object released from rest ($v_0 = 0$) at $y_0 > 100.0$.
   With $a = +9.8$, the velocity at any time $t > 0$ is $v(t) = 9.8t > 0$.
   Since $v(t)$ is always positive and increasing, the height $y(t)$ will strictly increase beyond $y_0$.
   Therefore, the object diverges from the ground and will never reach the attractive zone or impact the surface.

3. **Derive the Mathematical Model for the Attractive Zone:**
   For an object starting at $y_0 \le 100.0$:
   The motion is governed by $y(t) = y_0 + v_0t + \frac{1}{2}at^2$, where $a = -9.8$.
   Impact occurs when $y(t) = 0$.
   This yields the quadratic equation: $-4.9t^2 + v_0t + y_0 = 0$.

4. **Isolate the Positive Root for Time-to-Impact:**
   Using the quadratic formula $t = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$:
   $t = \frac{-v_0 \pm \sqrt{v_0^2 - 4(-4.9)(y_0)}}{2(-4.9)}$
   For $v_0 = 0$: $t = \frac{\pm \sqrt{19.6 y_0}}{-9.8} = \mp \sqrt{\frac{y_0}{4.9}}$.
   The physical solution is the positive root: $t = \sqrt{\frac{y_0}{4.9}}$.

5. **Calculate Terminal Velocity at Impact:**
   The final velocity $v_f$ at time $t$ is given by $v_f = v_0 + at$.
   Substituting $a = -9.8$ and the derived time $t$:
   $v_f = 0 + (-9.8) \sqrt{\frac{y_0}{4.9}} = -9.8 \sqrt{\frac{y_0}{4.9}}$.

6. **Validate the Boundary Condition Stability:**
   At the exact boundary $y_0 = 100.0$, the attractive zone logic is applied.
   Calculation: $t = \sqrt{100/4.9} \approx 4.5175\text{ s}$.
   $v_f = -9.8(4.5175) \approx -44.27\text{ m/s}$.
   This provides a consistent transition between the "forever escaping" and "grounded" states.

7. **Implement Robust Logical Branching:**
   The software must immediately evaluate the starting height to prevent unnecessary calculations for divergent cases.

   ```python
   if start_height > 100.0:
       return math.inf, None
   ```

   This ensures the physical reality of the repulsive zone is correctly represented as an infinite time-to-impact.

8. **Standardize Physics Units and Constants:**
   Adopted standard SI units (meters, seconds, m/s, m/s²) and used precise floating-point constants for gravity ($g = 9.8$) to ensure numerical consistency across all test cases.

9. **Apply the Quadratic Solver Implementation:**
   The code translates the mathematical derivation into a robust quadratic solver that handles the discriminant and selects the physically meaningful (positive) time component.

10. **Verify Results Against Analytical Benchmarks:**
    Cross-referenced implementation outputs with hand-calculated values for $y_0 = 25\text{m}$, $50\text{m}$, and $100\text{m}$ to confirm the logic's accuracy in the attractive zone.
