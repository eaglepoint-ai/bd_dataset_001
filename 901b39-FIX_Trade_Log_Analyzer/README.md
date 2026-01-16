High-Frequency Trading Log Analyzer

Problem Statement:
The trade log analyzer at a quantitative trading firm processes real-time market data feeds to detect anomalies and generate compliance reports. The current implementation cannot keep pace with market open volume, causing monitoring delays and missed compliance requirements.

Context:
You are a systems engineer at a quantitative trading firm. The log analyzer service processes FIX protocol-style trade logs to extract metrics and generate reports. Operations reports that the service falls behind during peak hours and crashes after extended runtime.

Business Impact:
- Analyzer falls behind during market open (9:30-10:00 AM peak)
- Memory grows unbounded, crashes after approximately 2 hours
- Some valid FIX messages rejected with "parse error"
- Duplicate order IDs detected when none exist in source data
- Statistics show impossible negative trade counts
- Report generation blocks incoming message processing

Environment:
- Language: Rust (edition 2021)
- Input: FIX protocol-style trade logs (pipe-delimited key=value pairs)
- No external parsing libraries allowed (regex, nom, pest, etc.)
- Target machine: 4 cores, 2GB RAM limit
- Must handle 500,000 messages/second sustained throughput
- Must run continuously for 8-hour trading session

Log Format:
8=FIX.4.2|35=D|49=SENDER|56=TARGET|11=ORD001|55=AAPL|54=1|38=100|44=150.25|52=20240115-09:30:00.123456|10=128|

Constraints:
- Cannot buffer more than 10 seconds of messages in memory
- Must process messages in arrival order
- Statistics must be queryable without blocking ingestion
- No heap allocations in hot path after warmup
- Must handle malformed messages without crashing

Requirements:
1. Create a complete Rust module with proper Cargo.toml
2. Implement FIX message parser handling escaped delimiters
3. Implement lock-free statistics collection
4. Implement streaming report generation
5. Handle all edge cases in validation scenarios

Validation Scenarios:
1. Process 1 million messages in under 3 seconds
2. Run 8 hours with 100k msg/sec without memory growth
3. FIX message with escaped pipe in field 58 (Text) parsed correctly
4. Concurrent stats query during peak ingestion shows no blocking
5. Malformed message (missing delimiter) logged and skipped
6. Order ID "ORD|001" with pipe in value parsed correctly
7. Microsecond timestamps preserve full precision
8. Generate compliance report while processing continues

Starter Code:
The TradeAnalyzer exists in repository_before/src/lib.rs and contains the issues causing the production incidents.

---

Repository Layout

- **`repository_before/`**: baseline implementation (expected to **fail** evaluation / constraints)
- **`repository_after/`**: fixed implementation (expected to **pass** evaluation / constraints)
- **`evaluation/`**: evaluation runner that tests before vs after and writes JSON reports

---

Commands

## Docker (evaluation: before must fail, after must pass)

From this directory:

```bash
docker build -t fix-trade-analyzer-eval .
docker run --rm -v "$PWD/evaluation/reports:/app/evaluation/reports" fix-trade-analyzer-eval
```

- **Expected result**: container exits **0**
  - `repository_before` fails (compile/runtime) **by design**
  - `repository_after` passes all enforced checks
- **Reports**:
  - `evaluation/reports/latest.json`
  - `evaluation/reports/<YYYY-MM-DD>/<HH-MM-SS>/report.json`

## docker-compose (your machine uses docker-compose v1)

If `docker compose ...` fails, use `docker-compose ...`:

```bash
docker-compose run --rm test-before
docker-compose run --rm test-after
docker-compose run --rm evaluation
```

Notes:
- `test-before` exits **0** because it runs the evaluator in “before” mode and expects failure.
- `test-after` exits **0** only when the fixed implementation passes.

---

Developer Notes:
If unfamiliar with Rust performance patterns:
- Rust Book: https://doc.rust-lang.org/book/
- Rust Performance Book: https://nnethercote.github.io/perf-book/
- Use AI assistance to understand zero-copy parsing, lock-free data structures, and arena allocators

