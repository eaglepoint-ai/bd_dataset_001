# Trajectory (Thinking Process for Testing)

### 1. Code Audit → Test Coverage & Risk Audit

**Goal:** Identify dependencies, side effects, and failure points in the source code.

I audited the `message_scraper.py` script and identified specific risks that made manual testing viable but automated testing difficult:

- **External Dependency:** The script relies on `Telethon.TelegramClient`, which requires a live internet connection and real credentials.
- **Side Effects:** The script writes directly to the local file system (`csv_file`).
- **Non-Determinism:** The script depends on system time (`asyncio.sleep`) and network latency.
- **Global Scope Execution:** The script initializes the client at the top level, causing immediate crashes during test imports if environment variables are missing.

**Decision:** The test suite must be **fully isolated**. Real network calls and file operations are strictly forbidden.

### 2. Performance Contract → Test Strategy & Guarantees

**Goal:** Define the conditions for "Success" based on the requirements.

I defined a strict "contract" for the test suite based on the 15 specific constraints provided:

- **Isolation Guarantee:** No API keys are required; no files are created.
- **Coverage Guarantee:** All logical branches (Success, Filter, Error) must be exercised.
- **Speed:** Tests must run instantly (sub-second), requiring the mocking of `asyncio.sleep`.
- **Verification:** A "Meta-Test" must exist to statically prove that every requirement ID (1-15) is mapped to a specific test function.

### 3. Data Model Refactor → Fixtures and Factories

**Goal:** Create efficient, reusable data structures for testing.

Instead of instantiating heavy Telethon `Message` objects (which require a connected client context), I applied the "Factory Pattern":

- **Artifact:** `mock_message_factory` fixture.
- **Logic:** This allows the dynamic creation of lightweight mock objects with configurable attributes (Date, Views, Reactions) on the fly.
- **Benefit:** This solved the "Missing Fields" requirement (Req #9) by allowing tests to explicitly pass `None` to specific fields without complex setup.

### 4. Stable Ordering → Deterministic Tests

**Goal:** Ensure tests behave predictably regardless of the execution environment.

To ensure stability and determinism:

- **Environment Mocking:** I injected dummy `API_ID` and `API_HASH` values into `os.environ` _before_ importing the module to prevent `ValueError` crashes.
- **Time Control:** I patched `asyncio.sleep` with an `AsyncMock`. This ensures that the `FloodWaitError` test verifies the _logic_ of waiting without actually pausing the test runner for 15 seconds.

### 5. Query Optimization → Edge-Case Coverage

**Goal:** Handle "Hot Paths" and error scenarios efficiently.

I mapped the logic flow to specific test cases to cover the "N+1" equivalent of logic errors:

- **Filtering Logic:** Verified the "Year 2024" filter (Req #3) by injecting a stream of messages from 2023, 2024, and 2025, asserting that only the 2024 message reached the CSV writer.
- **Error Handling:** specifically targeted `FloodWaitError`.
  - _Correction:_ During implementation, I encountered a `TypeError` because the `FloodWaitError` constructor expects an integer. I refactored the test to match the internal library signature (`capture=15`).

### 6. Final Verification → Assertions & Invariants

**Goal:** Prove the system works through measurable signals.

Verification was implemented in two layers:

1.  **Functional Assertions:**
2.  **Meta-Verification:**
