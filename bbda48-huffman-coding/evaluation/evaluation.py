#!/usr/bin/env python3
import sys
import json
import uuid
import platform
import subprocess
from pathlib import Path
from datetime import datetime

ROOT = Path(__file__).resolve().parent.parent
REPORTS = ROOT / "evaluation" / "reports"
TESTS_PATH = ROOT / "tests" / "test.py"

def environment_info():
    return {
        "python_version": platform.python_version(),
        "platform": platform.platform()
    }

def run_tests(repo_name: str):
    """
    Run pytest for a given repository (before or after)
    Pass repository path as environment variable so test.py knows which repo to test
    """
    repo_path = ROOT / repo_name
    env = dict(**dict(os.environ), REPO_PATH=str(repo_path.resolve()))
    try:
        proc = subprocess.run(
            [sys.executable, str(TESTS_PATH), "-v"],
            cwd=ROOT,
            env=env,
            capture_output=True,
            text=True,
            timeout=120
        )
        return {
            "passed": proc.returncode == 0,
            "return_code": proc.returncode,
            "output": (proc.stdout + proc.stderr)[:8000]
        }
    except subprocess.TimeoutExpired:
        return {"passed": False, "return_code": -1, "output": "pytest timeout"}
    except Exception as e:
        return {"passed": False, "return_code": -1, "output": str(e)}

def run_metrics(repo_path: Path):
    # Optional
    return {}

def evaluate(repo_name: str):
    tests = run_tests(repo_name)
    metrics = run_metrics(ROOT / repo_name)
    return {"tests": tests, "metrics": metrics}

def run_evaluation():
    run_id = str(uuid.uuid4())
    start = datetime.utcnow()

    try:
        before = evaluate("repository_before")
        after = evaluate("repository_after")

        comparison = {
            "passed_gate": after["tests"]["passed"],
            "improvement_summary": (
                "After implementation passed all tests"
                if after["tests"]["passed"] else
                "After implementation failed some tests"
            )
        }
        success = comparison["passed_gate"]
        error = None

    except Exception as e:
        before = after = comparison = {}
        success = False
        error = str(e)

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
        "success": success,
        "error": error
    }

def main():
    REPORTS.mkdir(parents=True, exist_ok=True)
    report = run_evaluation()
    path = REPORTS / "latest.json"
    path.write_text(json.dumps(report, indent=2))
    print(f"📄 Report written to {path}")

    # print full test output for easier debugging
    print("\n=== After Repository Test Output ===")
    print(report["after"]["tests"]["output"])

    if report["success"]:
        print("✅ Evaluation SUCCESS — repository_after passed all tests.")
    else:
        print("❌ Evaluation FAILED — repository_after did not pass all tests.")

    return 0 if report["success"] else 1

if __name__ == "__main__":
    import os
    sys.exit(main())
