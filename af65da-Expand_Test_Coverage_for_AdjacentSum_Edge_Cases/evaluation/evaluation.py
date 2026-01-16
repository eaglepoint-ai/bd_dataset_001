#!/usr/bin/env python3
"""
Evaluation script for AdjacentSum test suite coverage.

This script evaluates the test coverage for both repository_before and repository_after,
comparing them against the 5 required test coverage criteria.

Requirements tested:
1. Empty and single-element arrays
2. Positive and negative integers (mixed)
3. Arrays containing zero values
4. Integer overflow and underflow behavior
5. Boundary and extreme input values
"""

import sys
import json
import time
import uuid
import platform
import subprocess
import re
from pathlib import Path
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parent.parent
REPORTS = ROOT / "evaluation" / "reports"


def environment_info():
    """Collect environment information."""
    return {
        "python_version": platform.python_version(),
        "platform": platform.platform()
    }


def parse_test_file(test_file_path):
    """
    Parse the Java test file and extract @Test method names.
    
    Uses the same naming convention approach as MetaTest.java for consistency.
    Only extracts method names (not bodies) since we use naming conventions
    to determine requirement coverage.
    """
    with open(test_file_path, 'r') as f:
        content = f.read()
    
    # Extract all @Test annotated method names
    pattern = r'@Test\s+public\s+void\s+(\w+)\s*\(\s*\)'
    test_methods = re.findall(pattern, content)
    
    return test_methods


def check_requirement_1(test_methods):
    """
    REQ-1: Empty and single-element arrays.
    
    Uses naming convention: looks for 'empty' AND 'single' in method names.
    Matches MetaTest.java approach.
    """
    has_empty = any('empty' in name.lower() for name in test_methods)
    has_single = any('single' in name.lower() for name in test_methods)
    
    return has_empty and has_single


def check_requirement_2(test_methods):
    """
    REQ-2: Mixed positive and negative integers.
    
    Uses naming convention: looks for 'mixed' in method names.
    Matches MetaTest.java approach.
    """
    return any('mixed' in name.lower() for name in test_methods)


def check_requirement_3(test_methods):
    """
    REQ-3: Arrays containing zero values.
    
    Uses naming convention: looks for 'zero' in method names.
    Matches MetaTest.java approach.
    """
    return any('zero' in name.lower() for name in test_methods)


def check_requirement_4(test_methods):
    """
    REQ-4: Integer overflow and underflow behavior.
    
    Uses naming convention: looks for 'overflow' AND 'underflow' in method names.
    Matches MetaTest.java approach.
    """
    has_overflow = any('overflow' in name.lower() for name in test_methods)
    has_underflow = any('underflow' in name.lower() for name in test_methods)
    
    return has_overflow and has_underflow


def check_requirement_5(test_methods):
    """
    REQ-5: Boundary and extreme input values.
    
    Uses naming convention: looks for 'max' AND 'min' in method names.
    Matches MetaTest.java approach.
    """
    has_max = any('max' in name.lower() for name in test_methods)
    has_min = any('min' in name.lower() for name in test_methods)
    
    return has_max and has_min


def run_tests(repo_name: str):
    """
    Run meta tests on the repository and return results.
    
    Analyzes test method names for requirement coverage using
    the same naming convention approach as MetaTest.java.
    """
    test_file_path = ROOT / repo_name / 'src' / 'test' / 'AdjacentSumTest.java'
    
    if not test_file_path.exists():
        return {
            "passed": False,
            "return_code": 1,
            "output": f"Test file not found: {test_file_path}"
        }
    
    try:
        test_methods = parse_test_file(test_file_path)
        
        requirements = [
            ("REQ-1: Empty and single-element arrays", check_requirement_1(test_methods)),
            ("REQ-2: Positive and negative integers", check_requirement_2(test_methods)),
            ("REQ-3: Arrays containing zero values", check_requirement_3(test_methods)),
            ("REQ-4: Integer overflow and underflow", check_requirement_4(test_methods)),
            ("REQ-5: Boundary and extreme values", check_requirement_5(test_methods)),
        ]
        
        passed_count = sum(1 for _, passed in requirements if passed)
        all_passed = passed_count == len(requirements)
        
        output_lines = [
            f"Found {len(test_methods)} test methods",
            f"Test methods: {', '.join(test_methods)}",
            "",
            "Requirement Coverage:",
        ]
        
        for req_name, passed in requirements:
            status = "PASS" if passed else "FAIL"
            output_lines.append(f"  {req_name}: {status}")
        
        output_lines.append("")
        output_lines.append(f"Total: {passed_count}/{len(requirements)} requirements covered")
        
        return {
            "passed": all_passed,
            "return_code": 0 if all_passed else 1,
            "output": "\n".join(output_lines)
        }
        
    except Exception as e:
        return {
            "passed": False,
            "return_code": 1,
            "output": f"Error analyzing test file: {str(e)}"
        }


def run_metrics(repo_name: str):
    """
    Collect metrics for the repository.
    
    Returns test coverage metrics using naming convention approach.
    """
    test_file_path = ROOT / repo_name / 'src' / 'test' / 'AdjacentSumTest.java'
    
    if not test_file_path.exists():
        return {}
    
    try:
        test_methods = parse_test_file(test_file_path)
        
        requirements_passed = sum([
            1 if check_requirement_1(test_methods) else 0,
            1 if check_requirement_2(test_methods) else 0,
            1 if check_requirement_3(test_methods) else 0,
            1 if check_requirement_4(test_methods) else 0,
            1 if check_requirement_5(test_methods) else 0,
        ])
        
        return {
            "test_methods_count": len(test_methods),
            "requirements_covered": requirements_passed,
            "requirements_total": 5,
            "coverage_percentage": (requirements_passed / 5) * 100
        }
        
    except Exception:
        return {}


def evaluate(repo_name: str):
    """Evaluate a single repository."""
    tests = run_tests(repo_name)
    metrics = run_metrics(repo_name)
    return {
        "tests": tests,
        "metrics": metrics
    }


def run_evaluation():
    """
    Run the full evaluation comparing repository_before and repository_after.
    Returns the complete evaluation report.
    """
    run_id = str(uuid.uuid4())
    start = datetime.now(timezone.utc)
    
    try:
        before = evaluate("repository_before")
        after = evaluate("repository_after")
        
        # Success rule: after.tests.passed == true
        passed_gate = after["tests"]["passed"]
        
        # Generate improvement summary
        before_coverage = before["metrics"].get("requirements_covered", 0)
        after_coverage = after["metrics"].get("requirements_covered", 0)
        
        if passed_gate:
            improvement_summary = f"After implementation passed all requirements ({after_coverage}/5 covered vs {before_coverage}/5 before)"
        else:
            improvement_summary = f"After implementation incomplete ({after_coverage}/5 requirements covered vs {before_coverage}/5 before)"
        
        comparison = {
            "passed_gate": passed_gate,
            "improvement_summary": improvement_summary
        }
        
        end = datetime.now(timezone.utc)
        
        return {
            "run_id": run_id,
            "started_at": start.isoformat().replace("+00:00", "Z"),
            "finished_at": end.isoformat().replace("+00:00", "Z"),
            "duration_seconds": (end - start).total_seconds(),
            "environment": environment_info(),
            "before": before,
            "after": after,
            "comparison": comparison,
            "success": passed_gate,
            "error": None
        }
        
    except Exception as e:
        end = datetime.now(timezone.utc)
        return {
            "run_id": run_id,
            "started_at": start.isoformat().replace("+00:00", "Z"),
            "finished_at": end.isoformat().replace("+00:00", "Z"),
            "duration_seconds": (end - start).total_seconds(),
            "environment": environment_info(),
            "before": None,
            "after": None,
            "comparison": None,
            "success": False,
            "error": str(e)
        }


def main():
    """Main entry point."""
    print("Running evaluation...")
    print("=" * 60)
    
    report = run_evaluation()
    
    # Print summary
    print(f"\nRun ID: {report['run_id']}")
    print(f"Duration: {report['duration_seconds']:.2f} seconds")
    print("")
    
    if report["error"]:
        print(f"ERROR: {report['error']}")
    else:
        print("BEFORE (repository_before):")
        print(f"  Tests passed: {report['before']['tests']['passed']}")
        print(f"  Requirements covered: {report['before']['metrics'].get('requirements_covered', 'N/A')}/5")
        print("")
        print("AFTER (repository_after):")
        print(f"  Tests passed: {report['after']['tests']['passed']}")
        print(f"  Requirements covered: {report['after']['metrics'].get('requirements_covered', 'N/A')}/5")
        print("")
        print("COMPARISON:")
        print(f"  Passed gate: {report['comparison']['passed_gate']}")
        print(f"  Summary: {report['comparison']['improvement_summary']}")
    
    print("")
    print("=" * 60)
    print(f"SUCCESS: {report['success']}")
    print("=" * 60)
    
    # Create report directory with format: reports/YYYY-MM-DD/HH-MM-SS/
    now = datetime.now(timezone.utc)
    date_dir = now.strftime("%Y-%m-%d")
    time_dir = now.strftime("%H-%M-%S")
    report_dir = REPORTS / date_dir / time_dir
    
    try:
        # Ensure the base reports directory exists first
        REPORTS.mkdir(parents=True, exist_ok=True)
        report_dir.mkdir(parents=True, exist_ok=True)
        
        # Write report
        report_path = report_dir / "report.json"
        report_path.write_text(json.dumps(report, indent=2))
        print(f"\nReport written to {report_path}")
    except PermissionError:
        # If we can't write to the mounted volume, print the report to stdout instead
        print("\nWARNING: Could not write report to file (permission denied)")
        print("Report JSON output:")
        print(json.dumps(report, indent=2))
    except Exception as e:
        print(f"\nWARNING: Could not write report to file: {e}")
        print("Report JSON output:")
        print(json.dumps(report, indent=2))
    
    return 0 if report["success"] else 1


if __name__ == "__main__":
    sys.exit(main())
