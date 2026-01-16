#!/usr/bin/env python3
"""
Evaluation script for Automatic Differentiation Engine.
Compares repository_before/ vs repository_after/ implementations.
"""
import sys
import json
import time
import uuid
import platform
import subprocess
from pathlib import Path
from datetime import datetime

ROOT = Path(__file__).resolve().parent.parent
REPORTS = ROOT / "evaluation" / "reports"


def environment_info():
    """Collect environment metadata."""
    return {
        "python_version": platform.python_version(),
        "platform": platform.platform()
    }


def run_tests(repo_name: str):
    """
    Run pytest on the specified repository's tests.
    
    Args:
        repo_name: Either 'repository_before' or 'repository_after'
    
    Returns:
        dict with passed, return_code, and output
    """
    test_path = ROOT / repo_name / "tests"
    
    # Check if tests directory exists
    if not test_path.exists():
        return {
            "passed": False,
            "return_code": -1,
            "output": f"Tests directory not found: {test_path}"
        }
    
    try:
        proc = subprocess.run(
            [sys.executable, "-m", "pytest", str(test_path), "-q", "--tb=short"],
            cwd=ROOT,
            capture_output=True,
            text=True,
            timeout=120,
            env={
                **dict(subprocess.os.environ),
                "PYTHONPATH": str(ROOT / repo_name)
            }
        )
        return {
            "passed": proc.returncode == 0,
            "return_code": proc.returncode,
            "output": (proc.stdout + proc.stderr)[:8000]
        }
    except subprocess.TimeoutExpired:
        return {
            "passed": False,
            "return_code": -1,
            "output": "pytest timeout (>120s)"
        }
    except Exception as e:
        return {
            "passed": False,
            "return_code": -1,
            "output": f"Error running tests: {str(e)}"
        }


def run_metrics(repo_name: str):
    """
    Collect optional metrics for the repository.
    
    For autodiff engine, we could measure computation time
    on sample expressions, but keeping it simple for now.
    """
    # Optional: Add performance metrics if needed
    return {}


def evaluate(repo_name: str):
    """
    Evaluate a single repository (before or after).
    
    Args:
        repo_name: Either 'repository_before' or 'repository_after'
    
    Returns:
        dict with tests and metrics results
    """
    tests = run_tests(repo_name)
    metrics = run_metrics(repo_name)
    return {
        "tests": tests,
        "metrics": metrics
    }


def run_evaluation():
    """
    Main evaluation logic.
    
    Returns:
        dict: Complete evaluation report matching the standard schema
    """
    run_id = str(uuid.uuid4())
    start = datetime.utcnow()
    error = None
    
    try:
        before = evaluate("repository_before")
        after = evaluate("repository_after")
        
        # Success rule: after tests must pass
        passed_gate = after["tests"]["passed"]
        
        # Generate improvement summary
        if passed_gate and not before["tests"]["passed"]:
            improvement_summary = "Implementation completed: tests now pass"
        elif passed_gate and before["tests"]["passed"]:
            improvement_summary = "Both before and after pass tests"
        elif not passed_gate and not before["tests"]["passed"]:
            improvement_summary = "Neither before nor after pass tests"
        else:
            improvement_summary = "Regression: before passed but after fails"
        
        comparison = {
            "passed_gate": passed_gate,
            "improvement_summary": improvement_summary
        }
        
    except Exception as e:
        before = {"tests": {"passed": False, "return_code": -1, "output": ""}, "metrics": {}}
        after = {"tests": {"passed": False, "return_code": -1, "output": ""}, "metrics": {}}
        comparison = {"passed_gate": False, "improvement_summary": "Evaluation error"}
        error = str(e)
    
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
        "error": error
    }


def main():
    """
    Entry point for evaluation.
    
    Returns:
        int: 0 if success, 1 if failure
    """
    REPORTS.mkdir(parents=True, exist_ok=True)
    
    report = run_evaluation()
    
    # Write report with timestamp
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    report_path = REPORTS / f"report_{timestamp}.json"
    report_path.write_text(json.dumps(report, indent=2))
    print(f"Report written to {report_path}")
    
    # Print summary
    print(f"\n{'='*50}")
    print(f"Evaluation Summary")
    print(f"{'='*50}")
    print(f"Before tests passed: {report['before']['tests']['passed']}")
    print(f"After tests passed:  {report['after']['tests']['passed']}")
    print(f"Success: {report['success']}")
    print(f"{'='*50}\n")
    
    return 0 if report["success"] else 1


if __name__ == "__main__":
    sys.exit(main())