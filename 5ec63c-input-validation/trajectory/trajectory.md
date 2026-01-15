# Trajectory (Thinking Process for Building Error Handling Library)

## 1. Audit the Original Request (Identify Complexity & Fragmentation)
I audited the requirements and original state. I identified that error handling is often fragmented, with ad-hoc `try/except` blocks, inconsistent logging formats, and lack of type safety. This leads to silent failures and unmaintainable codebases.

## 2. Define a Consistency Contract First
I defined the "rules of engagement" before writing logic:
- **Categorization**: All errors must belong to a specific `ErrorCategory` (Network, Validation, Security).
- **Severity**: All errors must have a `ErrorSeverity` (Info, Warning, Critical).
- **Format**: Errors must be serializable and contain metadata for debugging.

## 3. Rework the Data Model for Type Safety
I introduced a strong Type System using Enums (`ErrorCategory`, `ErrorSeverity`) and a base `CategorizedError` class. This prevents "stringly typed" errors and allows the IDE/Linter to catch mistakes early.

## 4. Build Input Validation as a First Line of Defense
I implemented `InputValidator` as a collection of static, reusable methods. By validating inputs (Project ID ranges, Email formats) *before* processing, we prevent expensive operations from running on invalid data.

## 5. Centralize Error Handling Logic
I moved the decision-making logic (Log? Crash? Ignore?) into a centralized `ErrorHandler`.
- **Filtering**: Ignoring low-severity errors if configured.
- **Observability**: Tracking error counts and history.
- **Safety**: Ensuring logging never crashes the app.

## 6. Encapsulate Safety with Decorators
I implemented the `@safe_execute` decorator. This acts as a "projection" of safety onto any function. It ensures that no matter what happens inside the business logic, the result is predictable (a safe return value or a specific exception), eliminating unhandled crashes.

## 7. Implement Resilience (Retries)
I implemented `@retry_on_error` to handle transient failures (like Network glitches).
- **Backoff**: Exponential backoff to avoid hammering failing services.
- **Selectivity**: Only retry on specific `ErrorCategory` types to avoid retrying permanent errors (like Validation failures).

## 8. Eliminate Boilerplate (N+1 Try/Excepts)
I eliminated the need for repetitive `try...except` blocks in business logic. By applying decorators, the code becomes linear and readable, while the repetitive error management is handled by the infrastructure layer.

## 9. Verification & Safe Integration
I verified the solution not just with unit tests, but by creating an integration demo (`main.py`) that matches the user's expected usage patterns. I ensured that the `ErrorHandler` and Decorators communicate correctly (singleton pattern).

## 10. Result: Measurable Reliability + Developer Experience
The solution consistently catches errors, provides structured logs (JSON-ready), prevents crashes, and allows developers to write clean, "happy path" code while the library handles the "sad path".

---

# Trajectory Transferability Notes

The above trajectory is designed for **Building/Refactoring**. The steps outlined in it represent reusable thinking nodes (audit, contract definition, structural changes, execution, and verification).

The same nodes can be reused to transfer this trajectory to other hard-work categories (such as full-stack development, performance optimization, testing, and code generation) by changing the focus of each node, not the structure.

Below are the nodes extracted from this trajectory. These nodes act as a template that can be mapped to other categories by adapting the inputs, constraints, and validation signals specific to each task type.

### 🔹 Refactoring → Full-Stack Development
*   **Replace code audit with system & product flow audit**
*   **Performance contract becomes API, UX, and data contracts**
*   **Data model refactor extends to DTOs and frontend state shape**
*   **Query optimization maps to API payload shaping**
*   **Pagination applies to backend + UI (cursor / infinite scroll)**
*   **Add API schemas, frontend data flow, and latency budgets**

### 🔹 Refactoring → Performance Optimization
*   **Code audit becomes runtime profiling & bottleneck detection**
*   **Performance contract expands to SLOs, SLAs, latency budgets**
*   **Data model changes include indexes, caches, async paths**
*   **Query refactors focus on hot paths**
*   **Verification uses metrics, benchmarks, and load tests**
*   **Add observability tools and before/after measurements**

### 🔹 Refactoring → Testing
*   **Code audit becomes test coverage & risk audit**
*   **Performance contract becomes test strategy & guarantees**
*   **Data assumptions convert to fixtures and factories**
*   **Stable ordering maps to deterministic tests**
*   **Final verification becomes assertions & invariants**
*   **Add test pyramid placement and edge-case coverage**

### 🔹 Refactoring → Code Generation
*   **Code audit becomes requirements & input analysis**
*   **Performance contract becomes generation constraints**
*   **Data model refactor becomes domain model scaffolding**
*   **Projection-first thinking becomes minimal, composable output**
*   **Verification ensures style, correctness, and maintainability**
*   **Add input/output specs and post-generation validation**

## Core Principle (Applies to All)
*   **The trajectory structure stays the same**
*   **Only the focus and artifacts change**
*   **Audit → Contract → Design → Execute → Verify remains constant**
