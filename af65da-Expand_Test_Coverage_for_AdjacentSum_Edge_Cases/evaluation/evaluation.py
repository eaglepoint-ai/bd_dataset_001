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
    """Parse the Java test file and extract test method names and their contents."""
    with open(test_file_path, 'r') as f:
        content = f.read()
    
    test_methods = {}
    pattern = r'@Test\s+public\s+void\s+(\w+)\s*\(\s*\)\s*\{'
    
    for match in re.finditer(pattern, content):
        method_name = match.group(1)
        start_pos = match.end()
        
        brace_count = 1
        pos = start_pos
        while brace_count > 0 and pos < len(content):
            if content[pos] == '{':
                brace_count += 1
            elif content[pos] == '}':
                brace_count -= 1
            pos += 1
        
        method_body = content[start_pos:pos-1]
        test_methods[method_name] = method_body
    
    return test_methods


def check_requirement_1(tests):
    """REQ-1: Empty and single-element arrays."""
    has_empty_array_test = False
    has_single_element_test = False
    
    for name, body in tests.items():
        name_lower = name.lower()
        
        if 'empty' in name_lower:
            has_empty_array_test = True
        elif re.search(r'int\s*\[\s*\]\s*\w+\s*=\s*\{\s*\}', body):
            has_empty_array_test = True
        
        if 'single' in name_lower:
            has_single_element_test = True
        elif re.search(r'int\s*\[\s*\]\s*\w+\s*=\s*\{\s*-?\d+\s*\}', body):
            if not re.search(r'int\s*\[\s*\]\s*\w+\s*=\s*\{\s*-?\d+\s*,', body):
                has_single_element_test = True
    
    return has_empty_array_test and has_single_element_test


def check_requirement_2(tests):
    """REQ-2: Positive and negative integers (mixed)."""
    has_mixed_positive_negative_test = False
    
    for name, body in tests.items():
        name_lower = name.lower()
        
        if 'mixed' in name_lower and ('positive' in name_lower or 'negative' in name_lower):
            has_mixed_positive_negative_test = True
            break
        
        array_matches = re.findall(r'\{([^}]+)\}', body)
        for arr_content in array_matches:
            has_negative = bool(re.search(r'-\d+', arr_content))
            without_negative = re.sub(r'-\d+', '', arr_content)
            has_positive = bool(re.search(r'\d+', without_negative))
            
            if has_negative and has_positive:
                has_mixed_positive_negative_test = True
                break
        
        if has_mixed_positive_negative_test:
            break
    
    return has_mixed_positive_negative_test


def check_requirement_3(tests):
    """REQ-3: Arrays containing zero values."""
    has_zero_test = False
    
    for name, body in tests.items():
        name_lower = name.lower()
        
        if 'zero' in name_lower:
            has_zero_test = True
            break
        
        if re.search(r'\{\s*0\s*,', body) or re.search(r',\s*0\s*,', body) or re.search(r',\s*0\s*\}', body):
            has_zero_test = True
            break
    
    return has_zero_test


def check_requirement_4(tests):
    """REQ-4: Integer overflow and underflow behavior."""
    has_overflow_test = False
    has_underflow_test = False
    
    for name, body in tests.items():
        name_lower = name.lower()
        
        if 'overflow' in name_lower:
            has_overflow_test = True
        if 'Integer.MAX_VALUE' in body:
            if re.search(r'Integer\.MAX_VALUE\s*,\s*[1-9]', body) or re.search(r'[1-9]\s*,\s*Integer\.MAX_VALUE', body):
                has_overflow_test = True
        
        if 'underflow' in name_lower:
            has_underflow_test = True
        if 'Integer.MIN_VALUE' in body:
            if re.search(r'Integer\.MIN_VALUE\s*,\s*-[1-9]', body) or re.search(r'-[1-9]\s*,\s*Integer\.MIN_VALUE', body):
                has_underflow_test = True
    
    return has_overflow_test and has_underflow_test


def check_requirement_5(tests):
    """REQ-5: Boundary and extreme input values."""
    has_max_value_test = False
    has_min_value_test = False
    
    for name, body in tests.items():
        if 'Integer.MAX_VALUE' in body:
            has_max_value_test = True
        if 'Integer.MIN_VALUE' in body:
            has_min_value_test = True
    
    return has_max_value_test and has_min_value_test


def run_tests(repo_name: str):
    """
    Run meta tests on the repository and return results.
    This analyzes the test file for requirement coverage.
    """
    test_file_path = ROOT / repo_name / 'src' / 'test' / 'AdjacentSumTest.java'
    
    if not test_file_path.exists():
        return {
            "passed": False,
            "return_code": 1,
            "output": f"Test file not found: {test_file_path}"
        }
    
    try:
        tests = parse_test_file(test_file_path)
        
        requirements = [
            ("REQ-1: Empty and single-element arrays", check_requirement_1(tests)),
            ("REQ-2: Positive and negative integers", check_requirement_2(tests)),
            ("REQ-3: Arrays containing zero values", check_requirement_3(tests)),
            ("REQ-4: Integer overflow and underflow", check_requirement_4(tests)),
            ("REQ-5: Boundary and extreme values", check_requirement_5(tests)),
        ]
        
        passed_count = sum(1 for _, passed in requirements if passed)
        all_passed = passed_count == len(requirements)
        
        output_lines = [
            f"Found {len(tests)} test methods",
            f"Test methods: {', '.join(tests.keys())}",
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
    Returns test coverage metrics.
    """
    test_file_path = ROOT / repo_name / 'src' / 'test' / 'AdjacentSumTest.java'
    
    if not test_file_path.exists():
        return {}
    
    try:
        tests = parse_test_file(test_file_path)
        
        requirements_passed = sum([
            1 if check_requirement_1(tests) else 0,
            1 if check_requirement_2(tests) else 0,
            1 if check_requirement_3(tests) else 0,
            1 if check_requirement_4(tests) else 0,
            1 if check_requirement_5(tests) else 0,
        ])
        
        return {
            "test_methods_count": len(tests),
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
    report_dir.mkdir(parents=True, exist_ok=True)
    
    # Write report
    report_path = report_dir / "report.json"
    report_path.write_text(json.dumps(report, indent=2))
    print(f"\nReport written to {report_path}")
    
    return 0 if report["success"] else 1


if __name__ == "__main__":
    sys.exit(main())
