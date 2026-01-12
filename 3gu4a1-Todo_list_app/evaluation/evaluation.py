#!/usr/bin/env python3
"""
Evaluation script for comparing repository_before and repository_after.
"""

import os
import sys
import json
import uuid
import platform
import subprocess
from pathlib import Path
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parent.parent
REPORTS = ROOT / "evaluation" / "reports"


def environment_info():
    """Collect environment metadata."""
    return {
        "python_version": platform.python_version(),
        "platform": platform.platform(),
    }


def run_tests(repo_name: str):
    """Run pytest tests for a specific repository. Returns test results dictionary."""
    if not (ROOT / repo_name / "main.py").exists():
        return {
            "passed": False,
            "return_code": -1,
            "output": f"Repository {repo_name} has no implementation (main.py not found)",
        }

    try:
        env = os.environ.copy()
        env["PYTHONPATH"] = f"{ROOT}:{env.get('PYTHONPATH', '')}".rstrip(":")

        proc = subprocess.run(
            ["pytest", "tests", "-q", "--tb=short"],
            cwd=ROOT,
            env=env,
            capture_output=True,
            text=True,
            timeout=120,
        )

        output = (proc.stdout + proc.stderr)[:8000]
        has_passed = "passed" in output.lower() and "0 passed" not in output.lower()

        return {
            "passed": proc.returncode == 0 and has_passed,
            "return_code": proc.returncode,
            "output": output,
        }
    except subprocess.TimeoutExpired:
        return {
            "passed": False,
            "return_code": -1,
            "output": "pytest timeout after 120 seconds",
        }
    except Exception as e:
        return {
            "passed": False,
            "return_code": -1,
            "output": f"Error running tests: {str(e)}",
        }


def run_metrics():
    """
    Optional metrics collection.
    Implement task-specific metrics here if needed.
    """
    # Placeholder for future metrics
    # Example metrics could include:
    # - Performance metrics (response times, throughput)
    # - Stability metrics (failure rates)
    # - Resource usage (memory, CPU)
    return {}


def evaluate(repo_name: str):
    """
    Evaluate a repository by running tests and collecting metrics.
    Returns evaluation results dictionary.
    """
    # Run tests
    tests = run_tests(repo_name)

    # Collect metrics (optional)
    metrics = run_metrics()

    return {"tests": tests, "metrics": metrics}


def run_evaluation():
    """
    Main evaluation function.
    Runs evaluation on both repositories and generates comparison report.
    Returns complete report dictionary.
    """
    run_id = str(uuid.uuid4())
    start = datetime.now(timezone.utc)

    try:
        # Evaluate repository_before
        before = evaluate("repository_before")

        # Evaluate repository_after
        after = evaluate("repository_after")

        # Compare results
        before_passed = before["tests"]["passed"]
        after_passed = after["tests"]["passed"]

        summaries = {
            (True, True): "Both implementations passed tests",
            (False, True): "After implementation fixed failing tests",
            (True, False): "After implementation introduced regressions",
            (False, False): "Both implementations failed tests",
        }

        comparison = {
            "passed_gate": after_passed,
            "improvement_summary": summaries[(before_passed, after_passed)],
        }

        end = datetime.now(timezone.utc)
        duration = (end - start).total_seconds()

        report = {
            "run_id": run_id,
            "started_at": start.isoformat().replace("+00:00", "Z"),
            "finished_at": end.isoformat().replace("+00:00", "Z"),
            "duration_seconds": duration,
            "environment": environment_info(),
            "before": before,
            "after": after,
            "comparison": comparison,
            "success": comparison["passed_gate"],
            "error": None,
        }

        return report

    except Exception as e:
        # Error handling: evaluation crashed
        end = datetime.now(timezone.utc)
        duration = (end - start).total_seconds()

        return {
            "run_id": run_id,
            "started_at": start.isoformat().replace("+00:00", "Z"),
            "finished_at": end.isoformat().replace("+00:00", "Z"),
            "duration_seconds": duration,
            "environment": environment_info(),
            "before": {
                "tests": {"passed": False, "return_code": -1, "output": ""},
                "metrics": {},
            },
            "after": {
                "tests": {"passed": False, "return_code": -1, "output": ""},
                "metrics": {},
            },
            "comparison": {
                "passed_gate": False,
                "improvement_summary": "Evaluation crashed",
            },
            "success": False,
            "error": str(e),
        }


def main():
    """
    Main entry point.
    Creates reports directory, runs evaluation, writes report, and returns exit code.
    """
    # Create reports directory if it doesn't exist
    REPORTS.mkdir(parents=True, exist_ok=True)

    # Run evaluation
    report = run_evaluation()

    # Write report to report.json
    report_path = REPORTS / "report.json"
    report_path.write_text(json.dumps(report, indent=2))

    print(f"Evaluation report written to {report_path}")
    print(f"Success: {report['success']}")
    print(f"Before tests passed: {report['before']['tests']['passed']}")
    print(f"After tests passed: {report['after']['tests']['passed']}")

    # Return exit code: 0 for success, 1 for failure
    return 0 if report["success"] else 1


if __name__ == "__main__":
    sys.exit(main())
