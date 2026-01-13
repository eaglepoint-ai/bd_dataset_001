#!/usr/bin/env python3
import sys
import json
import time
import uuid
import platform
import os
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

def run_tests(context_path=None):
    env = os.environ.copy()
    if context_path:
        env["PYTHONPATH"] = str(context_path) + os.pathsep + env.get("PYTHONPATH", "")
        
    try:
        proc = subprocess.run(
            ["pytest", "tests", "-q"],
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
            "output": "pytest timeout"
        }

def run_metrics(repo_path: Path):
    metrics = {
        "py_file_count": 0,
        "lines_of_code": 0,
        "class_count_approx": 0
    }
    
    if not repo_path.exists():
        return metrics

    try:
        for file_path in repo_path.rglob("*.py"):
            metrics["py_file_count"] += 1
            try:
                content = file_path.read_text(encoding="utf-8", errors="ignore")
                lines = content.splitlines()
                metrics["lines_of_code"] += len(lines)
                # Simple heuristic to count classes
                metrics["class_count_approx"] += sum(1 for line in lines if line.strip().startswith("class "))
            except Exception:
                pass
    except Exception as e:
        metrics["error"] = str(e)
        
    return metrics

def evaluate(repo_name: str):
    repo_path = ROOT / repo_name
    tests = run_tests(repo_path)
    metrics = run_metrics(repo_path)
    return {
        "tests": tests,
        "metrics": metrics
    }

def run_evaluation():
    run_id = str(uuid.uuid4())
    start = datetime.utcnow()
    
    before = evaluate("repository_before")
    after = evaluate("repository_after")
    
    comparison = {
        "passed_gate": after["tests"]["passed"],
        "improvement_summary": "After implementation passed correctness checks"
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
    report = run_evaluation()
    
    # Generate report path: evaluation/reports/YYYY-MM-DD/HH-MM-SS/report.json
    now = datetime.strptime(report["started_at"].replace("Z", ""), "%Y-%m-%dT%H:%M:%S.%f")
    date_str = now.strftime("%Y-%m-%d")
    time_str = now.strftime("%H-%M-%S")
    
    report_dir = REPORTS / date_str / time_str
    report_dir.mkdir(parents=True, exist_ok=True)
    
    path = report_dir / "report.json"
    path.write_text(json.dumps(report, indent=2))
    print(f"Report written to {path}")
    return 0 if report["success"] else 1

if __name__ == "__main__":
    sys.exit(main())