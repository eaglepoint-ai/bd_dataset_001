#!/usr/bin/env python3
"""
Evaluation runner for Square Split Line Problem.
Runs pytest on both repository_before and repository_after.
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

ROOT = Path(__file__).resolve().parent.parent
REPORTS = ROOT / "evaluation" / "reports"


def environment_info():
    """Collect environment information."""
    try:
        hostname = socket.gethostname()
    except Exception:
        hostname = "unknown"
    
    try:
        git_commit = subprocess.run(
            ["git", "rev-parse", "--short", "HEAD"],
            cwd=ROOT, capture_output=True, text=True, timeout=5
        ).stdout.strip() or "unknown"
    except Exception:
        git_commit = "unknown"
    
    try:
        git_branch = subprocess.run(
            ["git", "rev-parse", "--abbrev-ref", "HEAD"],
            cwd=ROOT, capture_output=True, text=True, timeout=5
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


def parse_pytest_output(output):
    """Parse pytest output to extract test results."""
    tests = []
    summary = {"total": 0, "passed": 0, "failed": 0, "errors": 0, "skipped": 0}
    
    test_pattern = r'(tests/[\w/]+\.py::[\w:]+::?(\w+))\s+(PASSED|FAILED|ERROR|SKIPPED)'
    for match in re.finditer(test_pattern, output):
        nodeid, name, outcome = match.group(1), match.group(2), match.group(3).lower()
        tests.append({"nodeid": nodeid, "name": name, "outcome": outcome})
        summary[outcome if outcome != "error" else "errors"] = summary.get(outcome, 0) + 1
    
    # Get counts from summary line
    for pattern, key in [(r'(\d+)\s+passed', 'passed'), (r'(\d+)\s+failed', 'failed')]:
        match = re.search(pattern, output.lower())
        if match:
            summary[key] = int(match.group(1))
    
    summary["total"] = summary["passed"] + summary["failed"] + summary["errors"] + summary["skipped"]
    return tests, summary


def run_tests(repo_name):
    """Run pytest for a repository."""
    repo_path = ROOT / repo_name
    env = os.environ.copy()
    env["PYTHONPATH"] = str(repo_path)
    
    try:
        result = subprocess.run(
            [sys.executable, "-m", "pytest", str(ROOT / "tests"), "-v", "--tb=short"],
            capture_output=True, text=True, cwd=str(ROOT), env=env, timeout=120
        )
        output = result.stdout + result.stderr
        tests, summary = parse_pytest_output(output)
        return {
            "success": result.returncode == 0,
            "exit_code": result.returncode,
            "tests": tests,
            "summary": summary,
            "stdout": output[:8000],
            "stderr": ""
        }
    except Exception as e:
        return {
            "success": False,
            "exit_code": -1,
            "tests": [],
            "summary": {"total": 0, "passed": 0, "failed": 0, "errors": 0, "skipped": 0},
            "stdout": str(e),
            "stderr": ""
        }


def main():
    """Main entry point."""
    REPORTS.mkdir(parents=True, exist_ok=True)
    
    run_id = str(uuid.uuid4())[:8]
    start = datetime.utcnow()
    
    print(f"Run ID: {run_id}")
    print(f"Started: {start.isoformat()}")
    
    # Run tests
    print("\n[BEFORE] Running tests on repository_before...")
    before = run_tests("repository_before")
    print(f"[BEFORE] Result: {'PASS' if before['success'] else 'FAIL'}")
    
    print("\n[AFTER] Running tests on repository_after...")
    after = run_tests("repository_after")
    print(f"[AFTER] Result: {'PASS' if after['success'] else 'FAIL'}")
    
    end = datetime.utcnow()
    success = after["success"]
    
    # Build report
    report = {
        "run_id": run_id,
        "started_at": start.strftime("%Y-%m-%dT%H:%M:%S.%f"),
        "finished_at": end.strftime("%Y-%m-%dT%H:%M:%S.%f"),
        "duration_seconds": round((end - start).total_seconds(), 6),
        "success": success,
        "error": None if success else "Tests failed",
        "environment": environment_info(),
        "results": {
            "before": before,
            "after": after,
            "comparison": {
                "before_tests_passed": before["success"],
                "after_tests_passed": after["success"],
                "before_total": before["summary"]["total"],
                "before_passed": before["summary"]["passed"],
                "before_failed": before["summary"]["failed"],
                "after_total": after["summary"]["total"],
                "after_passed": after["summary"]["passed"],
                "after_failed": after["summary"]["failed"]
            }
        }
    }
    
    # Write report
    report_path = REPORTS / "report.json"
    report_path.write_text(json.dumps(report, indent=2))
    print(f"\n[DONE] Report: {report_path}")
    print(f"[DONE] Success: {success}")
    
    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())
