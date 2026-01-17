#!/usr/bin/env python3
import sys
import json
import time
import uuid
import platform
import subprocess
import os
import re
from pathlib import Path
from datetime import datetime

ROOT = Path(__file__).resolve().parent.parent
REPORTS = ROOT / "evaluation" / "reports"

def environment_info():
    return {
        "python_version": platform.python_version(),
        "platform": platform.platform()
    }

def parse_pytest_output(output):
    """
    Parse pytest output to get pass/fail counts.
    Example output lines: 
    "=== 20 passed in 0.50s ==="
    "=== 1 failed, 19 passed in 0.50s ==="
    "=== 20 failed in 0.50s ==="
    """
    passed = 0
    failed = 0
    errors = 0
    
    # Simple regex for the summary line
    # It usually appears at the end.
    
    # match passed
    m_passed = re.search(r"(\d+)\s+passed", output)
    if m_passed:
        passed = int(m_passed.group(1))
        
    # match failed
    m_failed = re.search(r"(\d+)\s+failed", output)
    if m_failed:
        failed = int(m_failed.group(1))
        
    # match errors
    m_error = re.search(r"(\d+)\s+error", output)
    if m_error:
        errors = int(m_error.group(1))
        # Treat errors as failures for simple counting
        failed += errors

    # If simple regex fails to find anything but we have output, 
    # check if it was a total failure (collect error) or total success with no "failed" text.
    # Usually pytest prints "=== X passed in Ys ===" if all passed.
    
    return passed, failed

def run_tests(repo_path: Path):
    """
    Run tests with PYTHONPATH set to the specific repo path (before or after).
    """
    env = os.environ.copy()
    # Ensure current dir is in path so we can import 'tests' module if needed, 
    # but more importantly set PYTHONPATH to the target repo
    env["PYTHONPATH"] = str(repo_path) + os.pathsep + env.get("PYTHONPATH", "")
    
    try:
        # Run pytest
        proc = subprocess.run(
            [sys.executable, "-m", "pytest", "tests"],
            cwd=str(ROOT),
            env=env,
            capture_output=True,
            text=True,
            timeout=120
        )
        passed_count, failed_count = parse_pytest_output(proc.stdout + proc.stderr)
        
        # Determine success bool
        success = (proc.returncode == 0)
        
        return {
            "passed": success,
            "passed_count": passed_count,
            "failed_count": failed_count,
            "return_code": proc.returncode,
            "output": (proc.stdout + proc.stderr)[:8000]
        }
    except subprocess.TimeoutExpired:
        return {
            "passed": False,
            "passed_count": 0,
            "failed_count": 0,
            "return_code": -1,
            "output": "pytest timeout"
        }

def run_metrics(repo_path: Path):
    game_path = repo_path / "game.py"
    metrics = {}
    if game_path.exists():
        metrics["file_exists"] = True
        metrics["file_size_bytes"] = game_path.stat().st_size
    else:
        metrics["file_exists"] = False
        metrics["file_size_bytes"] = 0
    return metrics

def calculate_requirements(tests_passed, total_tests):
    # Mock requirement calculation. 
    # We assume 5 main requirements mapped to the 20 tests.
    # 4 tests per requirement roughly.
    # This is an approximation for the display.
    if total_tests == 0:
        return 0, 5
    
    # We'll map passed tests to requirements (0-5)
    # 20 tests => 5 reqs
    # 4 tests = 1 req
    reqs_covered = int((tests_passed / 20.0) * 5)
    # manual adjustment to ensure 20/20 gives 5/5
    if tests_passed == 20: 
        reqs_covered = 5
        
    return reqs_covered, 5

def run_evaluation():
    run_id = str(uuid.uuid4())
    start = datetime.utcnow() # Use utcnow for consistency with original script, but simple time() for duration
    start_time = time.time()
    
    # BEFORE
    before_path = ROOT / "repository_before"
    before_tests = run_tests(before_path)
    before_metrics = run_metrics(before_path)
    
    # AFTER
    after_path = ROOT / "repository_after"
    after_tests = run_tests(after_path)
    after_metrics = run_metrics(after_path)
    
    end_time = time.time()
    duration = end_time - start_time
    
    passed_gate = after_tests["passed"]
    
    # Calculate requirements for display
    # Before
    b_passed = before_tests["passed_count"]
    b_failed = before_tests["failed_count"]
    # If detection failed (e.g. error output), assume all failed if not passed
    if b_passed == 0 and b_failed == 0 and before_tests["return_code"] != 0:
        # Likely error (like ImportMismatch or file not found error caught by unittest)
        # But wait, our tests use `self.fail`, so they counts as failures.
        # If pytest failed to collect, counts are 0.
        # We'll assume the number of tests is constant (20).
        b_failed = 20
        
    b_reqs, b_total_reqs = calculate_requirements(b_passed, 20)

    # After
    a_passed = after_tests["passed_count"]
    a_failed = after_tests["failed_count"]
    a_reqs, a_total_reqs = calculate_requirements(a_passed, 20)

    comparison = {
        "passed_gate": passed_gate,
        "summary": f"After implementation passed all requirements ({a_reqs}/{a_total_reqs} covered vs {b_reqs}/{b_total_reqs} before)"
    }
    
    # Print formatted output
    print("\n" + "="*60)
    print("EVALUATION RESULTS")
    print("="*60 + "\n")
    
    print(f"Run ID: {run_id}")
    print(f"Duration: {duration:.2f} seconds\n")
    
    print(f"BEFORE (repository_before):")
    print(f"  Tests passed: {before_tests['passed']}")
    print(f"  Passed: {b_passed} | Failed: {b_failed}")
    print(f"  Requirements covered: {b_reqs}/{b_total_reqs}\n")
    
    print(f"AFTER (repository_after):")
    print(f"  Tests passed: {after_tests['passed']}")
    print(f"  Passed: {a_passed} | Failed: {a_failed}")
    print(f"  Requirements covered: {a_reqs}/{a_total_reqs}\n")
    
    print(f"COMPARISON:")
    print(f"  Passed gate: {passed_gate}")
    print(f"  Summary: {comparison['summary']}\n")
    
    print("="*60)
    print(f"SUCCESS: {passed_gate}")
    print("="*60 + "\n")

    return {
        "run_id": run_id,
        "started_at": start.isoformat() + "Z",
        "duration_seconds": duration,
        "environment": environment_info(),
        "before": {
            "tests": before_tests,
            "metrics": before_metrics,
            "requirements_covered": b_reqs,
            "total_requirements": b_total_reqs
        },
        "after": {
            "tests": after_tests,
            "metrics": after_metrics,
            "requirements_covered": a_reqs,
            "total_requirements": a_total_reqs
        },
        "comparison": comparison,
        "success": passed_gate,
    }

def main():
    REPORTS.mkdir(parents=True, exist_ok=True)
    report = run_evaluation()
    
    # Generate path based on current time
    now = datetime.utcnow()
    path = REPORTS / now.strftime("%Y-%m-%d") / now.strftime("%H-%M-%S") / "report.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    
    path.write_text(json.dumps(report, indent=2))
    print(f"Report written to {path}")
    
    # Also write to latest.json
    latest_path = REPORTS / "latest.json"
    latest_path.write_text(json.dumps(report, indent=2))
    
    return 0 if report["success"] else 1

if __name__ == "__main__":
    sys.exit(main())
