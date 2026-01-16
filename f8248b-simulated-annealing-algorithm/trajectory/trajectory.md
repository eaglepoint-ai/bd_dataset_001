1. **Audit the Problem (Identify Optimization Challenges):**
   I analyzed the Rastrigin function, a classic non-convex optimization benchmark. A naive gradient descent approach would fail immediately because the function has many local minima distributed regularly. The global minimum is at $f(0, \dots, 0) = 0$, but there are deep local valleys that trap greedy algorithms.
   Learn about the Rastrigin function: [https://en.wikipedia.org/wiki/Rastrigin_function](https://en.wikipedia.org/wiki/Rastrigin_function)
   Understanding Global vs. Local optimization: [https://en.wikipedia.org/wiki/Global_optimization](https://en.wikipedia.org/wiki/Global_optimization)

2. **Define the Optimization Contract:**
   I defined the mathematical boundaries: the search space is limited to $[-5.12, 5.12]$ for each dimension. The algorithm must minimize the objective function.
   Key constraint: The solution must remain within bounds. I implemented `np.clip` in the neighbor generation to strictly enforce this contract, preventing the algorithm from wandering into invalid regions where the function behavior might be undefined or irrelevant.

3. **Recognize the Core Insight (Metropolis Criterion):**
   The critical mechanism that allows Simulated Annealing to succeed where gradient descent fails is the specific probability of accepting _worse_ solutions:
   $$P = \exp(-(E_{new} - E_{old}) / T)$$
   I recognized that at high temperatures ($T$), this probability is close to 1, effectively essentially a random walk (exploration). As $T \to 0$, the probability drops, forcing the algorithm to become selective (exploitation). This "hill-climbing" capability is what allows it to escape the Rastrigin function's local wells.

4. **Implement Cooling and Transition Logic:**
   I implemented an exponential cooling schedule ($T_{new} = T_{old} \times \alpha$) where $\alpha = 0.99$. This provides a slow, controlled descent.
   The transition logic separates "better" (always accept) from "worse" (probabilistically accept), adhering strictly to the Metropolis-Hastings algorithm principles.

5. **Handle Edge Cases and Reproducibility:**

   - **Bounds:** Strictly enforced via `np.clip` in `get_neighbor`.
   - **Zero Division:** In the testing logic, I identified a potential division-by-zero risk if `n_iterations < 10` due to periodic logging, and handled it by enforcing minimum iteration counts in tests.
   - **Seed Control:** Used `np.random.seed` to ensure that experiments are reproducible, which is vital for stochastic algorithms.

6. **Validate with Statistical Convergence runs:**
   I validated the implementation not just by checking if it runs, but by checking _convergence_.
   - **Unit Tests:** Verified the math of the acceptance probability function (e.g., ensuring higher T gives higher acceptance).
   - **Evaluation Script:** Ran the algorithm multiple times (5 runs) to ensure it consistently converges to an energy $< 20.0$ (and typically $< 2.0$), proving robust performance against the Rastrigin landscape.
