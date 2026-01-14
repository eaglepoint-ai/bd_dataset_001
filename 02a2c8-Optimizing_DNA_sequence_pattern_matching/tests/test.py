# tests/test.py
import sys
import time
import importlib
import threading
from pathlib import Path

# -------------------------------
# Pytest progress tracking + status
# -------------------------------
TOTAL_TESTS = 0
COMPLETED_TESTS = 0


def pytest_collection_modifyitems(session, config, items):
    global TOTAL_TESTS
    TOTAL_TESTS = len(items)


def pytest_runtest_logreport(report):
    """
    Called for each test phase: setup, call, teardown
    We only care about the CALL phase.
    """
    global COMPLETED_TESTS

    if report.when == "call":
        COMPLETED_TESTS += 1
        percent = int((COMPLETED_TESTS / TOTAL_TESTS) * 100)

        status = "PASS" if report.passed else "FAIL"
        print(f"[{status}] {report.nodeid.split('::')[-1]} ({percent}%)")


# -------------------------------
# Import target module
# -------------------------------
APP_DIR = Path("/app")
if str(APP_DIR) not in sys.path:
    sys.path.insert(0, str(APP_DIR))

dna = importlib.import_module("dna_sequence_pattern_matcher")


# -------------------------------
# Tests
# -------------------------------

def test_correctness_small():
    genome = "ACGTACGTTAGCTAGCTAGCT"
    pattern = "TAGC"
    result = list(dna.find_dna(genome, pattern))
    assert result == [8, 12, 16]


def test_no_match():
    genome = "AAAAAAAAAAAA"
    pattern = "TTT"
    result = list(dna.find_dna(genome, pattern))
    assert result == []


def test_long_pattern_fallback():
    genome = "ACGT" * 5000
    pattern = "ACGT" * 20
    result = list(dna.find_dna(genome, pattern))
    assert result and result[0] == 0


def test_performance_large_genome():
    """
    HARD PERFORMANCE GATE
    - Check every 5 seconds
    - Fail immediately if time exceeds limit
    """
    genome = "ACGT" * 250_000  # 1M bp
    pattern = "ACGTACGT"

    TIME_LIMIT = 0.5
    CHECK_INTERVAL = 5.0

    result_container = {}
    error_container = {}

    def run():
        try:
            result_container["result"] = list(
                dna.find_dna(genome, pattern)
            )
        except Exception as e:
            error_container["error"] = e

    thread = threading.Thread(target=run)
    start = time.time()
    thread.start()

    while thread.is_alive():
        elapsed = time.time() - start
        if elapsed > TIME_LIMIT:
            raise AssertionError(
                f"Too slow: {elapsed:.2f}s (must be < {TIME_LIMIT}s)"
            )
        time.sleep(CHECK_INTERVAL)

    thread.join()

    if "error" in error_container:
        raise error_container["error"]

    assert len(result_container["result"]) > 0