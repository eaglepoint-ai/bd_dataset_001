#!/usr/bin/env python3
"""
Standard Evaluation Script for Square Split Line Problem
=========================================================

This evaluator follows the canonical evaluation standard:
- Runs tests on both repository_before and repository_after
- Parses pytest output to extract individual test results
- Generates timestamped report.json in YYYY-MM-DD/HH-MM-SS format
- Exits with correct status code

Success Rule: after.tests.success == true
"""

import sys
import json
import time
import uuid
import platform
import subprocess
import socket
import re
from pathlib import Path
from datetime import datetime

ROOT = Path(__file__).resolve().parent.parent
REPORTS_BASE = ROOT / "evaluation"


def get_git_info():
    """Get git commit and branch info"""
    try:
        commit = subprocess.run(
            ["git", "rev-parse", "--short", "HEAD"],
            cwd=ROOT,
            capture_output=True,
            text=True,
            timeout=5
        ).stdout.strip() or "unknown"
        
        branch = subprocess.run(
            ["git", "rev-parse", "--abbrev-ref", "HEAD"],
            cwd=ROOT,
            capture_output=True,
            text=True,
            timeout=5
        ).stdout.strip() or "unknown"
        
        return commit, branch
    except Exception:
        return "unknown", "unknown"


def environment_info():
    """Collect environment metadata with extended fields"""
    git_commit, git_branch = get_git_info()
    
    platform_info = platform.platform()
    uname = platform.uname()
    
    # Parse OS info
    os_name = uname.system
    os_release = uname.release
    architecture = uname.machine
    hostname = socket.gethostname()
    
    return {
        "python_version": platform.python_version(),
        "platform": platform_info,
        "os": os_name,
        "os_release": os_release,
        "architecture": architecture,
        "hostname": hostname,
        "git_commit": git_commit,
        "git_branch": git_branch
    }


def parse_pytest_output(output: str) -> tuple:
    """
    Parse pytest output to extract individual test results.
    
    Returns:
        (tests_list, summary_dict, stdout_text)
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
    
    # Pattern to match test lines like:
    # "tests/test_solution.py::TestBasicCases::test_single_square PASSED        [  5%]"
    # "tests/test_solution.py::test_import_successful PASSED                    [100%]"
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
    
    # Extract summary from final line like "17 passed in 0.21s" or "3 failed, 17 passed in 0.70s"
    summary_line = None
    for line in reversed(lines):
        if "passed" in line.lower() or "failed" in line.lower():
            summary_line = line
            break
    
    if summary_line:
        # Match patterns like "17 passed", "3 failed, 17 passed"
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
        
        # Calculate total
        summary["total"] = summary["passed"] + summary["failed"] + summary["errors"] + summary["skipped"]
    else:
        # Fallback: use counts from parsed tests
        summary["total"] = len(tests)
    
    return tests, summary, output


def run_tests(repo_name: str):
    """
    Run pytest on the specified repository.
    
    Returns dict with test results following the exact format.
    """
    repo_path = ROOT / repo_name
    
    try:
        # Temporarily add repo to Python path for tests
        env = {
            **subprocess.os.environ,
            "PYTHONPATH": str(repo_path)
        }
        
        proc = subprocess.run(
            ["pytest", "tests", "-v", "--tb=short"],
            cwd=ROOT,
            capture_output=True,
            text=True,
            timeout=120,
            env=env
        )
        
        # Parse pytest output
        tests_list, summary_dict, stdout_text = parse_pytest_output(proc.stdout + proc.stderr)
        
        return {
            "success": proc.returncode == 0,
            "exit_code": proc.returncode,
            "tests": tests_list,
            "summary": summary_dict,
            "stdout": stdout_text[:8000],  # Truncate for report
            "stderr": ""
        }
    except subprocess.TimeoutExpired:
        return {
            "success": False,
            "exit_code": -1,
            "tests": [],
            "summary": {"total": 0, "passed": 0, "failed": 0, "errors": 0, "skipped": 0},
            "stdout": "pytest timeout after 120 seconds",
            "stderr": ""
        }
    except Exception as e:
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
    
    Returns dict with test results.
    """
    return run_tests(repo_name)


def run_evaluation():
    """
    Main evaluation function.
    
    Returns complete report dict following the exact format.
    """
    run_id = str(uuid.uuid4())[:8]  # Short run_id like "15fd1300"
    start = datetime.now()
    
    try:
        # Evaluate both repositories
        before = evaluate("repository_before")
        after = evaluate("repository_after")
        
        # Determine overall success
        success = after["success"]
        
        # Create comparison
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
        
        end = datetime.now()
        
        return {
            "run_id": run_id,
            "started_at": start.strftime("%Y-%m-%dT%H:%M:%S.%f"),
            "finished_at": end.strftime("%Y-%m-%dT%H:%M:%S.%f"),
            "duration_seconds": (end - start).total_seconds(),
            "success": success,
            "error": None if success else "Some tests failed or evaluation incomplete",
            "environment": environment_info(),
            "results": {
                "before": before,
                "after": after,
                "comparison": comparison
            }
        }
        
    except Exception as e:
        end = datetime.now()
        return {
            "run_id": run_id,
            "started_at": start.strftime("%Y-%m-%dT%H:%M:%S.%f"),
            "finished_at": end.strftime("%Y-%m-%dT%H:%M:%S.%f"),
            "duration_seconds": (end - start).total_seconds(),
            "success": False,
            "error": str(e),
            "environment": environment_info(),
            "results": None
        }


def main():
    """
    Main entry point.
    
    Writes timestamped report and returns exit code.
    """
    # Create timestamped directory structure: YYYY-MM-DD/HH-MM-SS
    now = datetime.now()
    date_dir = now.strftime("%Y-%m-%d")
    time_dir = now.strftime("%H-%M-%S")
    
    report_dir = REPORTS_BASE / date_dir / time_dir
    report_dir.mkdir(parents=True, exist_ok=True)
    
    print("=" * 60)
    print("Starting Evaluation: Square Split Line Problem")
    print("=" * 60)
    
    report = run_evaluation()
    
    # Write report to timestamped location
    report_path = report_dir / "report.json"
    report_path.write_text(json.dumps(report, indent=2))
    
    # Also write to latest.json for convenience
    latest_path = REPORTS_BASE / "reports" / "latest.json"
    latest_path.parent.mkdir(parents=True, exist_ok=True)
    latest_path.write_text(json.dumps(report, indent=2))
    
    print(f"\n{'=' * 60}")
    print(f"Report written to {report_path}")
    print(f"Latest report: {latest_path}")
    print(f"{'=' * 60}\n")
    
    # Print summary
    print("EVALUATION SUMMARY")
    print("-" * 60)
    print(f"Success: {report['success']}")
    
    if report.get("results"):
        before = report["results"]["before"]
        after = report["results"]["after"]
        comp = report["results"]["comparison"]
        
        print(f"Before Tests: {'PASSED' if before['success'] else 'FAILED'} ({comp['before_passed']}/{comp['before_total']})")
        print(f"After Tests:  {'PASSED' if after['success'] else 'FAILED'} ({comp['after_passed']}/{comp['after_total']})")
    
    print("=" * 60)
    
    return 0 if report["success"] else 1


if __name__ == "__main__":
    sys.exit(main())
