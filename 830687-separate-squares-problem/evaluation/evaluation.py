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
from pathlib import Path
from datetime import datetime

ROOT = Path(__file__).resolve().parent.parent
REPORTS = ROOT / "evaluation" / "reports"


def environment_info():

    """Collect environment information."""
    
    return {
        "python_version": platform.python_version(),
        "platform": platform.platform()
    }


def run_tests(repo_path: Path):

    """Run pytest for a repository."""
    
    env = os.environ.copy()
    env["PYTHONPATH"] = str(repo_path)
    
    try:
        proc = subprocess.run(
            [sys.executable, "-m", "pytest", str(ROOT / "tests"), "-q"],
            cwd=ROOT,
            capture_output=True,
            text=True,
            timeout=120,
            env=env
        )
        output = (proc.stdout + proc.stderr)[:8000]
        return {
            "passed": proc.returncode == 0,
            "return_code": proc.returncode,
            "output": output
        }
    except subprocess.TimeoutExpired:
        return {
            "passed": False,
            "return_code": -1,
            "output": "pytest timeout"
        }
    except Exception as e:
        return {
            "passed": False,
            "return_code": -1,
            "output": f"Error running tests: {str(e)}"
        }


def run_metrics(repo_path: Path):
    return {}


def evaluate(repo_name: str):
    repo_path = ROOT / repo_name
    tests = run_tests(repo_path)
    metrics = run_metrics(repo_path)
    return {
        "tests": tests,
        "metrics": metrics
    }


def run_evaluation():

    """Run the complete evaluation and return report dict."""
    
    run_id = str(uuid.uuid4())
    start = datetime.utcnow()
    
    try:
        before = evaluate("repository_before")
        after = evaluate("repository_after")
        
        passed_gate = after["tests"]["passed"]
        if passed_gate:
            improvement_summary = "After implementation passed correctness tests"
        else:
            improvement_summary = "After implementation failed correctness tests"
        
        end = datetime.utcnow()
        
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
        end = datetime.utcnow()
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
