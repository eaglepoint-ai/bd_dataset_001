#!/usr/bin/env python3
import sys
import os
import json
import time
import uuid
import platform
import subprocess
from pathlib import Path
from datetime import datetime

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
    start = datetime.utcnow()
    
    try:
        before = evaluate("repository_before")
        after = evaluate("repository_after")
        
        comparison = {
            "passed_gate": after["tests"]["passed"],
            "improvement_summary": "After implementation passed all tests and type checks" if after["tests"]["passed"] else "After implementation failed tests"
        }
        
        end = datetime.utcnow()
        
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
            "error": None
        }
    except Exception as e:
        end = datetime.utcnow()
        return {
            "run_id": run_id,
            "started_at": start.isoformat() + "Z",
            "finished_at": end.isoformat() + "Z",
            "duration_seconds": (end - start).total_seconds(),
            "environment": environment_info(),
            "before": {"tests": {"passed": False, "return_code": 1, "output": ""}, "metrics": {}},
            "after": {"tests": {"passed": False, "return_code": 1, "output": ""}, "metrics": {}},
            "comparison": {"passed_gate": False, "improvement_summary": "Evaluation error"},
            "success": False,
            "error": str(e)
        }

def main():
    """Main entry point"""
    report = None
    exit_code = 1
    
    try:
        REPORTS.mkdir(parents=True, exist_ok=True)
        report = run_evaluation()
        
        timestamp = datetime.utcnow().strftime("%Y-%m-%d/%H-%M-%S")
        report_dir = REPORTS / timestamp
        report_dir.mkdir(parents=True, exist_ok=True)
        
        report_path = report_dir / "report.json"
        report_json = json.dumps(report, indent=2)
        report_path.write_text(report_json)
        
        latest_path = REPORTS / "latest.json"
        latest_path.write_text(report_json)
        
        # Write to root for evaluation systems that look there
        root_report = ROOT / "report.json"
        root_report.write_text(report_json)
        
        # Create report_content artifact (required by evaluation system)
        # Try multiple locations where evaluation systems might look
        report_content_paths = [
            ROOT / "report_content",
            ROOT / "report_content.json",
            ROOT / "artifacts" / "report_content",
            REPORTS / "report_content",
            Path("/tmp") / "report_content",
            Path("/tmp") / "report.json"
        ]
        for path in report_content_paths:
            try:
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text(report_json)
            except Exception:
                pass  # Continue if we can't write to a location
        
        # Create log_summary artifact (required by evaluation system)
        log_summary = {
            "status": "success" if report["success"] else "failed",
            "tests_passed": report["after"]["tests"]["passed"],
            "tests_failed": not report["after"]["tests"]["passed"],
            "duration_seconds": report["duration_seconds"],
            "summary": report["comparison"]["improvement_summary"],
            "before_tests_passed": report["before"]["tests"]["passed"],
            "after_tests_passed": report["after"]["tests"]["passed"]
        }
        log_summary_json = json.dumps(log_summary, indent=2)
        log_summary_paths = [
            ROOT / "log_summary",
            ROOT / "log_summary.json",
            ROOT / "artifacts" / "log_summary",
            REPORTS / "log_summary",
            Path("/tmp") / "log_summary"
        ]
        for path in log_summary_paths:
            try:
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text(log_summary_json)
            except Exception:
                pass  # Continue if we can't write to a location
        
        # Print report to stdout for CI/CD systems to capture (CRITICAL)
        # CodeBuild systems often parse stdout for the report
        print(report_json)
        
        # Also print to stderr for logging (non-critical info)
        print(f"Report written to {report_path}", file=sys.stderr)
        print(f"Latest report: {latest_path}", file=sys.stderr)
        print(f"Root report: {root_report}", file=sys.stderr)
        
        exit_code = 0 if report["success"] else 1
        
    except Exception as e:
        # Even if evaluation fails, try to write error report
        error_report = {
            "run_id": str(uuid.uuid4()),
            "started_at": datetime.utcnow().isoformat() + "Z",
            "finished_at": datetime.utcnow().isoformat() + "Z",
            "duration_seconds": 0,
            "environment": environment_info(),
            "before": {"tests": {"passed": False, "return_code": 1, "output": ""}, "metrics": {}},
            "after": {"tests": {"passed": False, "return_code": 1, "output": ""}, "metrics": {}},
            "comparison": {"passed_gate": False, "improvement_summary": "Evaluation script error"},
            "success": False,
            "error": str(e)
        }
        error_json = json.dumps(error_report, indent=2)
        
        # Write error report to all locations
        try:
            (ROOT / "report.json").write_text(error_json)
            (ROOT / "report_content").write_text(error_json)
            (Path("/tmp") / "report.json").write_text(error_json)
            print(error_json)  # Print to stdout
        except Exception:
            pass
        
        print(f"Fatal error: {str(e)}", file=sys.stderr)
        exit_code = 1
    
    return exit_code

if __name__ == "__main__":
    sys.exit(main())
