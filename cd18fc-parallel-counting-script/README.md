# Prime Counter — Parallel Segmented Sieve

Problem statement
-----------------
Count all prime numbers up to 10^7 efficiently and portably using Python
standard library only. The implementation must:

- Use a Sieve of Eratosthenes to generate base primes up to sqrt(limit).
- Use a segmented sieve to process the range in fixed-size chunks (10,000).
- Use multiprocessing to distribute grouped chunks across CPU cores.
- Avoid materializing the full 10 million boolean array in memory.
- Be cross-platform (Windows/macOS/Linux) and avoid global mutable shared state.

Prompt used
-----------
Implement a parallel prime counting script in Python that:

- Finds all primes <= 10^7.
- Auto-detects CPU cores and uses multiprocessing to parallelize work.
- Uses chunk-based segmented sieve (chunk size fixed at 10,000).
- Aggregates results and prints a short summary: `Time: X.XX seconds  Primes found: N`.
- Targets execution < 0.09s on a modern 8-core CPU (reference).

Requirements
------------
- Correctness: Matches known prime counts (e.g., π(10^7) = 664579).
- Memory efficient: No full-range materialization; per-chunk allocations only.
- Performance: Group tasks and minimize pickling/scheduling overhead.
- Cross-platform: Use `fork` when available; fall back to `spawn` with initializer.
- No external dependencies beyond the Python standard library.

How the implementation works (summary)
------------------------------------
- `generate_base_primes(limit)`: Sieve of Eratosthenes to produce base primes up to sqrt(limit).
- `create_chunks(start, end, chunk_size)`: produce 10k chunks.
- `count_primes_in_segment((start,end, base_primes))`: segmented sieve for that slice using `bytearray` and slice assignment for marking multiples.
- `count_primes_parallel(limit, chunk_size)`: groups adjacent 10k chunks into larger tasks, provides base primes to workers via fork inheritance or an initializer, and aggregates results via `imap_unordered`.

Commands
--------

Local (no Docker)

Run the project's custom test runner (recommended because it collects performance metrics):
```bash
python3 tests/test_after.py
```

Run pytest directly (will attempt to discover tests):
```bash
pytest -q
```

Docker (recommended for reproducible environment)

Build the image:
```bash
docker compose build --no-cache app
```

Run tests against `repository_after` (custom runner):
```bash
docker compose run --rm -e PYTHONPATH=/app/repository_after app python tests/test_after.py
```

Run pytest inside container (requires `pytest` in image):
```bash
docker compose run --rm -e PYTHONPATH=/app/repository_after app pytest -q
```

Run evaluation script to produce a JSON report:
```bash
docker compose run --rm -e PYTHONPATH=/app/repository_after app python evaluation/evaluation.py
```

Notes
-----
- There is no `repository_before` application code in this task — the focus
  is the optimized implementation in `repository_after`.
- The Docker image installs `pytest` via `requirements.txt` to support
  running tests inside containers.
- The test runner prints measured execution time and prime count; the
  evaluation script captures these into a JSON report under `evaluation/`.

Contact / Next steps
--------------------
If you want, I can:

- Add a small benchmark harness that runs multiple iterations and reports
  median/p95 timings.
- Add a `Makefile` with convenient targets (`make build`, `make test`, `make eval`).
- Commit the changes and add a short changelog entry.

---

End of README.
