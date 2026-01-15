#!/usr/bin/env python3
"""
MoodMorph Evaluation Script
Compares repository_before (not implemented) vs repository_after (complete solution)
Follows evaluation standard from PDF

Success criteria: repository_after tests pass
"""

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
    """Collect environment metadata"""
    return {
        "python_version": platform.python_version(),
        "platform": platform.platform(),
        "node_version": get_node_version(),
    }


def get_node_version():
    """Get Node.js version"""
    try:
        result = subprocess.run(
            ["node", "--version"],
            capture_output=True,
            text=True,
            timeout=5
        )
        return result.stdout.strip() if result.returncode == 0 else "unknown"
    except Exception:
        return "unknown"


def run_tests(repo_name: str):
    """
    Run npm tests for given repository
    
    Args:
        repo_name: "repository_before" or "repository_after"
    
    Returns:
        dict with passed, return_code, and output
    """
    repo_path = ROOT / repo_name
    
    if not repo_path.exists():
        return {
            "passed": False,
            "return_code": -1,
            "output": f"Repository {repo_name} not found"
        }
    
    try:
        # Install dependencies first
        install = subprocess.run(
            ["npm", "install"],
            cwd=repo_path,
            capture_output=True,
            text=True,
            timeout=300
        )
        
        if install.returncode != 0:
            return {
                "passed": False,
                "return_code": install.returncode,
                "output": f"npm install failed:\n{install.stderr[:2000]}"
            }
        
        # Run tests
        proc = subprocess.run(
            ["npm", "test", "--", "--passWithNoTests"],
            cwd=repo_path,
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
        return {
            "passed": False,
            "return_code": -1,
            "output": "Test execution timeout (120s exceeded)"
        }
    except Exception as e:
        return {
            "passed": False,
            "return_code": -1,
            "output": f"Error running tests: {str(e)}"
        }


def run_metrics(repo_name: str):
    """
    Optional metrics collection
    
    For MoodMorph, metrics are minimal since tests are primary indicator
    """
    return {
        "implementation_complete": repo_name == "repository_after",
        "repo_name": repo_name
    }


def evaluate(repo_name: str):
    """Evaluate a single repository"""
    tests = run_tests(repo_name)
    metrics = run_metrics(repo_name)
    
    return {
        "tests": tests,
        "metrics": metrics
    }


def run_evaluation():
    """
    Main evaluation function
    Returns complete evaluation report dict
    """
    run_id = str(uuid.uuid4())
    start = datetime.utcnow()
    
    print("🔍 Evaluating repository_before...")
    before = evaluate("repository_before")
    
    print("🔍 Evaluating repository_after...")
    after = evaluate("repository_after")
    
    # Success criteria: after tests pass
    passed_gate = after["tests"]["passed"]
    
    if passed_gate:
        summary = "✅ repository_after passes all tests (all requirements validated)"
    else:
        summary = "❌ repository_after failed tests"
    
    comparison = {
        "passed_gate": passed_gate,
        "improvement_summary": summary,
        "before_passed": before["tests"]["passed"],
        "after_passed": after["tests"]["passed"]
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
        "success": passed_gate,
        "error": None
    }


def main():
    """
    Main entry point
    Returns 0 if successful, 1 otherwise
    """
    try:
        print("=" * 60)
        print("MoodMorph Evaluation")
        print("=" * 60)
        
        REPORTS.mkdir(parents=True, exist_ok=True)
        
        report = run_evaluation()
        
        # Write report.json in root (for Aquila/evaluation systems)
        root_report = ROOT / "report.json"
        root_report.write_text(json.dumps(report, indent=2))
        
        # Write latest.json in reports directory
        latest_path = REPORTS / "latest.json"
        latest_path.write_text(json.dumps(report, indent=2))
        
        # Also write timestamped version
        now = datetime.now()
        date_str = now.strftime("%Y-%m-%d")
        time_str = now.strftime("%H-%M-%S")
        timestamped_dir = REPORTS / date_str / time_str
        timestamped_dir.mkdir(parents=True, exist_ok=True)
        timestamped_path = timestamped_dir / "report.json"
        timestamped_path.write_text(json.dumps(report, indent=2))
        
        print("\n" + "=" * 60)
        print("EVALUATION RESULTS")
        print("=" * 60)
        print(f"✅ Report written to: {root_report}")
        print(f"✅ Report written to: {latest_path}")
        print(f"📊 Timestamped: {timestamped_path}")
        print(f"\nSuccess: {report['success']}")
        print(f"Summary: {report['comparison']['improvement_summary']}")
        print("\nBefore:")
        print(f"  Tests Passed: {report['before']['tests']['passed']}")
        print(f"  Return Code: {report['before']['tests']['return_code']}")
        print("\nAfter:")
        print(f"  Tests Passed: {report['after']['tests']['passed']}")
        print(f"  Return Code: {report['after']['tests']['return_code']}")
        print("=" * 60)
        
        return 0 if report["success"] else 1
        
    except Exception as e:
        print(f"\n❌ EVALUATION ERROR: {e}", file=sys.stderr)
        
        error_report = {
            "run_id": str(uuid.uuid4()),
            "started_at": datetime.utcnow().isoformat() + "Z",
            "finished_at": datetime.utcnow().isoformat() + "Z",
            "duration_seconds": 0,
            "environment": environment_info(),
            "before": None,
            "after": None,
            "comparison": None,
            "success": False,
            "error": str(e)
        }
        
        try:
            REPORTS.mkdir(parents=True, exist_ok=True)
            # Write error report in root (for Aquila)
            root_error = ROOT / "report.json"
            root_error.write_text(json.dumps(error_report, indent=2))
            # Also write in reports directory
            error_path = REPORTS / "latest.json"
            error_path.write_text(json.dumps(error_report, indent=2))
        except Exception:
            pass
        
        return 1


if __name__ == "__main__":
    sys.exit(main())
