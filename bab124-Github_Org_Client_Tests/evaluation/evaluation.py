#!/usr/bin/env python3
import subprocess
import json
import os
import sys
import time
import uuid
import platform
from datetime import datetime


def run_tests(pythonpath: str):
    env = os.environ.copy()
    env["PYTHONPATH"] = pythonpath

    proc = subprocess.run(
        ["pytest", "-q"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        env=env,
        text=True,
    )

    # Truncate output to avoid overly long JSON
    combined_output = proc.stdout + proc.stderr
    truncated_output = combined_output[:1000] + ("..." if len(combined_output) > 1000 else "")

    return {
        "exit_code": proc.returncode,
        "stdout": proc.stdout,
        "stderr": proc.stderr,
        "success": proc.returncode == 0,
        "truncated_output": truncated_output,
    }


def main():
    run_id = uuid.uuid4().hex[:8]
    started_at = datetime.utcnow()
    start_time = time.time()

    before = run_tests("/app/repository_before")
    after = run_tests("/app/repository_after")

    finished_at = datetime.utcnow()
    duration = time.time() - start_time

    success = (not before["success"]) and after["success"]

    # Build the report structure
    report = {
        "run_id": run_id,
        "started_at": started_at.isoformat(),
        "finished_at": finished_at.isoformat(),
        "duration_seconds": duration,
        "environment": {
            "python_version": sys.version.split()[0],
            "platform": platform.platform(),
        },
        "before": {
            "tests": {
                "passed": before["success"],
                "return_code": before["exit_code"],
                "output": before["truncated_output"],
            },
            "metrics": {},
        },
        "after": {
            "tests": {
                "passed": after["success"],
                "return_code": after["exit_code"],
                "output": after["truncated_output"],
            },
            "metrics": {},
        },
        "comparison": {
            "passed_gate": success,
            "improvement_summary": "Before failed, after passed" if success else "Evaluation failed",
        },
        "success": success,
        "error": None if success else "Evaluation failed",
    }

    # Save reports under `evaluation/report/YYYY-MM-DD/HH-MM-SS`
    out_dir = f"/app/evaluation/report/{started_at.strftime('%Y-%m-%d/%H-%M-%S')}"
    os.makedirs(out_dir, exist_ok=True)

    report_path = f"{out_dir}/report.json"
    with open(report_path, "w") as f:
        json.dump(report, f, indent=2)

    # Human-friendly banner output
    success_str = "YES" if success else "NO"
    duration_str = f"{duration:.2f}s"

    print()
    print("=" * 60)
    print("GITHUB ORG CLIENT EVALUATION")
    print("=" * 60)
    print(f"Run ID: {run_id}")
    print(f"Duration: {duration_str}")
    print(f"Success: {success_str}")
    print(f"Report saved to: {report_path}")
    print("=" * 60)

    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
