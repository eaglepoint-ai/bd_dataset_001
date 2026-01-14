#!/usr/bin/env python3
"""
Evaluation script for count_transaction_ranges optimization.

Required contract:
- run_evaluation() -> dict
- main() -> int
"""

import sys
import json
import uuid
import platform
import subprocess
from pathlib import Path
from datetime import datetime

ROOT = Path(__file__).resolve().parent.parent
REPORTS = ROOT / "evaluation" / "reports"


def environment_info():
    """Gather environment information for the report."""
    return {
        "python_version": platform.python_version(),
        "platform": platform.platform()
    }


def run_tests(repo_path: Path):
    """
    Run pytest against a specific repository.
    
    Args:
        repo_path: Path to repository_before or repository_after
        
    Returns:
        Dictionary with passed, return_code, and output fields
    """
    try:
        proc = subprocess.run(
            [sys.executable, "-m", "pytest", str(ROOT / "tests"), "-v", "--tb=short"],
            cwd=repo_path,
            capture_output=True,
            text=True,
            timeout=300
        )
        full_output = proc.stdout + proc.stderr
        # Keep last 8000 chars to ensure summary line is captured
        output = full_output[-8000:] if len(full_output) > 8000 else full_output
        return {
            "passed": proc.returncode == 0,
            "return_code": proc.returncode,
            "output": output
        }
    except subprocess.TimeoutExpired:
        return {
            "passed": False,
            "return_code": -1,
            "output": "pytest timeout"
        }


def run_metrics(repo_path: Path, test_output: str = ""):
    """
    Extract metrics from test output.
    
    Args:
        repo_path: Path to the repository
        test_output: Raw pytest output string
        
    Returns:
        Dictionary with numeric metrics only
    """
    import re
    
    metrics = {
        "total_tests": 0,
        "passed_tests": 0,
        "failed_tests": 0,
        "test_duration_seconds": 0.0
    }
    
    # Parse pytest summary (e.g., "31 passed in 1.02s" or "10 passed, 21 failed in 5.5s")
    passed_match = re.search(r"(\d+) passed", test_output)
    failed_match = re.search(r"(\d+) failed", test_output)
    duration_match = re.search(r"in ([\d.]+)s", test_output)
    
    if passed_match:
        metrics["passed_tests"] = int(passed_match.group(1))
    if failed_match:
        metrics["failed_tests"] = int(failed_match.group(1))
    if duration_match:
        metrics["test_duration_seconds"] = float(duration_match.group(1))
    
    metrics["total_tests"] = metrics["passed_tests"] + metrics["failed_tests"]
    
    return metrics


def evaluate(repo_name: str):
    """
    Run full evaluation for a repository.
    
    Args:
        repo_name: Either 'repository_before' or 'repository_after'
        
    Returns:
        Dictionary with tests and metrics results
    """
    repo_path = ROOT / repo_name
    tests = run_tests(repo_path)
    metrics = run_metrics(repo_path, tests.get("output", ""))
    return {
        "tests": tests,
        "metrics": metrics
    }


def run_evaluation():
    """
    Main evaluation function that runs tests on both repositories.
    
    Returns:
        Complete evaluation report as dictionary matching the schema
    """
    run_id = str(uuid.uuid4())
    start = datetime.utcnow()
    
    before = evaluate("repository_before")
    after = evaluate("repository_after")
    
    comparison = {
        "passed_gate": after["tests"]["passed"],
        "improvement_summary": "After implementation passed correctness checks."
    }
    
    end = datetime.utcnow()
    
    return {
        "run_id": run_id,
        "started_at": start.isoformat() + "Z",
        "finished_at": end.isoformat() + "Z",
        "duration_seconds": (end - start).total_seconds(),
        "environment": environment_info(),
        "before": before,
        "after": after,
        "comparison": comparison,
        "success": comparison["passed_gate"],
        "error": None
    }


def main():
    """
    Main entry point for evaluation script.
    
    Returns:
        0 if evaluation passed, 1 otherwise
    """
    REPORTS.mkdir(parents=True, exist_ok=True)
    report = run_evaluation()
    path = REPORTS / "latest.json"
    path.write_text(json.dumps(report, indent=2))
    print(f"Report written to {path}")
    return 0 if report["success"] else 1


if __name__ == "__main__":
    sys.exit(main())
