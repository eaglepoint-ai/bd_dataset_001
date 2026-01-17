#!/usr/bin/env python3
"""
Evaluation runner for Square Split Line Problem.

This evaluation script:
- Runs pytest tests on the tests/ folder for both before and after implementations
- Collects individual test results with pass/fail status
- Generates structured reports with environment metadata

Run with:
    docker-compose run --rm evaluate
"""
import os
import sys
import json
import uuid
import platform
import subprocess
import socket
import re
from datetime import datetime
from pathlib import Path


# Constants for paths
ROOT = Path(__file__).resolve().parent.parent
REPORTS = ROOT / "evaluation" / "reports"


def environment_info():
    """
    Collect environment information for the report.
    
    Extended format with OS details and git info.
    """
    try:
        hostname = socket.gethostname()
    except Exception:
        hostname = "unknown"
    
    try:
        git_commit = subprocess.run(
            ["git", "rev-parse", "--short", "HEAD"],
            cwd=ROOT,
            capture_output=True,
            text=True,
            timeout=5
        ).stdout.strip() or "unknown"
    except Exception:
        git_commit = "unknown"
    
    try:
        git_branch = subprocess.run(
            ["git", "rev-parse", "--abbrev-ref", "HEAD"],
            cwd=ROOT,
            capture_output=True,
            text=True,
            timeout=5
        ).stdout.strip() or "unknown"
    except Exception:
        git_branch = "unknown"
    
    uname = platform.uname()
    
    return {
        "python_version": platform.python_version(),
        "platform": platform.platform(),
        "os": uname.system,
        "os_release": uname.release,
        "architecture": uname.machine,
        "hostname": hostname,
        "git_commit": git_commit,
        "git_branch": git_branch
    }


def parse_pytest_output(output: str) -> tuple:
    """
    Parse pytest output to extract individual test results.
    
    Returns:
        (tests_list, summary_dict)
    """
    tests = []
    summary = {
        "total": 0,
        "passed": 0,
        "failed": 0,
        "errors": 0,
        "skipped": 0
    }
    
    lines = output.split('\n')
    
    # Pattern to match test lines
    test_pattern = r'(tests/[\w/]+\.py::[\w:]+::?(\w+))\s+(PASSED|FAILED|ERROR|SKIPPED)'
    
    for line in lines:
        match = re.search(test_pattern, line)
        if match:
            nodeid = match.group(1)
            test_name = match.group(2)
            outcome = match.group(3).lower()
            
            tests.append({
                "nodeid": nodeid,
                "name": test_name,
                "outcome": outcome
            })
            
            if outcome == "passed":
                summary["passed"] += 1
            elif outcome == "failed":
                summary["failed"] += 1
            elif outcome == "error":
                summary["errors"] += 1
            elif outcome == "skipped":
                summary["skipped"] += 1
    
    # Extract summary from final line
    summary_line = None
    for line in reversed(lines):
        if "passed" in line.lower() or "failed" in line.lower():
            summary_line = line
            break
    
    if summary_line:
        passed_match = re.search(r'(\d+)\s+passed', summary_line.lower())
        failed_match = re.search(r'(\d+)\s+failed', summary_line.lower())
        error_match = re.search(r'(\d+)\s+error', summary_line.lower())
        skipped_match = re.search(r'(\d+)\s+skipped', summary_line.lower())
        
        if passed_match:
            summary["passed"] = int(passed_match.group(1))
        if failed_match:
            summary["failed"] = int(failed_match.group(1))
        if error_match:
            summary["errors"] = int(error_match.group(1))
        if skipped_match:
            summary["skipped"] = int(skipped_match.group(1))
        
        summary["total"] = summary["passed"] + summary["failed"] + summary["errors"] + summary["skipped"]
    else:
        summary["total"] = len(tests)
    
    return tests, summary


def run_tests(repo_name: str):
    """
    Run pytest on the specified repository.
    
    Args:
        repo_name: "repository_before" or "repository_after"
    
    Returns:
        dict with test results
    """
    repo_path = ROOT / repo_name
    tests_dir = ROOT / "tests"
    
    print(f"\n{'=' * 60}")
    print(f"RUNNING TESTS: {repo_name.upper()}")
    print(f"{'=' * 60}")
    print(f"Repository: {repo_path}")
    print(f"Tests: {tests_dir}")
    
    env = os.environ.copy()
    env["PYTHONPATH"] = str(repo_path)
    
    try:
        result = subprocess.run(
            [sys.executable, "-m", "pytest", str(tests_dir), "-v", "--tb=short"],
            capture_output=True,
            text=True,
            cwd=str(ROOT),
            env=env,
            timeout=120
        )
        
        # Parse pytest output
        full_output = result.stdout + result.stderr
        tests_list, summary_dict = parse_pytest_output(full_output)
        
        success = result.returncode == 0
        
        if success:
            print(f"[PASS] Tests PASSED ({summary_dict['passed']}/{summary_dict['total']})")
        else:
            print(f"[FAIL] Tests FAILED ({summary_dict['passed']}/{summary_dict['total']})")
        
        return {
            "success": success,
            "exit_code": result.returncode,
            "tests": tests_list,
            "summary": summary_dict,
            "stdout": full_output[:8000],
            "stderr": ""
        }
        
    except subprocess.TimeoutExpired:
        print("[TIMEOUT] Test execution timed out")
        return {
            "success": False,
            "exit_code": -1,
            "tests": [],
            "summary": {"total": 0, "passed": 0, "failed": 0, "errors": 0, "skipped": 0},
            "stdout": "pytest timeout after 120 seconds",
            "stderr": ""
        }
    except Exception as e:
        print(f"[ERROR] Error running tests: {e}")
        return {
            "success": False,
            "exit_code": -1,
            "tests": [],
            "summary": {"total": 0, "passed": 0, "failed": 0, "errors": 0, "skipped": 0},
            "stdout": f"Error running tests: {str(e)}",
            "stderr": ""
        }


def evaluate(repo_name: str):
    """
    Evaluate a single repository.
    
    Args:
        repo_name: "repository_before" or "repository_after"
    
    Returns:
        dict with test results
    """
    return run_tests(repo_name)


def run_evaluation():
    """
    Run complete evaluation for both implementations.
    
    Returns:
        dict with evaluation results
    """
    print(f"\n{'=' * 60}")
    print("SQUARE SPLIT LINE EVALUATION")
    print(f"{'=' * 60}")
    
    # Evaluate both repositories
    before = evaluate("repository_before")
    after = evaluate("repository_after")
    
    # Build comparison
    comparison = {
        "before_tests_passed": before["success"],
        "after_tests_passed": after["success"],
        "before_total": before["summary"]["total"],
        "before_passed": before["summary"]["passed"],
        "before_failed": before["summary"]["failed"],
        "after_total": after["summary"]["total"],
        "after_passed": after["summary"]["passed"],
        "after_failed": after["summary"]["failed"]
    }
    
    return {
        "before": before,
        "after": after,
        "comparison": comparison
    }


def main():
    """
    Main entry point for evaluation.
    
    Returns:
        int: 0 for success, 1 for failure
    """
    # Ensure reports directory exists
    REPORTS.mkdir(parents=True, exist_ok=True)
    
    # Generate run ID (short format like "15fd1300")
    run_id = str(uuid.uuid4())[:8]
    
    # Use UTC timestamps
    start = datetime.utcnow()
    
    print(f"Run ID: {run_id}")
    print(f"Started at: {start.isoformat()}")
    
    evaluation_results = None
    success = False
    error_message = None
    
    try:
        # Run evaluation
        evaluation_results = run_evaluation()
        
        # Success is determined by after.tests.success
        success = evaluation_results["after"]["success"]
        error_message = None if success else "Some tests failed or evaluation incomplete"
        
    except Exception as e:
        import traceback
        print(f"\n[ERROR] Evaluation failed: {str(e)}")
        traceback.print_exc()
        success = False
        error_message = str(e)
        # Create minimal results structure
        evaluation_results = {
            "before": {
                "success": False,
                "exit_code": -1,
                "tests": [],
                "summary": {"total": 0, "passed": 0, "failed": 0, "errors": 0, "skipped": 0},
                "stdout": "",
                "stderr": ""
            },
            "after": {
                "success": False,
                "exit_code": -1,
                "tests": [],
                "summary": {"total": 0, "passed": 0, "failed": 0, "errors": 0, "skipped": 0},
                "stdout": "",
                "stderr": ""
            },
            "comparison": {
                "before_tests_passed": False,
                "after_tests_passed": False,
                "before_total": 0,
                "before_passed": 0,
                "before_failed": 0,
                "after_total": 0,
                "after_passed": 0,
                "after_failed": 0
            }
        }
    
    end = datetime.utcnow()
    duration = (end - start).total_seconds()
    
    # Build report in standard format
    report = {
        "run_id": run_id,
        "started_at": start.strftime("%Y-%m-%dT%H:%M:%S.%f"),
        "finished_at": end.strftime("%Y-%m-%dT%H:%M:%S.%f"),
        "duration_seconds": round(duration, 6),
        "success": success,
        "error": error_message,
        "environment": environment_info(),
        "results": evaluation_results
    }
    
    # Write report to FIXED location (required by internal tool)
    output_path = REPORTS / "report.json"
    output_path.write_text(json.dumps(report, indent=2))
    print(f"\n[SUCCESS] Report written to {output_path}")
    
    # Print summary
    print(f"\n{'=' * 60}")
    print("EVALUATION SUMMARY")
    print(f"{'=' * 60}")
    
    if evaluation_results:
        before = evaluation_results["before"]
        after = evaluation_results["after"]
        comp = evaluation_results["comparison"]
        
        print(f"Before Tests: {'PASSED' if before['success'] else 'FAILED'} ({comp['before_passed']}/{comp['before_total']})")
        print(f"After Tests:  {'PASSED' if after['success'] else 'FAILED'} ({comp['after_passed']}/{comp['after_total']})")
    
    print(f"\nSuccess: {'YES' if success else 'NO'}")
    print(f"Duration: {duration:.2f}s")
    print("=" * 60)
    
    # Return exit code
    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())
