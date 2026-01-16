#!/usr/bin/env python3
import sys
import os
import json
import time
import uuid
import platform
import subprocess
from pathlib import Path
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parent.parent
REPORTS = ROOT / "evaluation" / "reports"

def environment_info():
    return {
        "python_version": platform.python_version(),
        "platform": platform.platform(),
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

def run_tests_before():
    """Test repository_before - verify files exist and structure is correct"""
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
    """Test repository_after - Next.js app tests"""
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
            return {
                "passed": False,
                "return_code": type_check.returncode,
                "output": f"Type check failed:\n{(type_check.stdout + type_check.stderr)[:4000]}"
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
            "return_code": 1,
            "output": f"Error running tests: {str(e)}"
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
    """Main evaluation function"""
    run_id = str(uuid.uuid4())
    start = datetime.now(timezone.utc)
    
    try:
        before = evaluate("repository_before")
        after = evaluate("repository_after")
        
        comparison = {
            "passed_gate": after["tests"]["passed"],
            "improvement_summary": "After implementation passed all tests and type checks" if after["tests"]["passed"] else "After implementation failed tests"
        }
        
        end = datetime.now(timezone.utc)
        
        return {
            "run_id": run_id,
            "started_at": start.isoformat(),
            "finished_at": end.isoformat(),
            "duration_seconds": (end - start).total_seconds(),
            "environment": environment_info(),
            "before": before,
            "after": after,
            "comparison": comparison,
            "success": comparison["passed_gate"],
            "error": None
        }
    except Exception as e:
        end = datetime.now(timezone.utc)
        return {
            "run_id": run_id,
            "started_at": start.isoformat(),
            "finished_at": end.isoformat(),
            "duration_seconds": (end - start).total_seconds(),
            "environment": environment_info(),
            "before": {"tests": {"passed": False, "return_code": 1, "output": ""}, "metrics": {}},
            "after": {"tests": {"passed": False, "return_code": 1, "output": ""}, "metrics": {}},
            "comparison": {"passed_gate": False, "improvement_summary": "Evaluation error"},
            "success": False,
            "error": str(e)
        }

def main():
    """Main entry point - CI-safe version that ONLY writes to evaluation/reports/latest.json"""
    # ROOT is already defined at module level - use it
    
    started_at = datetime.now(timezone.utc)
    run_id = str(uuid.uuid4())
    report = None
    exit_code = 1
    
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
        report = {
            "run_id": run_id,
            "started_at": started_at.isoformat(),
            "finished_at": finished_at.isoformat(),
            "duration_seconds": duration,
            "environment": environment_info(),
            "before": {"tests": {"passed": False, "return_code": 1, "output": ""}, "metrics": {}},
            "after": {"tests": {"passed": False, "return_code": 1, "output": ""}, "metrics": {}},
            "comparison": {"passed_gate": False, "improvement_summary": "Evaluation script error"},
            "success": False,
            "error": str(e)
        }
        exit_code = 1
        print(f"\n❌ ERROR: {str(e)}", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
    
    # CRITICAL: Write to evaluation/reports/latest.json unconditionally
    # This is the ONLY file the CI evaluator checks
    try:
        report_json = json.dumps(report, indent=2)
        latest_path = REPORTS / "latest.json"
        
        # Write the file (this is what CI looks for)
        with open(latest_path, "w") as f:
            f.write(report_json)
        
        # Print to stdout for logging
        print(report_json)
        
        # Print info to stderr
        print(f"\n✅ Report written to: {latest_path}", file=sys.stderr)
        print(f"Run ID: {run_id}", file=sys.stderr)
        print(f"Duration: {duration:.2f}s", file=sys.stderr)
        print(f"Success: {'✅ YES' if report['success'] else '❌ NO'}", file=sys.stderr)
        
    except Exception as write_error:
        # Even if writing fails, try to print error
        print(f"\n❌ FATAL: Failed to write report: {write_error}", file=sys.stderr)
        print(json.dumps(report, indent=2))  # At least print to stdout
    
    # Exit AFTER writing the file
    return exit_code

if __name__ == "__main__":
    sys.exit(main())
