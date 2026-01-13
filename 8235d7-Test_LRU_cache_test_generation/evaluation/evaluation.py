#!/usr/bin/env python3
import sys
import json
import time
import uuid
import platform
import subprocess
import os
from pathlib import Path
from datetime import datetime

ROOT = Path(__file__).resolve().parent.parent
REPORTS = ROOT / "evaluation" / "reports"

def environment_info():
    return {
        "python_version": platform.python_version(),
        "platform": platform.platform()
    }

def run_tests(repo_name: str):
    repo_path = ROOT / repo_name
    env = os.environ.copy()
    # Add the repository path to PYTHONPATH so tests can import lru_cache
    env["PYTHONPATH"] = str(repo_path) + os.pathsep + env.get("PYTHONPATH", "")
    # Add REPO_PATH for meta_test.py
    env["REPO_PATH"] = str(repo_path)
    
    try:
        proc = subprocess.run(
            [sys.executable, "-m", "pytest", "tests/meta_test.py", "-q", "--no-header", "--no-summary"],
            cwd=ROOT,
            capture_output=True,
            text=True,
            timeout=120,
            env=env
        )
        # Clean output from bits of pytest that might still have escape codes or just be noise
        output = (proc.stdout + proc.stderr).strip()
        return {
            "passed": proc.returncode == 0,
            "return_code": proc.returncode,
            "output": output[:8000]
        }
    except subprocess.TimeoutExpired:
        return {
            "passed": False,
            "return_code": -1,
            "output": "pytest timeout"
        }

def run_metrics(repo_path: Path):
    # Optional – trainers implement if needed
    return {}

def evaluate(repo_name: str):
    repo_path = ROOT / repo_name
    tests = run_tests(repo_name)
    metrics = run_metrics(repo_path)
    return {
        "tests": tests,
        "metrics": metrics
    }

def run_evaluation():
    run_id = str(uuid.uuid4())
    start = datetime.utcnow()
    
    # No tests for repository_before
    before = {
        "tests": {
            "passed": True, # Considered passed since no requirement
            "return_code": 0,
            "output": "No tests for repository_before"
        },
        "metrics": {}
    }
    after = evaluate("repository_after")
    
    comparison = {
        "passed_gate": after["tests"]["passed"],
        "improvement_summary": "Evaluation completed comparing before and after implementations."
    }
    
    if not before["tests"]["passed"] and after["tests"]["passed"]:
        comparison["improvement_summary"] = "After implementation passed tests while before failed."
    elif before["tests"]["passed"] and after["tests"]["passed"]:
        comparison["improvement_summary"] = "Both implementations passed tests."
    elif not after["tests"]["passed"]:
        comparison["improvement_summary"] = "After implementation failed tests."

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
    try:
        REPORTS.mkdir(parents=True, exist_ok=True)
        report = run_evaluation()
        path = REPORTS / "latest.json"
        path.write_text(json.dumps(report, indent=2))
        print(f"Report written to {path}")
        return 0 if report["success"] else 1
    except Exception as e:
        report = {
            "success": False,
            "error": str(e)
        }
        path = REPORTS / "latest.json"
        path.write_text(json.dumps(report, indent=2))
        print(f"Evaluation failed: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
