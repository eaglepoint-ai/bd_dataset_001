### Trajectory (Thinking Process for FIX Trade Log Analyzer)

This is **Ground Truth**: it documents how correctness, determinism, and performance were enforced (not guessed).

---

### 1. Calibration Audit First (605d32-Markdown_Blog_single_page_web_application)
I reviewed the calibration repository **before** touching the FIX analyzer to calibrate evaluator weaknesses and to avoid “looks-correct” fixes.

Key findings (evaluator-level thinking):
- The snapshot contains mostly **compiled tests** (`tests/__pycache__/*.pyc`) and cached artifacts, with **no readable app source**.
- Evaluation reports show failures caused by **environment flakiness** (Selenium/Chrome failures, connection refused), not product logic.
- Reconstructing enforcement from `.pyc` strings shows multiple **heuristic / presence-based checks** (file existence, small string blacklists, keyword-based “no frameworks”).

How weak evaluation can be gamed:
- Blacklist-based “no hardcoded content” can be bypassed by runtime injection or alternate strings.
- SPA checks can be satisfied by hash navigation + trivial DOM selectors.
- Keyword-based “no frameworks” can be bypassed with CDNs, renamed deps, or bundling.

Calibration lessons applied to FIX analyzer:
- Don’t rely on “sample parses” or “seems fast”. Build **executable enforcement** for parsing correctness, allocations, and throughput.
- Don’t hinge correctness on flaky external dependencies.
- Deterministic memory behavior must be achieved by **construction** (bounded structures), not by “we didn’t observe growth”.

---

### 2. Audit the Original FIX Analyzer (Identify Scaling & Correctness Failures)
I audited `repository_before/src/lib.rs` and identified:
- **Serialization bottlenecks**: `Mutex` around every hot structure (`messages`, `stats`, `seen_order_ids`).
- **Allocation-heavy hot path**: `split` + `to_string` per field, per-field `Vec` allocations, storing full messages.
- **Unbounded memory**: stores all messages and all order IDs indefinitely (violates 10s buffer, violates 8h stability).
- **Incorrect parsing**: naive `split('|')` breaks escaped pipes in values; corrupts `11` and `58`.
- **Stats correctness hazards**: signed counters (`i64`) used for monotonically increasing stats and volume accumulation → overflow risk.
- **Reporting blocks ingestion**: report generation holds locks and scans all messages.

---

### 3. Define a Correctness + Performance Contract (Before Writing Code)
I defined a contract that must be *enforced*:
- **Parsing correctness**:
  - `|` is the delimiter; literal `|` in a value is encoded as `\|`.
  - Split tag/value on the **first `=`** only.
  - Malformed input must be logged and skipped with **zero crashes**.
  - Microsecond timestamps must preserve precision (no float time).
- **Concurrency**:
  - Stats queries and report generation must not block ingestion (no shared mutex).
- **Memory**:
  - Cannot buffer >10s: solution must not store raw messages.
  - 8h @ 100k msg/sec with zero growth: bounded structures only.
  - No heap allocations in hot path after warmup.
- **Throughput**:
  - 1,000,000 messages in <3 seconds (release), enforced by a test.

---

### 4. Implement Zero-Copy Parsing With Escape-Aware Delimiters
Strategy:
- Scan bytes and find **unescaped** `|` delimiters (backslash escape support).
- Represent values as `EscapedValue<'a>` (slice into the original buffer), and decode only when required.
- Decode logic is explicit and bounded: `\X` becomes literal `X`.
- Timestamp parsing is integer-based with `FixTimestamp { seconds, micros }` to preserve microseconds.

Why this avoids “fake correctness”:
- Escaped pipes are handled by the delimiter scan itself; not by post-processing.
- Malformed fields (missing `=`) return a bounded error path and are skipped in `process_message_lossy`.

---

### 5. Replace Mutex Stats With Lock-Free Atomics (Bounded, Deterministic)
Design:
- Global counters (`total`, `malformed`, `buy`, `sell`) are `AtomicU64`.
- Per-symbol stats use:
  - Fixed-capacity open-addressing table (bounded slots).
  - Slot claim via CAS on an atomic hash.
  - Symbol bytes stored once in a fixed-size monotonic arena (bounded bytes).
  - Per-slot counters as atomics.

Memory ordering:
- Insertion publishes the symbol’s arena offset/len with `Release` after bytes are written.
- Readers load with `Acquire` to see consistent initialization.

Bounded failure mode:
- If symbol table or arena is full, ingestion fails with an explicit bounded error (`TableFull` / `ArenaFull`) — no silent growth, no hidden buffering.

---

### 6. Streaming Compliance Reports (No Ingestion Pause)
Report generation:
- Reads only atomics and iterates symbol slots.
- Writes to `Write` (streaming) — no full message scans, no locking.
- This allows report generation while ingestion continues.

---

### 7. Enforce the Contract With Tests (Behavior, Not Surface Output)
Enforcement tests (release-mode) were added under `repository_after/tests/`:
- Escaped pipe parsing in tag **58**.
- Order ID with escaped pipe in tag **11**.
- Malformed message is logged and skipped without panic.
- Timestamp microseconds preserved.
- Concurrent reporting during ingestion does not deadlock/block.
- **No allocations in hot path after warmup**: verified by a counting global allocator.
- **1,000,000 messages < 3 seconds**: verified in release.

This is intentionally “hard to fake”: tests measure allocations and time, not just outputs.

---

### 8. Make Docker/Evaluation Match the Dataset Pattern (Before/After + JSON Reports)
To match the repository-wide evaluation pattern:
- Added an `evaluation/` Rust runner that executes a generated harness against:
  - `repository_before` (expected to fail)
  - `repository_after` (expected to pass)
- The evaluator writes:
  - `evaluation/reports/latest.json`
  - `evaluation/reports/<YYYY-MM-DD>/<HH-MM-SS>/report.json`
- Added `docker-compose.yml` services:
  - `test-before`, `test-after`, `evaluation`
- On your machine (Compose v1), the correct CLI is **`docker-compose`**, not `docker compose`.

---

### 9. Result: Deterministic, Enforced Guarantees
The “after” implementation:
- Correctly handles escaped delimiters (including in order IDs and text fields).
- Has lock-free stats and non-blocking report generation.
- Uses bounded memory structures and enforces no hot-path allocations after warmup.
- Meets the 1M<3s throughput contract (release) under enforcement tests.
- Produces evaluation JSON artifacts via Docker and docker-compose.

---

### Trajectory Transferability Notes (Template Nodes)
This trajectory is structured as reusable nodes:
**Audit → Contract → Design → Execute → Verify → Package**

How to transfer this trajectory:
- **Performance Optimization**:
  - Replace “parsing rules audit” with “profiling + bottleneck audit”.
  - Contract becomes SLOs/allocations/latency budgets.
  - Verification becomes benchmarks + alloc counters + load tests.
- **Testing/Verification Work**:
  - Audit becomes threat-modeling of evaluator gaps.
  - Contract becomes invariants and negative cases.
  - Verification emphasizes enforcement (no flakiness, no heuristics).
- **Systems/Concurrency Work**:
  - Contract focuses on bounded queues, backpressure, and memory ordering.
  - Verification includes contention tests and long-run stability checks.

Core principle:
- Keep the structure constant; change the artifacts and enforcement signals to match the domain.


