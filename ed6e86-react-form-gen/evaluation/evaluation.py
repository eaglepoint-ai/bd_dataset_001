#!/usr/bin/env python3
import sys
import os
import json
import time
import uuid
import platform
import subprocess
import socket
import re
from pathlib import Path
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parent.parent
REPORTS = ROOT / "evaluation" / "reports"

def get_timestamped_report_path():
    """Generate timestamped report path: evaluation/reports/YYYY-MM-DD/HH-MM-SS/report.json"""
    now = datetime.now(timezone.utc)
    date_dir = now.strftime("%Y-%m-%d")
    time_dir = now.strftime("%H-%M-%S")
    # Match template structure: evaluation/reports/YYYY-MM-DD/HH-MM-SS/report.json
    timestamped_dir = ROOT / "evaluation" / "reports" / date_dir / time_dir
    return timestamped_dir / "report.json"

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
    commit, branch = get_git_info()
    platform_info = platform.platform().split('-')
    
    return {
        "python_version": platform.python_version(),
        "platform": platform.platform(),
        "os": platform.system(),
        "os_release": platform.release(),
        "architecture": platform.machine(),
        "hostname": socket.gethostname(),
        "git_commit": commit,
        "git_branch": branch,
        "node_version": get_node_version()
    }

def get_node_version():
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

def parse_jest_output(output):
    """Parse Jest test output to extract individual test results"""
    tests = []
    summary = {"total": 0, "passed": 0, "failed": 0, "errors": 0, "skipped": 0}
    
    # Extract test results from Jest output
    # Pattern: PASS __tests__/file.test.ts or FAIL __tests__/file.test.ts
    test_pattern = r'(PASS|FAIL)\s+([^\s\n]+)'
    matches = re.findall(test_pattern, output)
    
    for status, test_file in matches:
        # Extract test name from file path
        test_name = test_file.replace('__tests__/', '').replace('.test.ts', '').replace('.test.tsx', '')
        outcome = "passed" if status == "PASS" else "failed"
        
        tests.append({
            "nodeid": test_file,
            "name": test_name,
            "outcome": outcome
        })
        
        if outcome == "passed":
            summary["passed"] += 1
        else:
            summary["failed"] += 1
        summary["total"] += 1
    
    # Try to extract summary from Jest output
    # Pattern: "Tests: X passed, Y total" or "Test Suites: X passed, Y total"
    summary_match = re.search(r'Tests:\s+(\d+)\s+passed(?:,\s+(\d+)\s+total)?', output)
    if summary_match:
        summary["passed"] = int(summary_match.group(1))
        if summary_match.group(2):
            summary["total"] = int(summary_match.group(2))
    else:
        # Fallback: try to get from test suites line
        suite_match = re.search(r'Test Suites:\s+(\d+)\s+passed(?:,\s+(\d+)\s+total)?', output)
        if suite_match and summary["total"] == 0:
            # If we found test suites but no individual tests, create placeholder
            if not tests:
                tests.append({
                    "nodeid": "jest/test_suites",
                    "name": "test_suites",
                    "outcome": "passed" if int(suite_match.group(1)) > 0 else "failed"
                })
    
    return tests, summary

def run_tests_before():
    """Test repository_before - verify files exist and structure is correct"""
    repo_path = ROOT / "repository_before"
    
    if not repo_path.exists():
        return {
            "success": False,
            "exit_code": 1,
            "tests": [],
            "summary": {"total": 0, "passed": 0, "failed": 1, "errors": 0, "skipped": 0},
            "stdout": "",
            "stderr": "repository_before directory not found"
        }
    
    required_files = [
        "Resources/html/form.html",
        "Resources/html/formdisplay.html",
        "Resources/js/formgenerator.js",
        "Resources/js/formdisplay.js"
    ]
    
    missing_files = []
    for file_path in required_files:
        if not (repo_path / file_path).exists():
            missing_files.append(file_path)
    
    if missing_files:
        tests = [{
            "nodeid": f"repository_before::{f}",
            "name": f"check_{f.replace('/', '_').replace('.', '_')}",
            "outcome": "failed"
        } for f in missing_files]
        
        return {
            "success": False,
            "exit_code": 1,
            "tests": tests,
            "summary": {"total": len(required_files), "passed": len(required_files) - len(missing_files), "failed": len(missing_files), "errors": 0, "skipped": 0},
            "stdout": f"Missing required files: {', '.join(missing_files)}",
            "stderr": ""
        }
    
    tests = [{
        "nodeid": f"repository_before::{f}",
        "name": f"check_{f.replace('/', '_').replace('.', '_')}",
        "outcome": "passed"
    } for f in required_files]
    
    return {
        "success": True,
        "exit_code": 0,
        "tests": tests,
        "summary": {"total": len(required_files), "passed": len(required_files), "failed": 0, "errors": 0, "skipped": 0},
        "stdout": "All required files present in repository_before",
        "stderr": ""
    }

def run_tests_after():
    """Test repository_after - Next.js app tests"""
    repo_path = ROOT / "repository_after"
    
    if not repo_path.exists():
        return {
            "success": False,
            "exit_code": 1,
            "tests": [],
            "summary": {"total": 0, "passed": 0, "failed": 0, "errors": 1, "skipped": 0},
            "stdout": "",
            "stderr": "repository_after directory not found"
        }
    
    if not (repo_path / "package.json").exists():
        return {
            "success": False,
            "exit_code": 1,
            "tests": [],
            "summary": {"total": 0, "passed": 0, "failed": 0, "errors": 1, "skipped": 0},
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
            return {
                "success": False,
                "exit_code": type_check.returncode,
                "tests": [],
                "summary": {"total": 0, "passed": 0, "failed": 0, "errors": 1, "skipped": 0},
                "stdout": type_check.stdout[:8000],
                "stderr": type_check.stderr[:8000]
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
        
        stdout = test_result.stdout[:8000]
        stderr = test_result.stderr[:8000]
        
        # Parse Jest output to extract test results
        tests, summary = parse_jest_output(stdout)
        
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
            "exit_code": 1,
            "tests": [],
            "summary": {"total": 0, "passed": 0, "failed": 0, "errors": 1, "skipped": 0},
            "stdout": "",
            "stderr": f"Error running tests: {str(e)}"
        }

def run_metrics(repo_path: Path):
    """Collect optional metrics"""
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
    """Evaluate a repository"""
    if repo_name == "repository_before":
        return run_tests_before()
    else:
        return run_tests_after()

def run_evaluation():
    """Main evaluation function"""
    run_id = str(uuid.uuid4())[:8]  # Short run ID like in sample
    start = datetime.now(timezone.utc)
    
    try:
        before = evaluate("repository_before")
        after = evaluate("repository_after")
        
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
        
        end = datetime.now(timezone.utc)
        
        return {
            "run_id": run_id,
            "started_at": start.isoformat(),
            "finished_at": end.isoformat(),
            "duration_seconds": (end - start).total_seconds(),
            "success": after["success"],
            "error": None,
            "environment": environment_info(),
            "results": {
                "before": before,
                "after": after,
                "comparison": comparison
            }
        }
    except Exception as e:
        end = datetime.now(timezone.utc)
        error_result = {
            "success": False,
            "exit_code": 1,
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

def write_report_file(report, file_path):
    """Helper function to write report to a file"""
    try:
        file_path.parent.mkdir(parents=True, exist_ok=True)
        with open(file_path, "w") as f:
            json.dump(report, f, indent=2)
        return True
    except Exception as e:
        print(f"Warning: Failed to write report to {file_path}: {e}", file=sys.stderr)
        return False

def main():
    """Main entry point - writes to both evaluation/reports/latest.json and report.json"""
    # ROOT is already defined at module level - use it
    
    started_at = datetime.now(timezone.utc)
    run_id = str(uuid.uuid4())[:8]  # Short run ID
    report = None
    exit_code = 1
    
    # Initialize a minimal report in case of catastrophic failure
    minimal_report = {
        "run_id": run_id,
        "started_at": started_at.isoformat(),
        "finished_at": started_at.isoformat(),
        "duration_seconds": 0.0,
        "success": False,
        "error": "Evaluation failed to start",
        "environment": {},
        "results": {
            "before": {
                "success": False,
                "exit_code": 1,
                "tests": [],
                "summary": {"total": 0, "passed": 0, "failed": 0, "errors": 1, "skipped": 0},
                "stdout": "",
                "stderr": "Evaluation failed to start"
            },
            "after": {
                "success": False,
                "exit_code": 1,
                "tests": [],
                "summary": {"total": 0, "passed": 0, "failed": 0, "errors": 1, "skipped": 0},
                "stdout": "",
                "stderr": "Evaluation failed to start"
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
    }
    
    try:
        # Ensure reports directory exists
        REPORTS.mkdir(parents=True, exist_ok=True)
        
        # Run evaluation
        report = run_evaluation()
        
        finished_at = datetime.now(timezone.utc)
        duration = (finished_at - started_at).total_seconds()
        
        # Update timestamps in report
        report["started_at"] = started_at.isoformat()
        report["finished_at"] = finished_at.isoformat()
        report["duration_seconds"] = duration
        
        exit_code = 0 if report["success"] else 1
        
    except Exception as e:
        import traceback
        finished_at = datetime.now(timezone.utc)
        duration = (finished_at - started_at).total_seconds()
        
        # Create error report
        try:
            env_info = environment_info()
        except:
            env_info = {}
        
        error_result = {
            "success": False,
            "exit_code": 1,
            "tests": [],
            "summary": {"total": 0, "passed": 0, "failed": 0, "errors": 1, "skipped": 0},
            "stdout": "",
            "stderr": str(e)
        }
        report = {
            "run_id": run_id,
            "started_at": started_at.isoformat(),
            "finished_at": finished_at.isoformat(),
            "duration_seconds": duration,
            "success": False,
            "error": str(e),
            "environment": env_info,
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
        exit_code = 1
        print(f"\n❌ ERROR: {str(e)}", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
    
    # Ensure report exists (use minimal if somehow None)
    if report is None:
        report = minimal_report
        report["finished_at"] = datetime.now(timezone.utc).isoformat()
        report["duration_seconds"] = (datetime.now(timezone.utc) - started_at).total_seconds()
    
    # CRITICAL: Write report.json - MUST happen before exit
    # Use try-finally to ensure report is ALWAYS written, even on catastrophic failure
    try:
        # CRITICAL: Write to both latest.json and report.json
        # The CI evaluator expects report.json - write to multiple locations to ensure CI finds it
        # Match the structure from template: evaluation/reports/YYYY-MM-DD/HH-MM-SS/report.json
        report_json = json.dumps(report, indent=2)
        
        # Get timestamped report path (matches template structure)
        timestamped_report_path = get_timestamped_report_path()
        
        # List of all locations to write report.json
        # Priority order: root first (CI most likely checks here), then timestamped, then backups
        # CRITICAL: The evaluator expects report.json in the project root directory
        root_report = ROOT / "report.json"
        root_report_absolute = root_report.resolve()
        report_paths = [
            root_report,                        # In project root (PRIMARY - CI/evaluator checks this first)
            timestamped_report_path,            # Timestamped path: evaluation/reports/YYYY-MM-DD/HH-MM-SS/report.json (matches template)
            REPORTS / "report.json",            # In reports subdirectory (backup)
            REPORTS / "latest.json",            # For local reference
            ROOT / "evaluation" / "report.json",  # In evaluation directory (backup)
        ]
        
        # Write to all locations
        written_count = 0
        for path in report_paths:
            resolved_path = path.resolve()
            if write_report_file(report, resolved_path):
                written_count += 1
        
        # CRITICAL: Verify root report.json exists - evaluator requires this
        if not root_report_absolute.exists():
            print(f"CRITICAL ERROR: report.json not found at expected location: {root_report_absolute}", file=sys.stderr)
            # Emergency write with absolute path
            try:
                root_report_absolute.parent.mkdir(parents=True, exist_ok=True)
                with open(root_report_absolute, "w") as f:
                    json.dump(report, f, indent=2)
                print(f"Emergency write successful: {root_report_absolute}", file=sys.stderr)
                written_count += 1
            except Exception as e:
                print(f"Emergency write failed: {e}", file=sys.stderr)
                # Last resort: print to stdout so CI can capture it
                print(f"\nCRITICAL: Writing report to stdout as fallback:", file=sys.stderr)
                print(report_json)
        
        # Print to stdout for logging (CI may capture this)
        print(report_json)
        
        # Print info to stderr
        print(f"\n✅ Report written to {written_count}/{len(report_paths)} locations", file=sys.stderr)
        print(f"PRIMARY LOCATION: {root_report_absolute}", file=sys.stderr)
        print(f"  Exists: {root_report_absolute.exists()}", file=sys.stderr)
        if root_report_absolute.exists():
            print(f"  Size: {root_report_absolute.stat().st_size} bytes", file=sys.stderr)
        for path in report_paths:
            resolved_path = path.resolve()
            if resolved_path.exists():
                print(f"  ✓ {resolved_path}", file=sys.stderr)
            else:
                print(f"  ✗ {resolved_path} (FAILED)", file=sys.stderr)
        
        print(f"Run ID: {run_id}", file=sys.stderr)
        print(f"Duration: {report.get('duration_seconds', 0):.2f}s", file=sys.stderr)
        print(f"Success: {'✅ YES' if report.get('success', False) else '❌ NO'}", file=sys.stderr)
        
        # If no files were written, at least print to stdout so CI can capture it
        if written_count == 0:
            print(f"\n❌ FATAL: Failed to write report to any location!", file=sys.stderr)
            print(report_json)  # At least print to stdout
        
    except Exception as write_error:
        # Last resort: try to write at least to root
        try:
            emergency_path = ROOT / "report.json"
            with open(emergency_path, "w") as f:
                json.dump(report, f, indent=2)
            print(f"\n⚠️  Emergency report written to: {emergency_path}", file=sys.stderr)
        except:
            print(f"\n❌ CRITICAL: Failed to write report even to emergency location!", file=sys.stderr)
            print(json.dumps(report, indent=2))  # At least print to stdout
    
    # Exit AFTER writing the file
    return exit_code

if __name__ == "__main__":
    sys.exit(main())
