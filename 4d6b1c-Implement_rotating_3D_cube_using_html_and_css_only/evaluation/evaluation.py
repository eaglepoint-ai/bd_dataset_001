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
import re

ROOT = Path(__file__).resolve().parent.parent
REPORTS = ROOT / "evaluation" / "reports"

def environment_info():
    return {
        "python_version": platform.python_version(),
        "platform": platform.platform()
    }

def run_tests(cwd: Path, test_folder: str):
    try:
        # Check if tests directory exists
        tests_path = ROOT / test_folder
        if not tests_path.exists() or not any(tests_path.iterdir()):
            return {
                "passed": False,
                "return_code": -1,
                "output": f"Test directory {test_folder} not found or empty"
            }
        
        # Check for package.json to determine if it's a JS/TS repo
        is_js = (tests_path / "package.json").exists()
        
        if is_js:
             # Run playwright tests
             # We use shell=False for correct argument parsing in Docker/Linux
             proc = subprocess.run(
                ["pnpm", "test"],
                cwd=tests_path,
                env=os.environ.copy(),
                capture_output=True,
                text=True,
                timeout=120
             )
        else:
            # Fallback to python/pytest
            env = os.environ.copy()
            env["PYTHONPATH"] = str(cwd) + (platform.pathsep + env.get("PYTHONPATH", "") if env.get("PYTHONPATH") else "")
            
            proc = subprocess.run(
                [sys.executable, "-m", "pytest", test_folder, "-q"],
                cwd=ROOT,
                env=env,
                capture_output=True,
                text=True,
                timeout=120
            )

        # Strip ANSI escape codes
        ansi_escape = re.compile(r'\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])')
        output = (proc.stdout + proc.stderr)[:8000]
        output = ansi_escape.sub('', output).strip()

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
            "output": f"Execution error: {str(e)}"
        }

def run_metrics(repo_path: Path):
    # Optional – trainers implement if needed
    return {}

def evaluate(repo_name: str, test_folder: str):
    repo_path = ROOT / repo_name
    
    tests = run_tests(repo_path, test_folder)
    metrics = run_metrics(repo_path)
    return {
        "tests": tests,
        "metrics": metrics
    }

def run_evaluation():
    run_id = str(uuid.uuid4())
    start = datetime.utcnow()
    
    # Check if directories exist
    if not (ROOT / "repository_before").exists():
        print("Warning: repository_before NOT FOUND. Mocking results.")
    if not (ROOT / "repository_after").exists():
        print("Warning: repository_after NOT FOUND. Mocking results.")

    # No tests for repository_before
    before = {
        "tests": {
            "passed": True, # Considered passed since no requirement
            "return_code": 0,
            "output": "No tests for repository_before"
        },
        "metrics": {}
    }

    after = evaluate("repository_after", "tests/")
    
    passed_gate = after["tests"]["passed"]
    
    comparison = {
        "passed_gate": passed_gate,
        "improvement_summary": "After implementation passed correctness check" if passed_gate else "After implementation FAILED correctness check"
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
        import traceback
        traceback.print_exc()
        report = {
            "success": False,
            "error": str(e)
        }
        
    path = REPORTS / "latest.json"
    path.write_text(json.dumps(report, indent=2, ensure_ascii=False))
    print(f"Report written to {path}")
    
    # Handle the case where report key might be missing on crash if not handled above
    return 0 if report.get("success", False) else 1

if __name__ == "__main__":
    sys.exit(main())
