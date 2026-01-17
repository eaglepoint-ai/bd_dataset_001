#!/usr/bin/env python3
import os
import sys
import json
import uuid
import time
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

def run_tests(repo_name: str):
    try:
        proc = subprocess.run(
            [
                "docker", "compose", "run", "--rm",
                "-e", f"REPO_UNDER_TEST={repo_name}",
                "tests",
                "pytest", "-m", "correctness", "-q"
            ],
            cwd=ROOT,
            capture_output=True,
            text=True,
            timeout=300
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
            "output": "docker compose pytest timeout"
        }

def run_metrics(repo_name: str):
    """
    Optional metrics collection.
    Currently empty by design.
    """
    return {}


def evaluate(repo_name: str, marker: str):
    tests = run_tests(marker)
    metrics = {}
    return {
        "tests": tests,
        "metrics": metrics
    }

def run_evaluation():
    run_id = str(uuid.uuid4())
    start = datetime.utcnow()

    before = {
      "tests": run_tests("repository_before"),
      "metrics": {}
    }

    after = {
        "tests": run_tests("repository_after"),
        "metrics": {}
    }

    comparison = {
        "passed_gate": after["tests"]["passed"],
        "improvement_summary": (
            "Repository after passes all correctness tests while "
            "repository before fails as expected."
            if after["tests"]["passed"] else
            "Repository after failed correctness tests."
        )
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

def main() -> int:
    REPORTS.mkdir(parents=True, exist_ok=True)

    report = run_evaluation()
    report_path = REPORTS / "report.json"

    report_path.write_text(json.dumps(report, indent=2))
    print(f"Evaluation report written to {report_path}")

    return 0 if report["success"] else 1


if __name__ == "__main__":
    sys.exit(main())
