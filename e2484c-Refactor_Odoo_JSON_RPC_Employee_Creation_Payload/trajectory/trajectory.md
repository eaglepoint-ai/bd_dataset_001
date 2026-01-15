# Trajectory (Thinking Process for Refactoring)

## 1. Audit the Original Payload (Identify Why It Will Fail)
I began by reading the original JSON-RPC object end-to-end and classifying issues into:
- **Protocol-level (JSON-RPC 2.0)**: verify required top-level fields and types exist and are correct.
- **Transport wrapper (Odoo JSON-RPC gateway)**: verify the `service/method/args` wrapper matches how Odoo expects JSON-RPC calls to `object.execute`.
- **Application semantics (Odoo execute signature)**: verify the positional `params.args` array matches the `execute(db, uid, password, model, method, *args)` contract.
- **Data validation**: verify field-level requirements (notably `mobile_phone` international format).

Findings:
- The object already contained the required JSON-RPC top-level keys (`jsonrpc`, `method`, `params`, `id`) with valid types.
- The **only deterministic semantic failure** was the **misordered `params.args`**: the employee dict was placed where Odoo expects `db`.
- `mobile_phone` was not in international format, violating the stated requirement.

## 2. Define a Correctness Contract (Before Editing Anything)
I made the contract explicit, because JSON-RPC refactors are brittle and partial correctness is useless:
- **JSON-RPC 2.0 compliance**: keep top-level structure valid (`jsonrpc: "2.0"`, `method`, `params`, `id`).
- **Odoo wrapper compliance**: keep `params.service == "object"` and `params.method == "execute"`.
- **Odoo execute positional signature**: `params.args` must be exactly:
  1) database name, 2) user ID, 3) password, 4) model name, 5) method name, 6) method arguments (employee dictionary).
- **Minimal change surface**: only correct non-compliant fields; preserve all valid fields byte-for-byte.
- **Phone requirement**: `mobile_phone` must be expressed in a valid international format (E.164-like).

## 3. Enumerate Minimal Corrections (No “Silent Fixes”)
I wrote down each correction up front and justified it:
- **Reorder `params.args`** to match Odoo’s `execute` signature (required for the API call to route correctly).
- **Convert `mobile_phone`** to international format by adding a leading `+` while preserving the original digits.

I explicitly chose **not** to change any other employee fields (`name`, `job_title`, `work_phone`, `company_id`, `work_email`) because they were not identified as invalid by the requirements.

## 4. Implement the “After” Artifact as a New Payload (Preserve Before)
To preserve the original request for evaluation and demonstrate the minimal delta:
- I kept `repository_before/rpc-payload.json` untouched.
- I created `repository_after/rpc-payload.json` containing the corrected request with:
  - corrected `params.args` ordering
  - corrected `mobile_phone`
  - all other fields unchanged

## 5. Turn the Contract Into Executable Checks (Deterministic Tests)
I encoded the contract into a small, deterministic pytest suite:
- Validate **JSON-RPC structure** and required wrapper keys.
- Validate **Odoo execute argument order** and types.
- Validate **presence and preservation** of the employee fields used by the task instance.
- Validate **international `mobile_phone` format** using an E.164-like regex.

The tests run against either repo (`repository_before` or `repository_after`) using `TEST_REPO_PATH`, which prevents hardcoding paths and keeps checks reusable.

## 6. Add Before/After/Evaluation Docker Workflow (Reproducible Verification)
To match the dataset’s “before/after/evaluation” convention:
- I created compose services:
  - `test-before`: runs tests with `TEST_REPO_PATH=/app/repository_before`
  - `test-after`: runs tests with `TEST_REPO_PATH=/app/repository_after`
  - `evaluation`: runs `evaluation/evaluation.py` which executes both and writes a report
- The evaluation script writes:
  - `evaluation/reports/YYYY-MM-DD/HH-MM-SS/report.json`
  - `evaluation/reports/latest.json`

This yields a deterministic signal:
- **Before** is expected to fail on argument ordering + phone format.
- **After** must pass all checks.

## 7. Result: Minimal, Deterministic, Odoo-Compliant JSON-RPC
Outcome characteristics:
- The corrected payload is structurally valid JSON-RPC 2.0.
- The `params.args` array now aligns with Odoo’s `execute` signature and targets `hr.employee.create` with the employee dictionary as the method argument.
- Only the invalid parts were changed (argument order + phone formatting).
- Verification is reproducible via Docker and captured in a machine-readable evaluation report.

---

## Trajectory Transferability Notes
This trajectory is designed to be reusable across other “refactor” tasks. The structure stays constant:
**Audit → Contract → Minimal Corrections → Implement → Verify**.

### 🔹 Refactoring → API Payload Fixes (Any RPC/REST)
- Audit: validate protocol envelope + endpoint semantics
- Contract: define exact schema + ordering + allowed mutations
- Corrections: minimal edits to reach compliance
- Verify: schema tests + golden file comparisons + replayable harness

### 🔹 Refactoring → Testing
- Audit becomes: coverage + failure mode audit
- Contract becomes: explicit invariants and acceptance criteria
- Implement becomes: tests first, then minimal code changes
- Verify becomes: deterministic CI runs + report artifacts

### 🔹 Refactoring → Full-Stack Development
- Audit becomes: user flow + API contract audit
- Contract becomes: UX + API schema + error handling + determinism constraints
- Implement becomes: minimal vertical slice + strict interfaces
- Verify becomes: e2e + unit tests + reproducible env (Docker)

### Core principle (applies to all)
- The trajectory structure stays the same.
- Only the artifacts change.
- **Audit → Contract → Execute minimal change → Verify deterministically**.

