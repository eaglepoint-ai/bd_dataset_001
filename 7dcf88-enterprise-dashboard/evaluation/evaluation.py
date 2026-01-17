#!/usr/bin/env python3
import sys
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
        "platform": platform.platform()
    }

def run_tests(target):
    # Adapter for the JavaScript verification suite
    env = {**subprocess.os.environ, "TARGET": target}
    
    try:
        proc = subprocess.run(
            ["node", "tests/verify_refactor.js"],
            cwd=ROOT,
            capture_output=True,
            text=True,
            timeout=120,
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
            "output": "Test Execution Timeout"
        }

def run_metrics(repo_name: str):
    # Optional metrics collection - can be expanded to parse logs if needed
    return {}

def evaluate(target_name: str):
    # In this project, 'repo_name' maps to the 'TARGET' env var for the single script
    tests = run_tests(target_name)
    metrics = run_metrics(target_name)
    return {
        "tests": tests,
        "metrics": metrics
    }

def run_evaluation():
    run_id = str(uuid.uuid4())
    start = datetime.utcnow()

    # Evaluate 'before' state
    before = evaluate("before")
    
    # Evaluate 'after' state
    after = evaluate("after")

    comparison = {
        "passed_gate": after["tests"]["passed"],
        "improvement_summary": "Refactored repository passed all architectural checks." if after["tests"]["passed"] else "Refactored repository failed verification checks."
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
    REPORTS.mkdir(parents=True, exist_ok=True)
    
    try:
        report = run_evaluation()
    except Exception as e:
        report = {
            "success": False,
            "error": str(e)
        }
    
    path = REPORTS / "latest.json"
    path.write_text(json.dumps(report, indent=2))
    print(f"Report written to {path}")
    
    return 0 if report.get("success", False) else 1

if __name__ == "__main__":
    sys.exit(main())
