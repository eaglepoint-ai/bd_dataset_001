#!/usr/bin/env python3
"""
MoodMorph Evaluation Script
Compares repository_before (not implemented) vs repository_after (complete solution)
Follows evaluation standard from PDF

Success criteria: repository_after tests pass
"""

import sys
import json
import uuid
import platform
import subprocess
import socket
import re
import os
import tempfile
from pathlib import Path
from datetime import datetime

ROOT = Path(__file__).resolve().parent.parent
REPORTS = ROOT / "evaluation" / "reports"


def environment_info():
    """Collect environment metadata"""
    try:
        git_commit = subprocess.run(
            ["git", "rev-parse", "HEAD"],
            capture_output=True,
            text=True,
            timeout=5,
            cwd=ROOT
        ).stdout.strip()[:8] if subprocess.run(["git", "rev-parse", "--git-dir"], capture_output=True, cwd=ROOT).returncode == 0 else "unknown"
    except Exception:
        git_commit = "unknown"
    
    try:
        git_branch = subprocess.run(
            ["git", "rev-parse", "--abbrev-ref", "HEAD"],
            capture_output=True,
            text=True,
            timeout=5,
            cwd=ROOT
        ).stdout.strip() if subprocess.run(["git", "rev-parse", "--git-dir"], capture_output=True, cwd=ROOT).returncode == 0 else "unknown"
    except Exception:
        git_branch = "unknown"
    
    platform_info = platform.platform().split('-')
    os_name = platform.system()
    os_release = platform.release() if len(platform_info) > 1 else "unknown"
    
    return {
        "python_version": platform.python_version(),
        "platform": platform.platform(),
        "os": os_name,
        "os_release": os_release,
        "architecture": platform.machine(),
        "hostname": socket.gethostname(),
        "git_commit": git_commit,
        "git_branch": git_branch,
        "node_version": get_node_version(),
    }


def get_node_version():
    """Get Node.js version"""
    try:
        result = subprocess.run(
            ["node", "--version"],
            capture_output=True,
            text=True,
            timeout=5
        )
        return result.stdout.strip() if result.returncode == 0 else "unknown"
    except Exception:
        return "unknown"


def parse_jest_output(output: str):
    """
    Parse Jest test output to extract individual test results.
    Returns list of test objects and summary.
    """
    tests = []
    lines = output.split('\n')
    
    # Pattern to match test results: PASS src/path/to/file.test.ts
    # or FAIL src/path/to/file.test.ts
    test_pattern = re.compile(r'^(PASS|FAIL)\s+(.+)$')
    
    # Also look for test descriptions in the output
    test_desc_pattern = re.compile(r'\s+✓\s+(.+?)\s*$')  # Jest checkmark format
    test_fail_pattern = re.compile(r'\s+✕\s+(.+?)\s*$')  # Jest X format
    
    current_file = None
    for line in lines:
        line_stripped = line.strip()
        if not line_stripped:
            continue
        
        # Match PASS/FAIL lines for test files
        match = test_pattern.match(line_stripped)
        if match:
            outcome = match.group(1).lower()
            test_path = match.group(2)
            current_file = test_path
            
            # Extract test name from path - this is the file-level result
            test_file = Path(test_path).stem
            tests.append({
                "nodeid": test_path,
                "name": test_file,
                "outcome": "passed" if outcome == "pass" else "failed"
            })
        
        # Look for individual test cases within files
        desc_match = test_desc_pattern.match(line)
        if desc_match and current_file:
            test_name = desc_match.group(1).strip()
            tests.append({
                "nodeid": f"{current_file}::{test_name}",
                "name": test_name,
                "outcome": "passed"
            })
        
        fail_match = test_fail_pattern.match(line)
        if fail_match and current_file:
            test_name = fail_match.group(1).strip()
            tests.append({
                "nodeid": f"{current_file}::{test_name}",
                "name": test_name,
                "outcome": "failed"
            })
    
    # Extract summary from Jest output
    passed = 0
    failed = 0
    total = 0
    
    # Try to extract summary from Jest output
    # Format: "Tests:       66 passed, 66 total"
    tests_match = re.search(r'Tests:\s+(\d+)\s+passed[,\s]+(\d+)\s+total', output)
    if tests_match:
        passed = int(tests_match.group(1))
        total = int(tests_match.group(2))
        failed = total - passed
    else:
        # Fallback: count from parsed tests
        passed = sum(1 for t in tests if t["outcome"] == "passed")
        failed = sum(1 for t in tests if t["outcome"] == "failed")
        total = len(tests)
    
    return {
        "tests": tests,
        "summary": {
            "total": total,
            "passed": passed,
            "failed": failed,
            "errors": 0,
            "skipped": 0
        }
    }


def run_tests(repo_name: str):
    """
    Run npm tests for given repository
    
    Args:
        repo_name: "repository_before" or "repository_after"
    
    Returns:
        dict with success, exit_code, tests, summary, stdout, stderr
    """
    repo_path = ROOT / repo_name
    
    if not repo_path.exists():
        return {
            "success": False,
            "exit_code": -1,
            "tests": [],
            "summary": {
                "total": 0,
                "passed": 0,
                "failed": 0,
                "errors": 0,
                "skipped": 0
            },
            "stdout": f"Repository {repo_name} not found",
            "stderr": ""
        }
    
    try:
        # Run tests with JSON output to a file, then read it
        with tempfile.NamedTemporaryFile(mode='w+', suffix='.json', delete=False) as tmp_file:
            json_file = tmp_file.name
        
        try:
            # Run Jest with JSON reporter (also capture stdout/stderr for full output)
            proc = subprocess.run(
                ["npx", "jest", "--passWithNoTests", "--json", "--outputFile", json_file],
                cwd=repo_path,
                capture_output=True,
                text=True,
                timeout=120,
                env={**os.environ, "CI": "true"}  # Set CI to reduce some warnings
            )
            
            stdout = proc.stdout
            stderr = proc.stderr
            
            # Try to read JSON output
            tests = []
            summary = {
                "total": 0,
                "passed": 0,
                "failed": 0,
                "errors": 0,
                "skipped": 0
            }
            
            try:
                if os.path.exists(json_file):
                    with open(json_file, 'r') as f:
                        jest_json = json.load(f)
                    
                    summary = {
                        "total": jest_json.get("numTotalTests", 0),
                        "passed": jest_json.get("numPassedTests", 0),
                        "failed": jest_json.get("numFailedTests", 0),
                        "errors": 0,
                        "skipped": jest_json.get("numPendingTests", 0)
                    }
                    
                    # Extract individual test results
                    for test_result in jest_json.get("testResults", []):
                        test_file = test_result.get("name", "")
                        for assertion in test_result.get("assertionResults", []):
                            full_name = assertion.get("fullName", assertion.get("title", "unknown"))
                            tests.append({
                                "nodeid": f"{test_file}::{full_name}",
                                "name": full_name,
                                "outcome": "passed" if assertion.get("status") == "passed" else "failed"
                            })
            except (json.JSONDecodeError, KeyError, FileNotFoundError):
                # Fall back to text parsing
                full_output = stdout + stderr
                parsed = parse_jest_output(full_output)
                tests = parsed["tests"]
                summary = parsed["summary"]
            finally:
                # Clean up temp file
                try:
                    os.unlink(json_file)
                except:
                    pass
        except Exception as e:
            # If npx jest doesn't work, fall back to npm test
            try:
                proc = subprocess.run(
                    ["npm", "test", "--", "--passWithNoTests"],
                    cwd=repo_path,
                    capture_output=True,
                    text=True,
                    timeout=120,
                    env={**os.environ, "CI": "true"}  # Set CI to reduce some warnings
                )
                stdout = proc.stdout
                stderr = proc.stderr
                full_output = stdout + stderr
                parsed = parse_jest_output(full_output)
                tests = parsed["tests"]
                summary = parsed["summary"]
            except Exception as fallback_error:
                # Last resort: return error info
                return {
                    "success": False,
                    "exit_code": -1,
                    "tests": [],
                    "summary": {
                        "total": 0,
                        "passed": 0,
                        "failed": 0,
                        "errors": 0,
                        "skipped": 0
                    },
                    "stdout": f"Error running tests: {str(e)}. Fallback also failed: {str(fallback_error)}",
                    "stderr": ""
                }
        
        return {
            "success": proc.returncode == 0,
            "exit_code": proc.returncode,
            "tests": tests,
            "summary": summary,
            "stdout": stdout[:10000],  # Limit size
            "stderr": stderr[:10000]
        }
        
    except subprocess.TimeoutExpired:
        return {
            "success": False,
            "exit_code": -1,
            "tests": [],
            "summary": {
                "total": 0,
                "passed": 0,
                "failed": 0,
                "errors": 0,
                "skipped": 0
            },
            "stdout": "Test execution timeout (120s exceeded)",
            "stderr": ""
        }
    except Exception as e:
        return {
            "success": False,
            "exit_code": -1,
            "tests": [],
            "summary": {
                "total": 0,
                "passed": 0,
                "failed": 0,
                "errors": 0,
                "skipped": 0
            },
            "stdout": "",
            "stderr": f"Error running tests: {str(e)}"
        }


def run_evaluation():
    """
    Main evaluation function
    Returns complete evaluation report dict matching the required format
    """
    run_id = str(uuid.uuid4())[:8]  # Short ID like in example
    start = datetime.utcnow()
    
    print("🔍 Evaluating repository_before...")
    before_result = run_tests("repository_before")
    
    print("🔍 Evaluating repository_after...")
    after_result = run_tests("repository_after")
    
    # Success criteria: after tests pass
    success = after_result["success"]
    
    # Build comparison
    comparison = {
        "before_tests_passed": before_result["success"],
        "after_tests_passed": after_result["success"],
        "before_total": before_result["summary"]["total"],
        "before_passed": before_result["summary"]["passed"],
        "before_failed": before_result["summary"]["failed"],
        "after_total": after_result["summary"]["total"],
        "after_passed": after_result["summary"]["passed"],
        "after_failed": after_result["summary"]["failed"]
    }
    
    end = datetime.utcnow()
    
    return {
        "run_id": run_id,
        "started_at": start.isoformat(),
        "finished_at": end.isoformat(),
        "duration_seconds": (end - start).total_seconds(),
        "success": success,
        "error": None if success else "Tests failed",
        "environment": environment_info(),
        "results": {
            "before": before_result,
            "after": after_result,
            "comparison": comparison
        }
    }


def main():
    """
    Main entry point
    Returns 0 if successful, 1 otherwise
    """
    try:
        print("=" * 60)
        print("MoodMorph Evaluation")
        print("=" * 60)
        
        REPORTS.mkdir(parents=True, exist_ok=True)
        
        report = run_evaluation()
        
        # Write report.json in root (for Aquila/evaluation systems)
        root_report = ROOT / "report.json"
        root_report.write_text(json.dumps(report, indent=2))
        
        # Write report.json in reports directory (evaluator expects it here)
        reports_report = REPORTS / "report.json"
        reports_report.write_text(json.dumps(report, indent=2))
        
        # Write latest.json in reports directory
        latest_path = REPORTS / "latest.json"
        latest_path.write_text(json.dumps(report, indent=2))
        
        # Also write timestamped version in format: evaluation/reports/YYYY-MM-DD/HH-MM-SS/report.json
        now = datetime.utcnow()
        date_str = now.strftime("%Y-%m-%d")
        time_str = now.strftime("%H-%M-%S")
        timestamped_dir = REPORTS / date_str / time_str
        timestamped_dir.mkdir(parents=True, exist_ok=True)
        timestamped_path = timestamped_dir / "report.json"
        timestamped_path.write_text(json.dumps(report, indent=2))
        
        print("\n" + "=" * 60)
        print("EVALUATION RESULTS")
        print("=" * 60)
        print(f"✅ Report written to: {root_report}")
        print(f"✅ Report written to: {reports_report}")
        print(f"✅ Report written to: {latest_path}")
        print(f"📊 Timestamped: {timestamped_path}")
        print(f"\nSuccess: {report['success']}")
        print("\nBefore:")
        print(f"  Tests Passed: {report['results']['before']['summary']['passed']}/{report['results']['before']['summary']['total']}")
        print(f"  Exit Code: {report['results']['before']['exit_code']}")
        print("\nAfter:")
        print(f"  Tests Passed: {report['results']['after']['summary']['passed']}/{report['results']['after']['summary']['total']}")
        print(f"  Exit Code: {report['results']['after']['exit_code']}")
        print("=" * 60)
        
        return 0 if report["success"] else 1
        
    except Exception as e:
        print(f"\n❌ EVALUATION ERROR: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        
        error_report = {
            "run_id": str(uuid.uuid4())[:8],
            "started_at": datetime.utcnow().isoformat(),
            "finished_at": datetime.utcnow().isoformat(),
            "duration_seconds": 0,
            "success": False,
            "error": str(e),
            "environment": environment_info(),
            "results": {
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
                "comparison": {}
            }
        }
        
        try:
            REPORTS.mkdir(parents=True, exist_ok=True)
            # Write error report in root (for Aquila)
            root_error = ROOT / "report.json"
            root_error.write_text(json.dumps(error_report, indent=2))
            # Also write in reports directory
            reports_error = REPORTS / "report.json"
            reports_error.write_text(json.dumps(error_report, indent=2))
            error_path = REPORTS / "latest.json"
            error_path.write_text(json.dumps(error_report, indent=2))
        except Exception:
            pass
        
        return 1


if __name__ == "__main__":
    sys.exit(main())
