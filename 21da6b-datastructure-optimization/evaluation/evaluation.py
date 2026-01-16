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

def run_tests(test_file):
    """Run specific test file and return results"""
    try:
        proc = subprocess.run(
            ["python", test_file],
            cwd=ROOT / "tests",
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
            "output": "Test timeout after 120s"
        }
    except Exception as e:
        return {
            "passed": False,
            "return_code": -1,
            "output": f"Test error: {str(e)}"
        }

def run_metrics(test_file):
    """Extract performance metrics from test output"""
    try:
        proc = subprocess.run(
            ["python", test_file],
            cwd=ROOT / "tests",
            capture_output=True,
            text=True,
            timeout=120
        )
        output = proc.stdout + proc.stderr
        
        # Extract timing from output
        metrics = {}
        for line in output.split('\n'):
            if 'performance' in line.lower() and '(' in line and 's)' in line:
                # Extract time like "0.097s" or "1.320s"
                import re
                match = re.search(r'(\d+\.\d+)s\)', line)
                if match:
                    time_val = float(match.group(1)) * 1000  # Convert to ms
                    if 'small' in line.lower():
                        metrics['small_input_time_ms'] = time_val
                    elif 'large' in line.lower() or 'huge' in line.lower():
                        metrics['large_input_time_ms'] = time_val
        
        return metrics
    except:
        return {}

def evaluate(test_file):
    """Evaluate a single repository"""
    tests = run_tests(test_file)
    metrics = run_metrics(test_file)
    return {
        "tests": tests,
        "metrics": metrics
    }

def run_evaluation():
    """Main evaluation function"""
    run_id = str(uuid.uuid4())
    start = datetime.utcnow()
    
    try:
        before = evaluate("test_before.py")
        after = evaluate("test_after.py")
        
        # Determine success
        passed_gate = after["tests"]["passed"]
        
        # Build improvement summary
        if passed_gate and not before["tests"]["passed"]:
            summary = "After implementation passed all tests; before failed"
        elif passed_gate and before["tests"]["passed"]:
            # Compare performance
            before_time = before["metrics"].get("large_input_time_ms", 0)
            after_time = after["metrics"].get("large_input_time_ms", 0)
            if before_time > 0 and after_time > 0:
                improvement = ((before_time - after_time) / before_time) * 100
                summary = f"Both passed; after is {improvement:.1f}% faster on large inputs"
            else:
                summary = "Both implementations passed all tests"
        else:
            summary = "After implementation failed tests"
        
        comparison = {
            "passed_gate": passed_gate,
            "improvement_summary": summary
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
    
    except Exception as e:
        end = datetime.utcnow()
        return {
            "run_id": run_id,
            "started_at": start.isoformat() + "Z",
            "finished_at": end.isoformat() + "Z",
            "duration_seconds": (end - start).total_seconds(),
            "environment": environment_info(),
            "before": None,
            "after": None,
            "comparison": None,
            "success": False,
            "error": str(e)
        }

def main():
    """Main entry point"""
    # Create timestamped directory
    now = datetime.now()
    date_dir = now.strftime("%Y-%m-%d")
    time_dir = now.strftime("%H-%M-%S")
    report_dir = REPORTS / date_dir / time_dir
    report_dir.mkdir(parents=True, exist_ok=True)
    
    # Run evaluation
    report = run_evaluation()
    
    # Write report
    report_path = report_dir / "report.json"
    report_path.write_text(json.dumps(report, indent=2))
    
    print(f"✅ Evaluation complete")
    print(f"📊 Report: {report_path}")
    print(f"🎯 Success: {report['success']}")
    
    return 0 if report["success"] else 1

if __name__ == "__main__":
    sys.exit(main())
