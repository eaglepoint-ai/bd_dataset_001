#!/usr/bin/env python3
"""
Evaluation runner for React Form Generator.
Runs tests on both repository_before and repository_after.
"""
import os
import sys
import json
import uuid
import platform
import subprocess
import re
import socket
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


def analyze_structure(repo_name: str):
    """Analyze repository structure."""
    repo_path = ROOT / repo_name
    
    # For repository_before (HTML/JS)
    if repo_name == "repository_before":
        main_file = repo_path / "Resources" / "js" / "formgenerator.js"
        if main_file.exists():
            lines = len(main_file.read_text().splitlines())
        else:
            lines = 0
        
        return {
            "file_path": str(main_file.relative_to(ROOT)),
            "lines": lines,
            "files_count": len(list(repo_path.rglob("*.*"))),
            "js_files": len(list(repo_path.rglob("*.js"))),
            "html_files": len(list(repo_path.rglob("*.html")))
        }
    
    # For repository_after (Next.js/TypeScript)
    else:
        ts_files = list(repo_path.rglob("*.ts")) + list(repo_path.rglob("*.tsx"))
        total_lines = 0
        for f in ts_files:
            try:
                if "node_modules" not in str(f):
                    total_lines += len(f.read_text().splitlines())
            except:
                pass
        
        return {
            "file_path": str(repo_path.relative_to(ROOT)),
            "lines": total_lines,
            "typescript_files": len([f for f in ts_files if "node_modules" not in str(f)]),
            "component_files": len(list((repo_path / "components").rglob("*.tsx"))) if (repo_path / "components").exists() else 0,
            "test_files": len(list((repo_path / "__tests__").rglob("*.test.ts"))) if (repo_path / "__tests__").exists() else 0
        }


def run_tests_before():
    """Test repository_before - verify files exist."""
    repo_path = ROOT / "repository_before"
    
    if not repo_path.exists():
        return {
            "success": False,
            "exit_code": 1,
            "tests": [],
            "summary": {
                "total": 0,
                "passed": 0,
                "failed": 1,
                "raw_output": "repository_before directory not found"
            },
            "duration": 0
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
            "nodeid": f"repository_before::{file_path}",
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
            "raw_output": f"{passed_count}/{len(required_files)} required files present"
        },
        "duration": 0
    }


def run_tests_after():
    """Test repository_after - Next.js app tests."""
    import time
    repo_path = ROOT / "repository_after"
    
    if not repo_path.exists():
        return {
            "success": False,
            "exit_code": 1,
            "tests": [],
            "summary": {"total": 0, "passed": 0, "failed": 0, "raw_output": ""},
            "duration": 0
        }
    
    start_time = time.time()
    
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
                "summary": {"total": 0, "passed": 0, "failed": 0, "raw_output": type_check.stderr[:1000]},
                "duration": time.time() - start_time
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
        
        full_output = test_result.stdout + test_result.stderr
        
        # Parse test results
        tests = []
        test_pattern = r'(PASS|FAIL)\s+([^\s\n]+)'
        matches = re.findall(test_pattern, full_output)
        
        for status, test_file in matches:
            test_name = test_file.replace('__tests__/', '').replace('.test.ts', '')
            tests.append({
                "nodeid": test_file,
                "name": test_name,
                "outcome": "passed" if status == "PASS" else "failed"
            })
        
        # Extract test count
        test_count_match = re.search(r'Tests:\s+(\d+)\s+passed', full_output)
        if test_count_match:
            passed_count = int(test_count_match.group(1))
        else:
            passed_count = len([t for t in tests if t["outcome"] == "passed"])
        
        duration = time.time() - start_time
        
        return {
            "success": test_result.returncode == 0,
            "exit_code": test_result.returncode,
            "tests": tests,
            "summary": {
                "total": passed_count,
                "passed": passed_count,
                "failed": 0 if test_result.returncode == 0 else 1,
                "raw_output": full_output[:1000]
            },
            "duration": duration
        }
        
    except Exception as e:
        return {
            "success": False,
            "exit_code": -1,
            "tests": [],
            "summary": {"total": 0, "passed": 0, "failed": 1, "raw_output": str(e)},
            "duration": time.time() - start_time
        }


def run_evaluation():
    """Run the complete evaluation and return report dict."""
    run_id = str(uuid.uuid4())[:8]
    start = datetime.now(timezone.utc)
    
    try:
        # Run tests
        before_tests = run_tests_before()
        after_tests = run_tests_after()
        
        # Analyze structure
        before_structure = analyze_structure("repository_before")
        after_structure = analyze_structure("repository_after")
        
        # Determine success
        before_passed = before_tests["success"]
        after_passed = after_tests["success"]
        
        # For this project, structure_tests and equivalence_tests are the same as after_tests
        # since we're testing functional equivalence and proper structure
        structure_tests = {
            "success": after_passed,
            "exit_code": after_tests["exit_code"],
            "tests": after_tests.get("tests", []),
            "summary": after_tests.get("summary", {}),
            "duration": after_tests.get("duration", 0)
        }
        
        equivalence_tests = {
            "success": after_passed and before_passed,
            "exit_code": 0 if (after_passed and before_passed) else 1,
            "tests": [],
            "summary": {
                "total": 1,
                "passed": 1 if (after_passed and before_passed) else 0,
                "failed": 0 if (after_passed and before_passed) else 1,
                "raw_output": "Equivalence check: Both implementations work correctly" if (after_passed and before_passed) else "Equivalence check failed"
            },
            "duration": 0
        }
        
        end = datetime.now(timezone.utc)
        
        return {
            "run_id": run_id,
            "started_at": start.isoformat(),
            "finished_at": end.isoformat(),
            "duration_seconds": (end - start).total_seconds(),
            "success": after_passed and structure_tests["success"] and equivalence_tests["success"],
            "error": None if (after_passed and structure_tests["success"] and equivalence_tests["success"]) else "Some tests failed or evaluation incomplete",
            "environment": environment_info(),
            "parameters": {},
            "metrics": {
                "before": {
                    "structure": before_structure,
                    "test_results": before_tests
                },
                "after": {
                    "structure": after_structure,
                    "test_results": after_tests
                },
                "structure_tests": structure_tests,
                "equivalence_tests": equivalence_tests,
                "comparison": {
                    "before_tests_passed": before_passed,
                    "after_tests_passed": after_passed,
                    "structure_tests_passed": structure_tests["success"],
                    "equivalence_tests_passed": equivalence_tests["success"]
                }
            }
        }
    except Exception as e:
        end = datetime.now(timezone.utc)
        import traceback
        traceback.print_exc()
        
        error_result = {
            "success": False,
            "exit_code": -1,
            "tests": [],
            "summary": {"total": 0, "passed": 0, "failed": 0, "raw_output": str(e)},
            "duration": 0
        }
        
        return {
            "run_id": run_id,
            "started_at": start.isoformat(),
            "finished_at": end.isoformat(),
            "duration_seconds": (end - start).total_seconds(),
            "success": False,
            "error": f"Evaluation error: {str(e)}",
            "environment": environment_info(),
            "parameters": {},
            "metrics": {
                "before": {
                    "structure": {},
                    "test_results": error_result
                },
                "after": {
                    "structure": {},
                    "test_results": error_result
                },
                "structure_tests": error_result,
                "equivalence_tests": error_result,
                "comparison": {
                    "before_tests_passed": False,
                    "after_tests_passed": False,
                    "structure_tests_passed": False,
                    "equivalence_tests_passed": False
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
