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
from pathlib import Path
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parent.parent
REPORTS = ROOT / "evaluation" / "reports"


def environment_info():
    """Collect environment information."""
    return {
        "python_version": platform.python_version(),
        "platform": platform.platform()
    }


def parse_jest_output(output):
    """Parse Jest test output to extract individual test results."""
    tests = []
    summary = {"total": 0, "passed": 0, "failed": 0}
    
    # Extract test results from Jest output
    test_pattern = r'(PASS|FAIL)\s+([^\s\n]+)'
    matches = re.findall(test_pattern, output)
    
    for status, test_file in matches:
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
    summary_match = re.search(r'Tests:\s+(\d+)\s+passed(?:,\s+(\d+)\s+total)?', output)
    if summary_match:
        summary["passed"] = int(summary_match.group(1))
        if summary_match.group(2):
            summary["total"] = int(summary_match.group(2))
    
    return tests, summary


def run_tests_before():
    """Test repository_before - verify files exist."""
    repo_path = ROOT / "repository_before"
    
    if not repo_path.exists():
        return {
            "passed": False,
            "return_code": 1,
            "output": "repository_before directory not found"
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
        return {
            "passed": False,
            "return_code": 1,
            "output": f"Missing required files: {', '.join(missing_files)}"
        }
    
    return {
        "passed": True,
        "return_code": 0,
        "output": "All required files present in repository_before"
    }


def run_tests_after():
    """Test repository_after - Next.js app tests."""
    repo_path = ROOT / "repository_after"
    
    if not repo_path.exists():
        return {
            "passed": False,
            "return_code": 1,
            "output": "repository_after directory not found"
        }
    
    if not (repo_path / "package.json").exists():
        return {
            "passed": False,
            "return_code": 1,
            "output": "package.json not found in repository_after"
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
            output = (type_check.stdout + type_check.stderr)[:8000]
            return {
                "passed": False,
                "return_code": type_check.returncode,
                "output": output
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
        
        output = (test_result.stdout + test_result.stderr)[:8000]
        
        return {
            "passed": test_result.returncode == 0,
            "return_code": test_result.returncode,
            "output": output
        }
        
    except subprocess.TimeoutExpired:
        return {
            "passed": False,
            "return_code": -1,
            "output": "Test execution timeout"
        }
    except Exception as e:
        return {
            "passed": False,
            "return_code": -1,
            "output": f"Error running tests: {str(e)}"
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
        tests = run_tests_before()
    else:
        tests = run_tests_after()
    
    metrics = run_metrics(repo_path)
    
    return {
        "tests": tests,
        "metrics": metrics
    }


def run_evaluation():
    """Run the complete evaluation and return report dict."""
    run_id = str(uuid.uuid4())
    start = datetime.now(timezone.utc)
    
    try:
        before = evaluate("repository_before")
        after = evaluate("repository_after")
        
        passed_gate = after["tests"]["passed"]
        if passed_gate:
            improvement_summary = "After implementation passed correctness tests"
        else:
            improvement_summary = "After implementation failed correctness tests"
        
        end = datetime.now(timezone.utc)
        
        return {
            "run_id": run_id,
            "started_at": start.isoformat() + "Z",
            "finished_at": end.isoformat() + "Z",
            "duration_seconds": (end - start).total_seconds(),
            "environment": environment_info(),
            "before": before,
            "after": after,
            "comparison": {
                "passed_gate": passed_gate,
                "improvement_summary": improvement_summary
            },
            "success": passed_gate,
            "error": None
        }
    except Exception as e:
        end = datetime.now(timezone.utc)
        return {
            "run_id": run_id,
            "started_at": start.isoformat() + "Z",
            "finished_at": end.isoformat() + "Z",
            "duration_seconds": (end - start).total_seconds(),
            "environment": environment_info(),
            "before": {
                "tests": {
                    "passed": False,
                    "return_code": -1,
                    "output": ""
                },
                "metrics": {}
            },
            "after": {
                "tests": {
                    "passed": False,
                    "return_code": -1,
                    "output": ""
                },
                "metrics": {}
            },
            "comparison": {
                "passed_gate": False,
                "improvement_summary": "Evaluation crashed"
            },
            "success": False,
            "error": str(e)
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
        return 1


if __name__ == "__main__":
    sys.exit(main())
