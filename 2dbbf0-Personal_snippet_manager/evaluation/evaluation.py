#!/usr/bin/env python3
import os
import sys
import time
import json
import uuid
import platform
import subprocess
from pathlib import Path
from datetime import datetime

ROOT = Path(__file__).resolve().parent.parent
REPORTS = ROOT / "evaluation" / "reports"

def wait_for_services(url: str, timeout: int = 60):
    """Waits for a service to be ready by polling its URL."""
    import requests
    start_time = time.time()
    print(f"Waiting for {url}...")
    while time.time() - start_time < timeout:
        try:
            response = requests.get(url, timeout=5)
            if response.status_code == 200:
                print(f"Service {url} is ready!")
                return True
        except requests.exceptions.RequestException:
            pass
        time.sleep(2)
    print(f"Service {url} timed out.")
    return False

def environment_info():
    return {
        "python_version": platform.python_version(),
        "platform": platform.platform()
    }

def run_tests(repo_name: str):
    """
    Runs the automated test suite for a specific repository state.
    """
    # Wait for frontend if we are in a container environment
    frontend_url = os.getenv("FRONTEND_URL")
    if frontend_url:
        wait_for_services(frontend_url)

    # Set environment variables for isolated testing
    env = os.environ.copy()
    if "DATABASE_URL" not in env:
        env["DATABASE_URL"] = "sqlite:///:memory:"
    
    try:

        proc = subprocess.run(
            [sys.executable, "-m", "pytest", "tests", "-v"],
            cwd=ROOT,
            capture_output=True,
            text=True,
            timeout=180,
            env=env
        )
        return {
            "passed": proc.returncode == 0,
            "return_code": proc.returncode,
            "output": (proc.stdout + proc.stderr)[:8000]
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
            "return_code": -2,
            "output": str(e)
        }

def run_metrics(repo_path: Path):
    """
    Collects metrics such as warning counts.
    """
    metrics = {
        "warnings": 0,
        "test_count": 0
    }
    
    # Example: count warnings in the output if we had it here
    # Since this is a simple evaluator, we'll keep it basic.
    return metrics

def evaluate(repo_name: str):
    repo_path = ROOT / repo_name
    if not repo_path.exists():
        return {
            "tests": {"passed": False, "return_code": 1, "output": f"Directory {repo_name} not found"},
            "metrics": {}
        }
        
    tests = run_tests(repo_name)
    metrics = run_metrics(repo_path)
    return {
        "tests": tests,
        "metrics": metrics
    }

def run_evaluation():
    run_id = str(uuid.uuid4())
    start = datetime.utcnow()
    
    # The user specified: "we do not have befor s just do the evaluation for after"
    # We provide a mock/failed 'before' to satisfy the standard schema.
    before = {
        "tests": {
            "passed": False,
            "return_code": 1,
            "output": "No repository_before provided for this evaluation."
        },
        "metrics": {}
    }
    
    after = evaluate("repository_after")
    
    comparison = {
        "passed_gate": after["tests"]["passed"],
        "improvement_summary": "Evaluated the 'after' implementation against the full 15-test suite."
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

def main():
    import argparse
    parser = argparse.ArgumentParser(description="Run evaluation for Personal Snippet Manager")
    parser.add_argument("--output", type=str, help="Path to save the report (standard YYYY/MM/DD logic used if omitted)")
    args = parser.parse_args()

    # Create root reports dir
    REPORTS.mkdir(parents=True, exist_ok=True)
    
    try:
        report = run_evaluation()
    except Exception as e:
        report = {
            "success": False,
            "error": str(e),
            "before": None,
            "after": None
        }
        
    if args.output:
        report_path = Path(args.output)
        report_path.parent.mkdir(parents=True, exist_ok=True)
        report_path.write_text(json.dumps(report, indent=2))
        print(f"Report written to {report_path}")
    else:
        # Save only latest.json in the reports directory
        latest_path = REPORTS / "latest.json"
        latest_path.write_text(json.dumps(report, indent=2))
        print(f"Evaluation report generated at {latest_path}")
    
    if report.get("success"):
        print("Evaluation PASSED")
        return 0
    else:
        print("Evaluation FAILED")
        return 1

if __name__ == "__main__":
    sys.exit(main())
