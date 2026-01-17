#!/usr/bin/env python3
"""
Evaluation runner for React Form Generator.
Runs tests on both repository_before and repository_after.
Compatible with pytest-style report format.
"""
import os
import sys
import json
import uuid
import platform
import subprocess
import re
import socket
import time
from pathlib import Path
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parent.parent
REPORTS = ROOT / "evaluation" / "reports"


def environment_info():
    """Collect environment information."""
    return {
        "python_version": platform.python_version(),
        "platform": platform.platform(),
        "os": platform.system(),
        "os_release": platform.release(),
        "architecture": platform.machine(),
        "hostname": socket.gethostname(),
        "git_commit": "unknown",
        "git_branch": "unknown"
    }


def parse_jest_output(output):
    """Parse Jest test output to extract individual test results (pytest-style)."""
    tests = []
    
    # Extract test file results: PASS __tests__/file.test.ts or FAIL __tests__/file.test.ts
    test_pattern = r'(PASS|FAIL)\s+([^\s\n]+)'
    matches = re.findall(test_pattern, output)
    
    for status, test_file in matches:
        # Extract test name from file path
        test_name = test_file.replace('__tests__/', '').replace('.test.ts', '').replace('.test.tsx', '')
        outcome = "passed" if status == "PASS" else "failed"
        
        # Create pytest-style nodeid
        nodeid = test_file.replace('__tests__/', 'tests/').replace('.test.ts', '.py').replace('.test.tsx', '.py')
        # For Jest, we create a single test per test file
        nodeid = f"{nodeid}::test_{test_name}"
        
        tests.append({
            "nodeid": nodeid,
            "name": test_name,
            "outcome": outcome
        })
    
    # Extract summary from Jest output
    summary = {"total": 0, "passed": 0, "failed": 0, "errors": 0, "skipped": 0}
    
    # Pattern: "Tests: X passed, Y total"
    test_match = re.search(r'Tests:\s+(\d+)\s+passed(?:,\s+(\d+)\s+total)?', output)
    if test_match:
        summary["passed"] = int(test_match.group(1))
        if test_match.group(2):
            summary["total"] = int(test_match.group(2))
        else:
            summary["total"] = summary["passed"]
    
    # Count failed tests
    summary["failed"] = len([t for t in tests if t["outcome"] == "failed"])
    if summary["total"] == 0 and tests:
        summary["total"] = len(tests)
    
    return tests, summary


def run_tests_before():
    """Test repository_before - verify files exist."""
    repo_path = ROOT / "repository_before"
    
    if not repo_path.exists():
        return {
            "success": False,
            "exit_code": 1,
            "tests": [],
            "summary": {"total": 0, "passed": 0, "failed": 0, "errors": 0, "skipped": 0},
            "stdout": "",
            "stderr": "repository_before directory not found"
        }
    
    required_files = [
        "Resources/html/form.html",
        "Resources/html/formdisplay.html",
        "Resources/js/formgenerator.js",
        "Resources/js/formdisplay.js"
    ]
    
    tests = []
    for file_path in required_files:
        exists = (repo_path / file_path).exists()
        test_name = f"check_{file_path.replace('/', '_').replace('.', '_')}"
        tests.append({
            "nodeid": f"tests/test_before.py::{test_name}",
            "name": test_name,
            "outcome": "passed" if exists else "failed"
        })
    
    passed_count = sum(1 for t in tests if t["outcome"] == "passed")
    
    return {
        "success": passed_count == len(required_files),
        "exit_code": 0 if passed_count == len(required_files) else 1,
        "tests": tests,
        "summary": {
            "total": len(required_files),
            "passed": passed_count,
            "failed": len(required_files) - passed_count,
            "errors": 0,
            "skipped": 0
        },
        "stdout": f"{passed_count}/{len(required_files)} required files present in repository_before",
        "stderr": ""
    }


def run_tests_after():
    """Test repository_after - Next.js app tests."""
    repo_path = ROOT / "repository_after"
    
    if not repo_path.exists():
        return {
            "success": False,
            "exit_code": 1,
            "tests": [],
            "summary": {"total": 0, "passed": 0, "failed": 0, "errors": 0, "skipped": 0},
            "stdout": "",
            "stderr": "repository_after directory not found"
        }
    
    if not (repo_path / "package.json").exists():
        return {
            "success": False,
            "exit_code": 1,
            "tests": [],
            "summary": {"total": 0, "passed": 0, "failed": 0, "errors": 0, "skipped": 0},
            "stdout": "",
            "stderr": "package.json not found in repository_after"
        }
    
    try:
        # Type check
        type_check = subprocess.run(
            ["npm", "run", "type-check"],
            cwd=repo_path,
            capture_output=True,
            text=True,
            timeout=60
        )
        
        if type_check.returncode != 0:
            stdout = type_check.stdout[:8000] if type_check.stdout else ""
            stderr = type_check.stderr[:8000] if type_check.stderr else ""
            return {
                "success": False,
                "exit_code": type_check.returncode,
                "tests": [],
                "summary": {"total": 0, "passed": 0, "failed": 0, "errors": 1, "skipped": 0},
                "stdout": stdout,
                "stderr": stderr
            }
        
        # Run Jest tests
        env = os.environ.copy()
        env["CI"] = "true"
        test_result = subprocess.run(
            ["npm", "test", "--", "--passWithNoTests", "--ci"],
            cwd=repo_path,
            capture_output=True,
            text=True,
            timeout=120,
            env=env
        )
        
        stdout = test_result.stdout[:8000] if test_result.stdout else ""
        stderr = test_result.stderr[:8000] if test_result.stderr else ""
        full_output = stdout + stderr
        
        # Parse Jest output to extract test results
        tests, summary = parse_jest_output(full_output)
        
        # If no tests parsed but tests passed, create summary from output
        if not tests and test_result.returncode == 0:
            # Try to extract test count
            test_match = re.search(r'Tests:\s+(\d+)\s+passed', full_output)
            if test_match:
                passed_count = int(test_match.group(1))
                summary = {
                    "total": passed_count,
                    "passed": passed_count,
                    "failed": 0,
                    "errors": 0,
                    "skipped": 0
                }
                # Create a generic test entry
                tests = [{
                    "nodeid": "tests/test_after.py::test_all_tests",
                    "name": "test_all_tests",
                    "outcome": "passed"
                }]
        
        return {
            "success": test_result.returncode == 0,
            "exit_code": test_result.returncode,
            "tests": tests,
            "summary": summary,
            "stdout": stdout,
            "stderr": stderr
        }
        
    except subprocess.TimeoutExpired:
        return {
            "success": False,
            "exit_code": -1,
            "tests": [],
            "summary": {"total": 0, "passed": 0, "failed": 0, "errors": 1, "skipped": 0},
            "stdout": "",
            "stderr": "Test execution timeout"
        }
    except Exception as e:
        return {
            "success": False,
            "exit_code": -1,
            "tests": [],
            "summary": {"total": 0, "passed": 0, "failed": 0, "errors": 1, "skipped": 0},
            "stdout": "",
            "stderr": f"Error running tests: {str(e)}"
        }


def run_metrics(repo_path: Path):
    """Collect optional metrics."""
    metrics = {}
    
    if not repo_path.exists():
        return metrics
    
    try:
        if (repo_path / "package.json").exists():
            package_json = json.loads((repo_path / "package.json").read_text())
            metrics["dependencies_count"] = len(package_json.get("dependencies", {}))
            metrics["dev_dependencies_count"] = len(package_json.get("devDependencies", {}))
        
        ts_files = list(repo_path.rglob("*.ts"))
        tsx_files = list(repo_path.rglob("*.tsx"))
        metrics["typescript_files"] = len(ts_files) + len(tsx_files)
        
        test_files = list((repo_path / "__tests__").rglob("*.test.ts")) if (repo_path / "__tests__").exists() else []
        metrics["test_files"] = len(test_files)
        
    except Exception:
        pass
    
    return metrics


def evaluate(repo_name: str):
    """Evaluate a repository."""
    repo_path = ROOT / repo_name
    
    if repo_name == "repository_before":
        test_results = run_tests_before()
    else:
        test_results = run_tests_after()
    
    metrics = run_metrics(repo_path)
    
    return {
        "tests": test_results,
        "metrics": metrics
    }


def run_evaluation():
    """Run the complete evaluation and return report dict."""
    run_id = str(uuid.uuid4())[:8]
    start = datetime.now(timezone.utc)
    
    try:
        # Run tests
        before_eval = evaluate("repository_before")
        after_eval = evaluate("repository_after")
        
        before_tests = before_eval["tests"]
        after_tests = after_eval["tests"]
        
        before_passed = before_tests["success"]
        after_passed = after_tests["success"]
        
        # Build comparison
        comparison = {
            "before_tests_passed": before_passed,
            "after_tests_passed": after_passed,
            "before_total": before_tests.get("summary", {}).get("total", 0),
            "before_passed": before_tests.get("summary", {}).get("passed", 0),
            "before_failed": before_tests.get("summary", {}).get("failed", 0),
            "after_total": after_tests.get("summary", {}).get("total", 0),
            "after_passed": after_tests.get("summary", {}).get("passed", 0),
            "after_failed": after_tests.get("summary", {}).get("failed", 0)
        }
        
        # Success rule: after tests must pass
        success = after_passed
        
        end = datetime.now(timezone.utc)
        
        # Build report matching the sample format
        report = {
            "run_id": run_id,
            "started_at": start.isoformat(),
            "finished_at": end.isoformat(),
            "duration_seconds": (end - start).total_seconds(),
            "success": success,
            "error": None,
            "environment": environment_info(),
            "results": {
                "before": before_tests,
                "after": after_tests,
                "comparison": comparison
            }
        }
        
        return report
        
    except Exception as e:
        end = datetime.now(timezone.utc)
        import traceback
        traceback.print_exc()
        
        error_result = {
            "success": False,
            "exit_code": -1,
            "tests": [],
            "summary": {"total": 0, "passed": 0, "failed": 0, "errors": 1, "skipped": 0},
            "stdout": "",
            "stderr": str(e)
        }
        
        return {
            "run_id": run_id,
            "started_at": start.isoformat(),
            "finished_at": end.isoformat(),
            "duration_seconds": (end - start).total_seconds(),
            "success": False,
            "error": str(e),
            "environment": environment_info(),
            "results": {
                "before": error_result,
                "after": error_result,
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
        }


def main():
    """Main entry point."""
    REPORTS.mkdir(parents=True, exist_ok=True)
    
    try:
        report = run_evaluation()
        latest_path = REPORTS / "latest.json"
        report_path = REPORTS / "report.json"
        
        report_json = json.dumps(report, indent=2)
        latest_path.write_text(report_json)
        report_path.write_text(report_json)
        
        print(f"Report written to {latest_path}")
        print(f"Report written to {report_path}")
        return 0 if report["success"] else 1
    except Exception as e:
        print(f"Fatal error: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())
