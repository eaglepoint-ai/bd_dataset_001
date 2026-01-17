#!/usr/bin/env python3
"""
Evaluation script for Redux TypeScript refactoring task.

Runs compliance and smoke tests on both repository_before and repository_after,
generates a standardized report comparing the results.
"""

import sys
import json
import time
import uuid
import platform
import subprocess
import os
from pathlib import Path
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parent.parent
REPORTS = ROOT / "evaluation" / "reports"
TESTS_DIR = ROOT / "tests"


def environment_info():
    """Collect environment metadata."""
    return {
        "python_version": platform.python_version(),
        "platform": platform.platform()
    }


def run_node_test(test_file: str, target: str, timeout: int = 60):
    """
    Run a Node.js test file with TARGET environment variable.
    
    Args:
        test_file: Name of test file (e.g., "test_compliance.js")
        target: "before" or "after"
        timeout: Timeout in seconds
        
    Returns:
        dict with passed, return_code, and output
    """
    try:
        test_path = TESTS_DIR / test_file
        if not test_path.exists():
            return {
                "passed": False,
                "return_code": -1,
                "output": f"Test file not found: {test_file}"
            }
        
        env = {"TARGET": target, **dict(os.environ)}
        proc = subprocess.run(
            ["node", str(test_path)],
            cwd=ROOT,
            env=env,
            capture_output=True,
            text=True,
            timeout=timeout
        )
        
        # Combine stdout and stderr, truncate to 8000 chars
        output = (proc.stdout + proc.stderr)[:8000]
        
        return {
            "passed": proc.returncode == 0,
            "return_code": proc.returncode,
            "output": output
        }
    except subprocess.TimeoutExpired:
        return {
            "passed": False,
            "return_code": -1,
            "output": f"Test timeout after {timeout} seconds"
        }
    except Exception as e:
        return {
            "passed": False,
            "return_code": -1,
            "output": f"Error running test: {str(e)}"
        }


def run_compliance_tests(target: str):
    """Run compliance tests for the specified target."""
    return run_node_test("test_compliance.js", target, timeout=60)


def run_smoke_tests(target: str):
    """Run smoke tests for the specified target."""
    return run_node_test("test_simple.js", target, timeout=30)


def parse_test_output(output: str):
    """
    Parse test output to extract test statistics.
    
    Returns dict with passed, failed, total counts if available.
    """
    result = {
        "passed": None,
        "failed": None,
        "total": None
    }
    
    # Try to extract test counts from output
    lines = output.split('\n')
    for line in lines:
        if "Tests Passed:" in line:
            try:
                result["passed"] = int(line.split(":")[1].strip())
            except (ValueError, IndexError):
                pass
        if "Tests Failed:" in line:
            try:
                result["failed"] = int(line.split(":")[1].strip())
            except (ValueError, IndexError):
                pass
        if "Total Tests:" in line:
            try:
                result["total"] = int(line.split(":")[1].strip())
            except (ValueError, IndexError):
                pass
    
    return result


def evaluate(repo_name: str):
    """
    Evaluate a repository by running all tests.
    
    Args:
        repo_name: "repository_before" or "repository_after"
        
    Returns:
        dict with tests and metrics
    """
    target = "before" if repo_name == "repository_before" else "after"
    
    # Run compliance tests
    compliance = run_compliance_tests(target)
    compliance_stats = parse_test_output(compliance["output"])
    
    # Run smoke tests
    smoke = run_smoke_tests(target)
    smoke_stats = parse_test_output(smoke["output"])
    
    # Determine if code is compliant based on test stats
    # For before: compliance stats should show failures (code is non-compliant)
    # For after: compliance stats should show all passes (code is compliant)
    code_is_compliant = False
    if target == "before":
        # Before: code is non-compliant if compliance tests show failures
        # compliance_stats["failed"] > 0 means code failed compliance checks
        code_is_compliant = False  # Before is always non-compliant
    else:
        # After: code is compliant if all compliance tests passed
        code_is_compliant = compliance_stats.get("failed", 1) == 0 and compliance_stats.get("passed", 0) > 0
    
    # Overall: code must be compliant AND smoke tests must pass
    all_passed = code_is_compliant and smoke["passed"]
    
    # Combine outputs
    combined_output = f"=== Compliance Tests ===\n{compliance['output']}\n\n=== Smoke Tests ===\n{smoke['output']}"
    
    return {
        "tests": {
            "passed": all_passed,
            "return_code": 0 if all_passed else 1,
            "output": combined_output[:8000]
        },
        "metrics": {}
    }


def run_evaluation():
    """
    Run the complete evaluation comparing before and after.
    
    Returns:
        dict with complete evaluation report
    """
    run_id = str(uuid.uuid4())
    start = datetime.now(timezone.utc)
    
    try:
        # Evaluate both repositories
        before = evaluate("repository_before")
        after = evaluate("repository_after")
        
        # Compare results
        # Success: after must pass all tests
        passed_gate = after["tests"]["passed"]
        
        # Generate improvement summary
        if passed_gate:
            improvement_summary = "After implementation passed all compliance and smoke tests (TypeScript refactoring compliant)"
        else:
            improvement_summary = "After implementation did not pass all tests"
        
        comparison = {
            "passed_gate": passed_gate,
            "improvement_summary": improvement_summary
        }
        
        error = None
        
    except Exception as e:
        # Handle evaluation errors
        before = {"tests": {"passed": False, "return_code": -1, "output": ""}, "metrics": {}}
        after = {"tests": {"passed": False, "return_code": -1, "output": ""}, "metrics": {}}
        comparison = {
            "passed_gate": False,
            "improvement_summary": "Evaluation error occurred"
        }
        error = str(e)
    
    end = datetime.now(timezone.utc)
    
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
    """Main entry point for evaluation."""
    # Create reports directory with date/time structure
    now = datetime.now(timezone.utc)
    date_dir = now.strftime("%Y-%m-%d")
    time_dir = now.strftime("%H-%M-%S")
    report_dir = REPORTS / date_dir / time_dir
    report_dir.mkdir(parents=True, exist_ok=True)
    
    # Run evaluation
    report = run_evaluation()
    
    # Write report to date/time structure
    report_path = report_dir / "report.json"
    report_path.write_text(json.dumps(report, indent=2))
    
    print(f"Report written to {report_path}")
    
    if report.get("comparison"):
        print(f"\nEvaluation Summary:")
        print(f"  Run ID: {report['run_id']}")
        print(f"  Success: {report['success']}")
        print(f"  {report['comparison']['improvement_summary']}")
    
    if report.get("error"):
        print(f"  Error: {report['error']}")
    
    # Return appropriate exit code
    return 0 if report["success"] else 1


if __name__ == "__main__":
    import os
    sys.exit(main())
