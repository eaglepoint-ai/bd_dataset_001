#!/usr/bin/env python3
"""
Evaluation script for Markdown Blog SPA task.
Runs tests on both repository_before and repository_after,
then generates a comprehensive report.
"""
import json
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, Any

def get_environment_info() -> Dict[str, Any]:
    """Collect environment information for the report."""
    import platform
    import sys
    
    return {
        "python_version": sys.version,
        "platform": platform.platform(),
        "architecture": platform.machine(),
    }

def run_pytest(repo_path: Path, repo_name: str) -> Dict[str, Any]:
    """Run pytest on the specified repository and return results."""
    import os
    
    print(f"\n{'=' * 60}")
    print(f"Testing {repo_name}")
    print(f"{'=' * 60}")
    
    # Change to project root for pytest
    project_root = Path(__file__).parent.parent
    tests_dir = project_root / "tests"
    
    # Set environment variable to indicate which repo we're testing
    env = dict(os.environ)
    env['TEST_REPO'] = str(repo_path)
    
    try:
        result = subprocess.run(
            [sys.executable, "-m", "pytest", "-v", "--tb=short", str(tests_dir)],
            capture_output=True,
            text=True,
            timeout=300,  # 5 minute timeout
            env=env
        )
        
        output = result.stdout + result.stderr
        
        # Parse pytest output to extract test results
        passed = output.count(" PASSED")
        failed = output.count(" FAILED")
        skipped = output.count(" SKIPPED")
        total = passed + failed + skipped
        
        success = result.returncode == 0 and failed == 0
        
        return {
            "success": success,
            "return_code": result.returncode,
            "summary": {
                "total": total,
                "passed": passed,
                "failed": failed,
                "skipped": skipped
            },
            "output": output
        }
    except subprocess.TimeoutExpired:
        return {
            "success": False,
            "return_code": -1,
            "summary": {
                "total": 0,
                "passed": 0,
                "failed": 0,
                "skipped": 0
            },
            "output": "Test execution timed out after 5 minutes",
            "error": "timeout"
        }
    except Exception as e:
        return {
            "success": False,
            "return_code": -1,
            "summary": {
                "total": 0,
                "passed": 0,
                "failed": 0,
                "skipped": 0
            },
            "output": str(e),
            "error": str(type(e).__name__)
        }

def generate_report(
    before_results: Dict[str, Any],
    after_results: Dict[str, Any],
    environment: Dict[str, Any],
    output_path: Path
) -> Dict[str, Any]:
    """Generate evaluation report."""
    run_id = datetime.now().strftime("%Y%m%d-%H%M%S")
    started_at = datetime.now().isoformat()
    
    comparison = {
        "before_tests_passed": before_results.get("success", False),
        "after_tests_passed": after_results.get("success", False),
        "before_total": before_results.get("summary", {}).get("total", 0),
        "before_passed": before_results.get("summary", {}).get("passed", 0),
        "before_failed": before_results.get("summary", {}).get("failed", 0),
        "after_total": after_results.get("summary", {}).get("total", 0),
        "after_passed": after_results.get("summary", {}).get("passed", 0),
        "after_failed": after_results.get("summary", {}).get("failed", 0),
    }
    
    # Overall success: after should pass all tests
    overall_success = after_results.get("success", False)
    
    finished_at = datetime.now().isoformat()
    duration = (datetime.fromisoformat(finished_at) - datetime.fromisoformat(started_at)).total_seconds()
    
    report = {
        "run_id": run_id,
        "started_at": started_at,
        "finished_at": finished_at,
        "duration_seconds": duration,
        "environment": environment,
        "before": {
            "tests": before_results.get("summary", {}),
            "success": before_results.get("success", False),
            "return_code": before_results.get("return_code", -1)
        },
        "after": {
            "tests": after_results.get("summary", {}),
            "success": after_results.get("success", False),
            "return_code": after_results.get("return_code", -1)
        },
        "comparison": comparison,
        "success": overall_success,
        "error": None
    }
    
    # Add error info if present
    if "error" in before_results:
        report["before"]["error"] = before_results["error"]
    if "error" in after_results:
        report["after"]["error"] = after_results["error"]
        report["error"] = after_results["error"]
    
    # Save report
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w") as f:
        json.dump(report, f, indent=2)
    
    return report

def main():
    """Main evaluation function."""
    import os
    import argparse
    
    parser = argparse.ArgumentParser(description="Evaluate Markdown Blog SPA implementation")
    parser.add_argument(
        "--output",
        type=str,
        help="Custom output path for report.json (default: evaluation/reports/YYYY-MM-DD/HH-MM-SS/report.json)"
    )
    args = parser.parse_args()
    
    project_root = Path(__file__).parent.parent
    repo_before = project_root / "repository_before"
    repo_after = project_root / "repository_after"
    
    # Determine output path
    if args.output:
        output_path = Path(args.output)
    else:
        now = datetime.now()
        date_dir = now.strftime("%Y-%m-%d")
        time_dir = now.strftime("%H-%M-%S")
        output_path = project_root / "evaluation" / "reports" / date_dir / time_dir / "report.json"
    
    print(f"\n{'=' * 60}")
    print("MARKDOWN BLOG SPA EVALUATION")
    print(f"{'=' * 60}")
    print(f"Project root: {project_root}")
    print(f"Report will be saved to: {output_path}")
    
    # Collect environment info
    environment = get_environment_info()
    
    # Run tests on repository_before
    before_results = run_pytest(repo_before, "repository_before")
    
    # Run tests on repository_after
    after_results = run_pytest(repo_after, "repository_after")
    
    # Generate report
    report = generate_report(before_results, after_results, environment, output_path)
    
    # Print summary
    print(f"\n{'=' * 60}")
    print("EVALUATION SUMMARY")
    print(f"{'=' * 60}")
    
    print(f"\nBefore Implementation (repository_before):")
    print(f"  Overall: {'✅ PASSED' if report['before']['success'] else '❌ FAILED'}")
    print(f"  Tests: {report['comparison']['before_passed']}/{report['comparison']['before_total']} passed")
    if report['comparison']['before_failed'] > 0:
        print(f"  Failed: {report['comparison']['before_failed']}")
    
    print(f"\nAfter Implementation (repository_after):")
    print(f"  Overall: {'✅ PASSED' if report['after']['success'] else '❌ FAILED'}")
    print(f"  Tests: {report['comparison']['after_passed']}/{report['comparison']['after_total']} passed")
    if report['comparison']['after_failed'] > 0:
        print(f"  Failed: {report['comparison']['after_failed']}")
    
    print(f"\n{'=' * 60}")
    print(f"Overall Result: {'✅ SUCCESS' if report['success'] else '❌ FAILURE'}")
    print(f"{'=' * 60}")
    print(f"\nReport saved to: {output_path}")
    
    return 0 if report['success'] else 1

if __name__ == "__main__":
    sys.exit(main())
