#!/usr/bin/env python3
import os
import sys
import json
import uuid
import platform
import subprocess
from pathlib import Path
from datetime import datetime

# Root paths
ROOT = Path(__file__).resolve().parent.parent
REPORTS = ROOT / "evaluation" / "reports"

def environment_info():
    """Collect environment metadata."""
    return {
        "python_version": platform.python_version(),
        "platform": platform.platform()
    }

def run_tests(repo_name: str):
    """Run pytest on a repository and return structured results."""
    repo_path = ROOT / repo_name
    try:
        proc = subprocess.run(
            ["pytest", "tests", "-q"],
            cwd=ROOT,
            capture_output=True,
            text=True,
            timeout=120,
            env={**dict(**os.environ), "TARGET_REPO": repo_name}
        )
        return {
            "passed": proc.returncode == 0,
            "return_code": proc.returncode,
            "output": (proc.stdout + proc.stderr)[:8000]  # truncate
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
            "output": f"pytest failed: {str(e)}"
        }

def run_metrics(repo_path: Path):
    """Optional placeholder for metrics collection."""
    # Example: we could measure performance, ops/sec, memory, etc.
    return {}

def evaluate(repo_name: str):
    """Evaluate a repository: tests + metrics."""
    tests = run_tests(repo_name)
    metrics = run_metrics(ROOT / repo_name)
    return {
        "tests": tests,
        "metrics": metrics
    }

def run_evaluation():
    """Run full evaluation comparing before and after implementations."""
    run_id = str(uuid.uuid4())
    start = datetime.utcnow()

    try:
        before = evaluate("repository_before")
        after = evaluate("repository_after")
        comparison = {
            "passed_gate": after["tests"]["passed"],
            "improvement_summary": (
                "After implementation passed correctness tests"
                if after["tests"]["passed"] else
                "After implementation failed correctness tests"
            )
        }
        success = comparison["passed_gate"]
        error = None
    except Exception as e:
        before = after = {}
        comparison = {}
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
    print(f"Report written to {path}")
    return 0 if report["success"] else 1

if __name__ == "__main__":
    sys.exit(main())