"""
Evaluation script for DOM Extractor
Runs tests on repository_before and repository_after and generates comparison reports
"""

import json
import subprocess
import sys
import uuid
from datetime import datetime
from pathlib import Path
import platform


def run_tests(repo_path: Path, test_path: Path) -> dict:
    """
    Run pytest on a repository and collect results
    
    Args:
        repo_path: Path to repository (before/after)
        test_path: Path to tests directory
        
    Returns:
        Dictionary with test results
    """
    results = {
        "passed": 0,
        "failed": 0,
        "total": 0,
        "tests": {},
        "error": None
    }
    
    # Check if repository has implementation
    dom_extractor = repo_path / "dom_extractor.py"
    if not dom_extractor.exists():
        results["error"] = "No implementation found"
        return results
    
    # Run pytest with JSON report
    env = {
        "PYTHONPATH": str(repo_path),
        **subprocess.os.environ.copy()
    }
    
    try:
        result = subprocess.run(
            [sys.executable, "-m", "pytest", str(test_path), "-v", "--tb=short"],
            capture_output=True,
            text=True,
            env=env,
            timeout=120
        )
        
        # Parse output
        output_lines = result.stdout.split("\n")
        for line in output_lines:
            if "passed" in line or "failed" in line:
                if "passed" in line:
                    parts = line.split()
                    for i, part in enumerate(parts):
                        if part == "passed":
                            results["passed"] = int(parts[i-1])
                        elif part == "failed":
                            results["failed"] = int(parts[i-1])
            
            # Parse individual test results
            if "::" in line and ("PASSED" in line or "FAILED" in line):
                test_name = line.split("::")[1].split()[0] if "::" in line else ""
                status = "PASSED" if "PASSED" in line else "FAILED"
                if test_name:
                    results["tests"][test_name] = status
        
        results["total"] = results["passed"] + results["failed"]
        
    except subprocess.TimeoutExpired:
        results["error"] = "Tests timed out"
    except Exception as e:
        results["error"] = str(e)
    
    return results


def generate_report(before_results: dict, after_results: dict, output_path: Path):
    """
    Generate evaluation report comparing before and after
    
    Args:
        before_results: Test results from repository_before
        after_results: Test results from repository_after
        output_path: Path to save the report
    """
    started_at = datetime.now()
    
    # Create report structure
    report = {
        "run_id": str(uuid.uuid4()),
        "started_at": started_at.isoformat(),
        "finished_at": datetime.now().isoformat(),
        "duration_seconds": (datetime.now() - started_at).total_seconds(),
        "environment": {
            "python_version": platform.python_version(),
            "platform": f"{platform.system()}-{platform.machine()}"
        },
        "before": {
            "tests": before_results["tests"],
            "metrics": {
                "total": before_results["total"],
                "passed": before_results["passed"],
                "failed": before_results["failed"]
            },
            "error": before_results["error"]
        },
        "after": {
            "tests": after_results["tests"],
            "metrics": {
                "total": after_results["total"],
                "passed": after_results["passed"],
                "failed": after_results["failed"]
            },
            "error": after_results["error"]
        },
        "comparison": {
            "tests_fixed": [],
            "tests_broken": [],
            "improvement": 0
        },
        "success": False,
        "error": None
    }
    
    # Calculate comparison
    before_tests = set(before_results["tests"].keys())
    after_tests = set(after_results["tests"].keys())
    
    for test in after_tests:
        before_status = before_results["tests"].get(test, "FAILED")
        after_status = after_results["tests"].get(test, "FAILED")
        
        if before_status == "FAILED" and after_status == "PASSED":
            report["comparison"]["tests_fixed"].append(test)
        elif before_status == "PASSED" and after_status == "FAILED":
            report["comparison"]["tests_broken"].append(test)
    
    # Calculate improvement
    if after_results["total"] > 0:
        before_rate = (before_results["passed"] / max(before_results["total"], 1)) * 100
        after_rate = (after_results["passed"] / after_results["total"]) * 100
        report["comparison"]["improvement"] = round(after_rate - before_rate, 2)
    
    # Determine success
    report["success"] = (
        after_results["passed"] == after_results["total"] and
        after_results["total"] > 0 and
        after_results["error"] is None
    )
    
    # Update duration
    report["finished_at"] = datetime.now().isoformat()
    report["duration_seconds"] = (datetime.now() - started_at).total_seconds()
    
    # Save report
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
    
    return report


def main():
    """Main evaluation function"""
    print("=" * 60)
    print("DOM Extractor Evaluation")
    print("=" * 60)
    
    # Setup paths
    project_root = Path(__file__).parent.parent
    repo_before = project_root / "repository_before"
    repo_after = project_root / "repository_after"
    tests_dir = project_root / "tests"
    
    # Create output directory with timestamp
    now = datetime.now()
    date_str = now.strftime("%Y-%m-%d")
    time_str = now.strftime("%H-%M-%S")
    output_dir = project_root / "evaluation" / date_str / time_str
    output_file = output_dir / "report.json"
    
    print(f"\n📁 Project Root: {project_root}")
    print(f"📄 Output: {output_file}\n")
    
    # Run tests on repository_before
    print("🔍 Evaluating repository_before...")
    before_results = run_tests(repo_before, tests_dir)
    print(f"   ✓ Passed: {before_results['passed']}")
    print(f"   ✗ Failed: {before_results['failed']}")
    if before_results['error']:
        print(f"   ⚠ Error: {before_results['error']}")
    
    # Run tests on repository_after
    print("\n🔍 Evaluating repository_after...")
    after_results = run_tests(repo_after, tests_dir)
    print(f"   ✓ Passed: {after_results['passed']}")
    print(f"   ✗ Failed: {after_results['failed']}")
    if after_results['error']:
        print(f"   ⚠ Error: {after_results['error']}")
    
    # Generate report
    print("\n📊 Generating report...")
    report = generate_report(before_results, after_results, output_file)
    
    print(f"   Report saved to: {output_file}")
    print(f"\n{'=' * 60}")
    print("EVALUATION SUMMARY")
    print("=" * 60)
    print(f"Tests Fixed: {len(report['comparison']['tests_fixed'])}")
    if report['comparison']['tests_fixed']:
        for test in report['comparison']['tests_fixed']:
            print(f"  ✓ {test}")
    
    print(f"\nTests Broken: {len(report['comparison']['tests_broken'])}")
    if report['comparison']['tests_broken']:
        for test in report['comparison']['tests_broken']:
            print(f"  ✗ {test}")
    
    print(f"\nImprovement: {report['comparison']['improvement']}%")
    print(f"Overall Success: {'✓ PASS' if report['success'] else '✗ FAIL'}")
    print("=" * 60)
    
    # Exit with appropriate code
    sys.exit(0 if report['success'] else 1)


if __name__ == "__main__":
    main()
