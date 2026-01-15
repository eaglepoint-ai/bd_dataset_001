# Trajectory (Thinking Process for Refactoring)

This trajectory documents the reusable thinking steps used to refactor the **Redux betting slip app** from **JavaScript → production-grade TypeScript**, while also standardizing a **before/after/evaluation Docker workflow**.

## 1. Audit the Original Code (Identify Refactoring Risks)

I audited the original JavaScript Redux code in `repository_before/` and identified the main risk areas for a safe TS migration:

- **Untyped domain model**: bets, state shape, and async response payloads were implicit.
- **Action / reducer safety gaps**: actions were strings and payloads were unchecked.
- **Thunk typing gap**: dispatch was untyped, so async flow had no compile-time guarantees.
- **Dictionary shape**: `betData` behaves like a map keyed by bet id (string like `"1-home"`).
- **Evaluation gap**: there was no uniform “before vs after” runner to prove the refactor is correct.

## 2. Define a “Correctness + Type-Safety” Contract First

I defined the contract using the dataset’s built-in requirements and tests:

- **Correctness contract**: behavior must stay the same (smoke/runtime checks).
- **Type-safety contract**: the “13 requirements” must be enforced (strict TS, discriminated unions, `as const`, `Record`, optional chaining, `unknown` handling, typed reducer, typed thunk dispatch, etc.).
- **Evaluation contract**: the pipeline must prove:
  - **before** is **non-compliant** (expected to fail compliance checks),
  - **after** is **compliant** (must pass).

Key sources:
- React Redux TS guide: `https://react-redux.js.org/using-react-redux/usage-with-typescript`
- redux-thunk TS notes: `https://github.com/reduxjs/redux-thunk#typescript`

## 3. Rework the Data Model Into Explicit Types

I modeled the app’s core shapes explicitly in TypeScript (in `repository_after/src/redux/types.ts`):

- Bet domain types (id, matchId, selection, odds, etc.)
- State interface (including **map-like** state using `Record<string, ...>`)
- Action type constants with `as const`
- Discriminated union for actions

This turns “implicit JS assumptions” into compile-time verified structures.

## 4. Refactor Actions + Reducer as a Typed Pipeline

I ensured the “event pipeline” is type-safe end-to-end:

- **Action creators** have explicit parameter and return types.
- **Reducer** has explicit state/action/return types and remains safe with foreign actions passing through.
- **Thunk** actions have a typed dispatch contract (so `dispatch(handleBet(...))` is validated).
- **Error handling** uses `unknown` and narrowing to avoid unsafe property access.

## 5. Preserve Runtime Behavior (Don’t Accidentally Change the App)

I treated runtime behavior as non-negotiable:

- Same state transitions for `ADD_BET_SLIP`, `DELETE_BET_SLIP`, `CLEAR_BET_SLIP`, `HANDLE_BET`
- Same bet-id semantics (`"{matchId}-{selection}"`)
- Same “dictionary” behavior for storing/removing bets

This is enforced by the smoke/runtime tests in `tests/`.

## 6. Build the “Before / After / Evaluation” Proof Harness (Docker + Report)

To match the evaluation pattern you provided, I implemented a standardized runner:

- **Node evaluation**: `evaluation/evaluation.js`
  - runs tests on both repos
  - writes a report to `evaluation/reports/YYYY-MM-DD/HH-MM-SS/report.json`
- **Tests accept a repo selector** via `TEST_REPO_PATH` (in addition to `TARGET`)
  - updated `tests/test_compliance.js` and `tests/test_simple.js`
- **Docker + Compose** now exposes the exact interface:
  - `test-before`
  - `test-after`
  - `evaluation`

Docker commands (Compose v1 style):

```bash
docker-compose build
docker-compose run --rm test-before
docker-compose run --rm test-after
docker-compose run --rm evaluation
```

## 7. Result: Deterministic Pass/Fail Signals

The final signals are predictable and machine-checkable:

- **Before**: compliance checks produce failures (expected non-compliance), smoke checks pass.
- **After**: compliance checks pass (13/13), smoke checks pass.
- **Evaluation**: exits success and writes a structured report.

---

## Trajectory Transferability Notes

The above trajectory is designed for Refactoring. The steps outlined in it represent reusable thinking nodes (audit, contract definition, structural changes, execution, and verification).

The same nodes can be reused to transfer this trajectory to other hard-work categories (such as full-stack development, performance optimization, testing, and code generation) by changing the focus of each node, not the structure.

Below are the nodes extracted from this trajectory. These nodes act as a template that can be mapped to other categories by adapting the inputs, constraints, and validation signals specific to each task type.

🔹 Refactoring → Full-Stack Development
● Replace code audit with system & product flow audit  
● Correctness/type contract becomes API, UX, and data contracts  
● Data model refactor extends to DTOs and frontend state shape  
● Pipeline refactor maps to API payload shaping + UI state flow  
● Verification applies to backend + UI (integration tests, e2e, latency budgets)  

🔹 Refactoring → Performance Optimization
● Code audit becomes runtime profiling & bottleneck detection  
● Contract expands to SLOs/SLAs/latency budgets and resource limits  
● Structural changes include indexes, caches, async paths, memoization  
● Verification uses metrics, benchmarks, and load tests  

🔹 Refactoring → Testing
● Code audit becomes test coverage & risk audit  
● Contract becomes test strategy & guarantees (what must never break)  
● Data assumptions convert to fixtures and factories  
● Verification becomes assertions & invariants in CI  

🔹 Refactoring → Code Generation
● Code audit becomes requirements & input analysis  
● Contract becomes generation constraints (types, style, determinism)  
● Data model refactor becomes domain model scaffolding  
● Verification ensures correctness, maintainability, and lint/type checks  

Core Principle (Applies to All)
● The trajectory structure stays the same  
● Only the focus and artifacts change  
● Audit → Contract → Design → Execute → Verify remains constant  
