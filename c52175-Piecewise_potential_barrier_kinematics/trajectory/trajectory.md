1. **Audit the Original Code (Identify Physics Modeling Problems):**
   I audited the problem statement. The standard constant-acceleration formulas would fail because gravity inverts at 100m altitude. A naive approach would incorrectly force the object toward the ground regardless of the repulsive zone physics.
   Learn about piecewise kinematic problems: [https://en.wikipedia.org/wiki/Equations_of_motion](https://en.wikipedia.org/wiki/Equations_of_motion)
   Understanding potential barriers in physics: [https://en.wikipedia.org/wiki/Potential_barrier](https://en.wikipedia.org/wiki/Potential_barrier)

2. **Define a Physical Contract First:**
   I defined physics conditions: acceleration must be +9.8 m/s² for y > 100m (repulsive), -9.8 m/s² for y ≤ 100m (attractive), object starts at rest (v₀ = 0), and must return `math.inf` if the object cannot reach the ground.
   Kinematic equations explained: [https://www.khanacademy.org/science/physics/one-dimensional-motion](https://www.khanacademy.org/science/physics/one-dimensional-motion)

3. **Recognize the Potential Barrier Effect:**
   I identified that an object released from rest above 100m experiences upward acceleration (+9.8 m/s²). With v₀ = 0 and a > 0, the object accelerates _away_ from the 100m boundary, never entering the attractive zone.
   This is the key insight that prevents naive kinematic solutions from working.

4. **Implement Zone-Based Decision Logic:**
   The solution now checks the starting height first. If h > 100m, it immediately returns `(math.inf, None)` without any kinematic calculation — the physics guarantees the object drifts upward forever.

5. **Use Quadratic Formula for Attractive Zone:**
   For h ≤ 100m, standard kinematics apply. The time-to-ground is calculated by solving:

   ```
   0 = h + v₀t + ½(-9.8)t²
   ```

   Using the quadratic formula to find the positive root.

6. **Handle Edge Cases Explicitly:**
   The boundary condition (h = 100m exactly) uses the attractive zone logic (≤ comparison), ensuring consistent behavior at the transition point.

7. **Validate with Manual Calculations:**
   I verified the h = 100m case by hand:

   - t = √(100/4.9) ≈ 4.52 seconds
   - v = -9.8 × 4.52 ≈ -44.3 m/s
     This matches the implementation output.
