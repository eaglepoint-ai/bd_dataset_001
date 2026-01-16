### Ground Truth Trajectory — 901b39-FIX_Trade_Log_Analyzer

This document is a **reasoning artifact** and **verification authority record**. It is intentionally explicit and constraint-driven.

---

### PHASE 0 — Calibration Review (605d32-Markdown_Blog_single_page_web_application)

#### What was available to review (and why that matters)
The directory `/home/masri/Desktop/EaglePoint-v2/bd_dataset_001/605d32-Markdown_Blog_single_page_web_application/` contains:
- Compiled pytest artifacts (`tests/__pycache__/*.pyc`) rather than source test files.
- Cached directories (`.pytest_cache/`, `venv/`) and stored evaluation reports under `evaluation/reports/`.
- **No readable application source code** (`.py/.ts/.js/.html` are absent in this snapshot).

This is itself a critical calibration finding:
- **Unreviewable evaluators create false confidence**: when the enforcement logic cannot be audited, "passing" may reflect environment quirks, skipped tests, or unrelated artifacts.
- **Determinism is compromised**: evaluation reports reference `/app/tests/test_requirements.py` line numbers and Selenium driver behavior, but that code is not present here for ground truth verification.

#### Reconstructed enforcement surface (from `.pyc` string extraction + reports)
From `tests/__pycache__/test_requirements.cpython-311-pytest-9.0.2.pyc` and `tests/__pycache__/test_equivalence...pyc`, the evaluator primarily checks:

- **Structure / presence checks**
  - `src/` exists, contains `*.ts`, and **no `*.js`** in `src/`.
  - `content/author.md` exists.
  - `content/blogs/*.md` exists (at least 1).
  - `dist/app.js` exists.

- **"No hardcoded content" check**
  - Reads `index.html` and searches for a small set of specific strings (examples embedded in the `.pyc`):
    - `"Getting Started with TypeScript"`
    - `"Building SPAs Without Frameworks"`
    - `"Markdown as a Content Source"`
  - This is a **string blacklist** and does not prove content is dynamically loaded.

- **"No frameworks" check**
  - Parses `package.json` `dependencies`/`devDependencies` and flags if it sees keywords like:
    - `react`, `vue`, `angular`, `svelte`, `preact`, `ember`
  - Also searches `index.html` for "framework indicators".
  - This is **heuristic** and can be bypassed by:
    - Using frameworks via CDN without listing in `package.json`
    - Bundling/minifying where indicator strings do not appear
    - Using a framework-like architecture without those keywords

- **Selenium-based SPA behavior check**
  - Starts a server via `python3 server.py` and loads `http://localhost:8000`.
  - Clicks an element matching selectors:
    - `a[data-route='post'], article a`
  - Asserts that URL changes on navigation and that rendered page source includes `"blog-post"` and content.
  - This is vulnerable to a "fake SPA":
    - A static page with a hash link (e.g., `#post`) can change URL without real client-side routing.
    - A server can return pre-rendered HTML that trivially matches selectors and text.

- **Equivalence/contract tests**
  - Ensure `repository_before/` and `repository_after/` are importable packages (`__init__.py`).
  - Assert that `repository_before` is "baseline incomplete" (must not look like `repository_after`).
  - This incentivizes *engineering to the harness*, not the problem statement.

#### How flawed implementations pass weak evaluation
Concrete bypass patterns suggested by the enforcement surface:
- **"Dynamic content" is not actually proven**:
  - Avoid blacklisted strings in `index.html`; inject them at runtime or serve them from a server route.
- **SPA behavior can be simulated**:
  - Use hash navigation + a static `#post` section.
  - Use minimal DOM to satisfy selectors without implementing real routing/state management.
- **Framework detection is keyword-based**:
  - Use a framework without listing typical dependency names (CDN / vendor bundle) or avoid detectable strings.
- **Evaluator flakiness can dominate outcome**:
  - Stored reports show failures due to Selenium Chrome session creation and `ERR_CONNECTION_REFUSED`.
  - Depending on environment stability, tests may fail for non-product reasons or get skipped.

#### Lessons that directly shape FIX analyzer implementation
Anti-patterns to avoid in the FIX analyzer task:
- **Do not rely on surface checks** (e.g., “it parses some sample”): enforce correctness via targeted negative cases and properties.
- **Make performance claims testable**: include executable enforcement (alloc counting, throughput tests).
- **Avoid external, flaky dependencies for core correctness**: do not hinge on browser drivers, network availability, or timing luck.
- **Deterministic memory behavior must be designed in, not observed**: bounded data structures and “no allocations after warmup” should be mechanically enforced.

---

### PHASE 1 — Deep Review (repository_before/src/lib.rs)

The starter `TradeAnalyzer` in `repository_before/src/lib.rs` violates nearly every hard requirement:

#### Architectural bottlenecks
- **Mutex on every hot structure**:
  - `messages: Mutex<Vec<FixMessage>>`
  - `stats: Mutex<HashMap<String, i64>>`
  - `seen_order_ids: Mutex<Vec<String>>`
  These create serialization points: ingestion and queries contend on the same locks.

- **O(n) duplicate detection**
  - For each message, it linearly scans `seen_order_ids` (grows without bound).

- **Report generation blocks ingestion**
  - `generate_report()` locks `messages` and `stats` and performs full scans and string building while holding locks.

#### Allocation-heavy hot path
- `raw.split('|').map(|s| s.to_string()).collect::<Vec<String>>()`
  - Allocates per field.
- `field.split('=').collect::<Vec<&str>>()`
  - Allocates `Vec` per field.
- Stores per-message `FixMessage` with owned `String`s and pushes into `Vec` (unbounded memory growth).

#### Incorrect parsing assumptions / delimiter handling
- Splitting on `'|'` cannot handle escaped delimiters, so:
  - `11=ORD|001` becomes `11=ORD` + `001` (invalid field), producing incorrect order IDs and false duplicate detection.
  - `58=hello|world` is similarly corrupted.

#### Memory growth risks
- Stores all messages and all order IDs forever (no 10-second bound, no 8-hour stability).

#### Stats correctness hazards
- Uses signed `i64` counters and adds quantities into `i64` (`quantity as i64`), risking overflow → negative values under long runs / high volume.
- `get_stats()` clones the whole map (allocations + lock hold).

Conclusion: The current implementation cannot meet throughput, cannot provide non-blocking queries, cannot preserve correctness with escaped delimiters, and cannot satisfy deterministic memory bounds.

---

### PHASE 2 — Deep Technical Analysis (Parsing / Concurrency / Memory / Streaming)

#### Parsing layer: FIX delimiter + escaping rules (as enforced here)
Dataset format: `tag=value|tag=value|...|`
- Field delimiter is `|` (byte `0x7C`).
- Literal `|` inside a value is represented as `\|` (backslash escape).
- Escape rule implemented:
  - When scanning a value, `\X` decodes to literal `X` (including `|` and `\`).
  - Unescaped `|` terminates a field.
- Tag/value split:
  - Split on the **first `=`** to avoid corrupting values that might contain `=`.

Malformed message behavior:
- Invalid/missing `=` in a field → error → message skipped, error reported (no panic).

#### Concurrency model: lock-free stats + concurrent readers
Design intent:
- **Single-threaded ingestion** preserves arrival order.
- **Concurrent queries** read atomics without taking locks; ingestion continues.

Implementation:
- Global counters: `AtomicU64` (total, malformed, buy, sell).
- Per-symbol counters: fixed-capacity open-addressing table with atomics:
  - Slot claim via CAS on `AtomicU64 key_hash`.
  - Counters are atomics updated with `fetch_add`.
  - Symbol bytes stored in a fixed-capacity monotonic arena.

Memory ordering:
- Insertion publishes `meta` (offset+len) with `Release` after storing bytes.
- Readers load with `Acquire` to see a consistent initialized key.

#### Memory model: bounded memory + no hot-path allocations after warmup
Bounded allocations are explicit and occur at initialization/warmup:
- Slot array and arena buffer allocated once in `TradeAnalyzer::new`.
- New symbols consume arena bytes until capacity; after that insertion returns a bounded error.

Hot path:
- Parsing is slice-based.
- Stats updates are atomic ops.
- No `Vec`, `String`, `HashMap`, or `format!` in ingestion.

This is enforced by tests via a counting global allocator:
- `hot_path_has_no_heap_allocations_after_warmup` asserts 0 allocations while processing 200k messages after warmup.

#### Streaming guarantees: reporting without ingestion pause
Report generation uses:
- Atomic loads + iteration over slots, writing directly to a `Write`.
- No mutex acquisition, so ingestion does not block.

---

### PHASE 3 — Problem Restatement & Constraints (Why naïve approaches fail)

- Naïve parsing (`split('|')`) fails because delimiter characters can appear in values when escaped (`\|`).
- Mutex-based stats collapse because all producers and readers serialize on shared locks at high message rates.
- Buffering messages to build reports violates:
  - the 10-second buffer bound
  - the 8-hour zero-growth requirement
  - and causes report generation to pause ingestion
- Microsecond timestamps must not be parsed into floats; float parsing/formatting risks rounding and precision loss.
- Deterministic memory is mandatory: "no growth" must be achieved by **construction** (bounded structures), not by hope.

---

### PHASE 4 — Architecture & Strategy (End-to-end)

**Data flow**
1. Ingest raw message bytes (`&[u8]`) in arrival order.
2. Parse required tags (`11,55,54,38,52`) plus validate escaped delimiter handling via tag `58`.
3. Update atomic counters:
   - global totals
   - per-side counts
   - per-symbol count + volume (bounded table)
4. Concurrent queries/report generation read atomics and write streaming output.

**Constraint enforcement**
- **No external parsing libs**: manual scanner + slice splitting.
- **Escaped delimiter correctness**: delimiter scan respects backslash escapes.
- **Lock-free stats**: atomics only, no mutex.
- **Concurrent queries without blocking**: report is atomic loads; no shared locks.
- **No buffering >10s**: no message buffering at all.
- **No hot-path allocations after warmup**: allocator-count test enforces this.

Rejected designs (and why)
- `Mutex<HashMap>`: violates no-blocking and throughput targets.
- Storing every order ID for dedup: violates bounded memory over 8 hours.
- Parsing via regex/nom/pest: explicitly disallowed and allocation-heavy.

---

### PHASE 5 — Ground Truth Implementation (Where it lives)

Implementation is in:
- `repository_after/src/lib.rs`
- `repository_after/src/main.rs`
- Tests in `repository_after/tests/`

Key properties:
- Manual escape-aware field boundary scan
- Zero-copy field values (`EscapedValue<'a>`)
- Atomic stats and bounded symbol storage
- Streaming report via `write_report`

---

### PHASE 6 — Validation & Enforcement

Enforced by Dockerfile + release tests:
- Dockerfile runs `cargo test --release`.

Tests:
- `tests/fix_parser_and_analyzer.rs`
  - Escaped pipe parsing for tag 58
  - Order ID containing escaped pipe
  - Malformed message skip + log path (no crash)
  - Microsecond timestamp parse validation
  - Concurrent report generation while ingesting (no lock-based deadlock)
- `tests/perf_and_alloc.rs`
  - **No allocations after warmup**
  - **1,000,000 messages < 3 seconds**

---

### PHASE 7 — Ground Truth Notes

The calibration baseline (605d32) demonstrates that weak/heuristic evaluators can be passed by implementations that satisfy superficial criteria but violate real requirements. This FIX analyzer implementation intentionally avoids that trap by:
- enforcing correctness through explicit edge-case tests
- enforcing performance and allocation constraints mechanically
- using bounded, deterministic memory by construction


