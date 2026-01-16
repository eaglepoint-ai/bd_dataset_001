#!/usr/bin/env python3
"""
Evaluation script for task scheduler.
Runs tests on both before and after versions and generates a comparative report.
"""

import json
import os
import sys
import subprocess
from datetime import datetime
import tempfile
import shutil

def get_project_root():
    """Get the project root directory"""
    return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def create_report_directory():
    """Create timestamped report directory"""
    project_root = get_project_root()
    reports_dir = os.path.join(project_root, "evaluation", "reports")
    
    # Create directory with current timestamp
    now = datetime.now()
    date_dir = now.strftime("%Y-%m-%d")
    time_dir = now.strftime("%H-%M-%S")
    
    report_path = os.path.join(reports_dir, date_dir, time_dir)
    os.makedirs(report_path, exist_ok=True)
    
    return report_path

def run_tests_for_version(version_path, version_name, output_file):
    """Run tests for a specific version and save results"""
    project_root = get_project_root()
    test_script = os.path.join(project_root, "tests", "test_scheduler.py")
    scheduler_path = os.path.join(version_path, "scheduler.py")
    
    if not os.path.exists(scheduler_path):
        print(f"Warning: Scheduler not found at {scheduler_path}")
        return None
    
    try:
        result = subprocess.run(
            [sys.executable, test_script, scheduler_path, version_name, output_file],
            capture_output=True,
            text=True,
            timeout=30
        )
        
        # Load the results
        if os.path.exists(output_file):
            with open(output_file, "r") as f:
                return json.load(f)
        else:
            return {
                "version": version_name,
                "error": "No output file generated",
                "stdout": result.stdout,
                "stderr": result.stderr
            }
    except subprocess.TimeoutExpired:
        return {
            "version": version_name,
            "error": "Tests timed out (possible infinite loop)",
            "tests": []
        }
    except Exception as e:
        return {
            "version": version_name,
            "error": str(e),
            "tests": []
        }

def analyze_improvements(before_results, after_results):
    """Analyze improvements between before and after versions"""
    improvements = []
    regressions = []
    
    # Create dict for easy lookup
    before_tests = {t["test_name"]: t for t in before_results.get("tests", [])}
    after_tests = {t["test_name"]: t for t in after_results.get("tests", [])}
    
    for test_name in after_tests:
        after_test = after_tests[test_name]
        before_test = before_tests.get(test_name, {})
        
        before_passed = before_test.get("passed", False)
        after_passed = after_test.get("passed", False)
        
        if not before_passed and after_passed:
            improvements.append({
                "test_name": test_name,
                "description": after_test.get("description", ""),
                "before": "Failed",
                "after": "Passed"
            })
        elif before_passed and not after_passed:
            regressions.append({
                "test_name": test_name,
                "description": after_test.get("description", ""),
                "before": "Passed",
                "after": "Failed"
            })
    
    return improvements, regressions

def generate_report(before_results, after_results, report_path):
    """Generate comprehensive evaluation report"""
    
    # Analyze improvements
    improvements, regressions = analyze_improvements(before_results, after_results)
    
    # Calculate metrics
    before_passed = before_results.get("summary", {}).get("passed", 0)
    before_total = before_results.get("summary", {}).get("total", 0)
    after_passed = after_results.get("summary", {}).get("passed", 0)
    after_total = after_results.get("summary", {}).get("total", 0)
    
    # Determine success: after tests should all pass
    all_after_passed = after_passed == after_total and after_total > 0
    
    # Create report data
    report = {
        "timestamp": datetime.now().isoformat(),
        "success": all_after_passed,
        "error": None if all_after_passed else "Some tests failed or evaluation incomplete",
        "before_version": {
            "name": "repository_before",
            "tests_passed": before_passed,
            "tests_total": before_total,
            "pass_rate": before_results.get("summary", {}).get("percentage", 0),
            "tests": before_results.get("tests", [])
        },
        "after_version": {
            "name": "repository_after",
            "tests_passed": after_passed,
            "tests_total": after_total,
            "pass_rate": after_results.get("summary", {}).get("percentage", 0),
            "tests": after_results.get("tests", [])
        },
        "analysis": {
            "improvements": improvements,
            "regressions": regressions,
            "tests_fixed": len(improvements),
            "tests_broken": len(regressions),
            "net_improvement": len(improvements) - len(regressions),
            "pass_rate_change": after_results.get("summary", {}).get("percentage", 0) - 
                                before_results.get("summary", {}).get("percentage", 0)
        },
        "issues_fixed": [
            "File path handling - uses path relative to script location",
            "Null value handling - properly handles None values from JSON",
            "Infinite recursion - fixed not_same_day_as constraint",
            "Multi-day scheduling - proper day tracking logic",
            "Input validation - validates time constraints and dependencies",
            "Error handling - comprehensive error detection and reporting",
            "Global state - removed global variables, better encapsulation",
            "Documentation - added comments explaining logic"
        ]
    }
    
    # Save JSON report
    json_file = os.path.join(report_path, "report.json")
    with open(json_file, "w") as f:
        json.dump(report, f, indent=2)
    
    # Generate human-readable report
    txt_file = os.path.join(report_path, "report.txt")
    with open(txt_file, "w") as f:
        f.write("="*80 + "\n")
        f.write("TASK SCHEDULER EVALUATION REPORT\n")
        f.write("="*80 + "\n\n")
        f.write(f"Generated: {report['timestamp']}\n\n")
        
        f.write("-"*80 + "\n")
        f.write("SUMMARY\n")
        f.write("-"*80 + "\n\n")
        
        f.write(f"Before Version (repository_before):\n")
        f.write(f"  Tests Passed: {before_passed}/{before_total} ({before_results.get('summary', {}).get('percentage', 0):.1f}%)\n\n")
        
        f.write(f"After Version (repository_after):\n")
        f.write(f"  Tests Passed: {after_passed}/{after_total} ({after_results.get('summary', {}).get('percentage', 0):.1f}%)\n\n")
        
        f.write(f"Net Improvement: {report['analysis']['net_improvement']} tests fixed\n")
        f.write(f"Pass Rate Change: {report['analysis']['pass_rate_change']:+.1f}%\n\n")
        
        if improvements:
            f.write("-"*80 + "\n")
            f.write("IMPROVEMENTS\n")
            f.write("-"*80 + "\n\n")
            for imp in improvements:
                f.write(f"✓ {imp['test_name']}\n")
                f.write(f"  {imp['description']}\n")
                f.write(f"  Status: {imp['before']} → {imp['after']}\n\n")
        
        if regressions:
            f.write("-"*80 + "\n")
            f.write("REGRESSIONS\n")
            f.write("-"*80 + "\n\n")
            for reg in regressions:
                f.write(f"✗ {reg['test_name']}\n")
                f.write(f"  {reg['description']}\n")
                f.write(f"  Status: {reg['before']} → {reg['after']}\n\n")
        
        f.write("-"*80 + "\n")
        f.write("ISSUES FIXED\n")
        f.write("-"*80 + "\n\n")
        for i, issue in enumerate(report["issues_fixed"], 1):
            f.write(f"{i}. {issue}\n")
        
        f.write("\n" + "-"*80 + "\n")
        f.write("DETAILED TEST RESULTS\n")
        f.write("-"*80 + "\n\n")
        
        f.write("BEFORE VERSION:\n\n")
        for test in before_results.get("tests", []):
            status = "PASS" if test.get("passed", False) else "FAIL"
            f.write(f"  [{status}] {test['test_name']}\n")
            if not test.get("passed", False) and "returncode" in test:
                f.write(f"        Return code: {test['returncode']}\n")
        
        f.write("\nAFTER VERSION:\n\n")
        for test in after_results.get("tests", []):
            status = "PASS" if test.get("passed", False) else "FAIL"
            f.write(f"  [{status}] {test['test_name']}\n")
            if not test.get("passed", False) and "returncode" in test:
                f.write(f"        Return code: {test['returncode']}\n")
        
        f.write("\n" + "="*80 + "\n")
    
    return json_file, txt_file

def main():
    """Main evaluation function"""
    print("="*80)
    print("Task Scheduler Evaluation")
    print("="*80)
    print()
    
    project_root = get_project_root()
    
    # Create report directory
    report_path = create_report_directory()
    print(f"Report directory: {report_path}\n")
    
    # Test before version
    print("Running tests on repository_before...")
    before_path = os.path.join(project_root, "repository_before")
    before_output = os.path.join(report_path, "before_results.json")
    before_results = run_tests_for_version(before_path, "repository_before", before_output)
    
    if before_results:
        before_passed = before_results.get("summary", {}).get("passed", 0)
        before_total = before_results.get("summary", {}).get("total", 0)
        print(f"  Results: {before_passed}/{before_total} tests passed\n")
    else:
        print("  Error running tests\n")
        before_results = {"version": "repository_before", "tests": [], "summary": {"passed": 0, "total": 0, "percentage": 0}}
    
    # Test after version
    print("Running tests on repository_after...")
    after_path = os.path.join(project_root, "repository_after")
    after_output = os.path.join(report_path, "after_results.json")
    after_results = run_tests_for_version(after_path, "repository_after", after_output)
    
    if after_results:
        after_passed = after_results.get("summary", {}).get("passed", 0)
        after_total = after_results.get("summary", {}).get("total", 0)
        print(f"  Results: {after_passed}/{after_total} tests passed\n")
    else:
        print("  Error running tests\n")
        after_results = {"version": "repository_after", "tests": [], "summary": {"passed": 0, "total": 0, "percentage": 0}}
    
    # Generate report
    print("Generating evaluation report...")
    json_file, txt_file = generate_report(before_results, after_results, report_path)
    
    print(f"\n✓ Report generated successfully!")
    print(f"  JSON: {json_file}")
    print(f"  Text: {txt_file}")
    
    # Print summary
    print("\n" + "="*80)
    print("SUMMARY")
    print("="*80)
    
    with open(json_file, "r") as f:
        report = json.load(f)
    
    print(f"\nBefore: {report['before_version']['tests_passed']}/{report['before_version']['tests_total']} tests passed")
    print(f"After:  {report['after_version']['tests_passed']}/{report['after_version']['tests_total']} tests passed")
    print(f"\nNet Improvement: {report['analysis']['net_improvement']} tests")
    print(f"Pass Rate Change: {report['analysis']['pass_rate_change']:+.1f}%")
    
    if report['analysis']['improvements']:
        print(f"\n✓ {len(report['analysis']['improvements'])} tests fixed")
    
    if report['analysis']['regressions']:
        print(f"✗ {len(report['analysis']['regressions'])} tests regressed")
    
    print("\n" + "="*80)
    
    # Return 0 only if after tests all passed
    return 0 if report.get('success', False) else 1

if __name__ == "__main__":
    sys.exit(main())
