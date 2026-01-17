#!/usr/bin/env python3
import os
import sys
import json
import time
import subprocess
import re
import platform
import uuid
from datetime import datetime

# --- CONFIGURATION ---

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

# 2. Determine the Project Root
# If script is in /app/evaluation/, we need to go up to /app/
if os.path.basename(SCRIPT_DIR) == "evaluation":
    ROOT_DIR = os.path.dirname(SCRIPT_DIR)
else:
    ROOT_DIR = SCRIPT_DIR

# 3. Set output directory
EVALUATION_DIR = SCRIPT_DIR  # Save report in the same folder as this script

# Define the test suites to run
TARGETS = {
    "unit_tests": {
        "label": "Functional Unit Tests",
        "file_path": "repository_after/test_message_scraper.py",
        "description": "Verifies that the scraping logic works (happy paths, error handling, CSV writing)."
    },
    "meta_tests": {
        "label": "Requirements Coverage",
        "file_path": "tests/test_repository_after.py",
        "description": "Static analysis to ensure all 15 specific requirements are covered by tests."
    }
}

# --- HELPER FUNCTIONS ---

def get_env_info():
    """Captures environment details for the report."""
    return {
        "python_version": sys.version.split()[0],
        "platform": platform.platform(),
        "architecture": platform.machine(),
        "hostname": platform.node(),
        "timestamp": datetime.utcnow().isoformat()
    }

def parse_pytest_output(output):
    """
    Parses the verbose text output from pytest to extract individual test results.
    """
    results = []
    lines = output.splitlines()

    # Regex to capture: tests/file.py::test_name STATUS
    # Example: repository_after/test_message_scraper.py::test_main_execution PASSED
    test_pattern = re.compile(r"^(.+?)::(.+?)\s+(PASSED|FAILED|ERROR|SKIPPED)")

    passed_count = 0
    failed_count = 0

    for line in lines:
        match = test_pattern.search(line)
        if match:
            # file_name = match.group(1) # Unused
            test_name = match.group(2)
            status = match.group(3)

            if status == "PASSED":
                passed_count += 1
            else:
                failed_count += 1

            results.append({
                "test": test_name,
                "status": status
            })

    return {
        "tests": results,
        "summary": {
            "total": passed_count + failed_count,
            "passed": passed_count,
            "failed": failed_count
        }
    }

def run_test_suite(key, config):
    """
    Runs a specific pytest file and captures the output.
    """
    print(f"\n▶ Running: {config['label']}")
    print(f"  File: {config['file_path']}")

    # Check if file exists relative to ROOT_DIR before running
    full_path = os.path.join(ROOT_DIR, config['file_path'])
    if not os.path.exists(full_path):
        print(f"  ⚠️  FILE NOT FOUND: {full_path}")
        return {
            "success": False,
            "error": "File not found",
            "summary": {"total": 0, "passed": 0, "failed": 0}
        }

    start_time = time.time()

    # Construct command: pytest -v {file_path}
    cmd = [sys.executable, "-m", "pytest", "-v", config['file_path']]

    try:
        # Run process setting cwd to ROOT_DIR so relative imports work
        result = subprocess.run(
            cmd,
            cwd=ROOT_DIR,
            capture_output=True,
            text=True,
            env=os.environ.copy()
        )

        duration = time.time() - start_time

        # Parse Output
        parsed_data = parse_pytest_output(result.stdout)

        # Print real-time feedback to console
        if parsed_data['tests']:
            for test in parsed_data['tests']:
                icon = "✅" if test['status'] == "PASSED" else "❌"
                print(f"  {icon} {test['test']}")
        else:
            # If pytest ran but output no tests (e.g. collection error)
            if result.returncode != 0:
                print("  ⚠️  Pytest Execution Failed:")
                print(result.stderr[-300:] if result.stderr else result.stdout[-300:])

        return {
            "success": result.returncode == 0,
            "exit_code": result.returncode,
            "duration_seconds": round(duration, 3),
            "results": parsed_data['tests'],
            "summary": parsed_data['summary'],
            "raw_output": result.stdout,
            "raw_error": result.stderr
        }

    except Exception as e:
        print(f"  ❌ Critical Execution Error: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "summary": {"total": 0, "passed": 0, "failed": 0}
        }

def save_report(report_data):
    """Saves the JSON report to the evaluation directory."""
    if not os.path.exists(EVALUATION_DIR):
        os.makedirs(EVALUATION_DIR)

    filename = "report.json"
    filepath = os.path.join(EVALUATION_DIR, filename)

    with open(filepath, 'w') as f:
        json.dump(report_data, f, indent=2)

    return filepath

# --- MAIN EXECUTION ---

def main():
    run_id = str(uuid.uuid4())[:8]
    print(f"Starting Evaluation (Run ID: {run_id})...")
    print(f"Root Directory detected as: {ROOT_DIR}")

    overall_success = True
    suite_results = {}

    # 1. Run Unit Tests
    unit_res = run_test_suite("unit_tests", TARGETS["unit_tests"])
    suite_results["unit_tests"] = unit_res
    if not unit_res["success"]:
        overall_success = False

    # 2. Run Meta Tests
    meta_res = run_test_suite("meta_tests", TARGETS["meta_tests"])
    suite_results["meta_tests"] = meta_res
    if not meta_res["success"]:
        overall_success = False

    # 3. Construct Final Report
    final_report = {
        "run_id": run_id,
        "environment": get_env_info(),
        "overall_success": overall_success,
        "suites": suite_results
    }

    # 4. Save and Summarize
    report_path = save_report(final_report)

    print("\n" + "="*50)
    print("EVALUATION SUMMARY")
    print("="*50)

    total_passed = unit_res.get('summary', {}).get('passed', 0) + meta_res.get('summary', {}).get('passed', 0)
    total_tests = unit_res.get('summary', {}).get('total', 0) + meta_res.get('summary', {}).get('total', 0)

    print(f"Total Tests Run: {total_tests}")
    print(f"Total Passed:    {total_passed}")
    print(f"Total Failed:    {total_tests - total_passed}")
    print("-" * 50)

    if overall_success:
        print("✅ RESULT: SUCCESS")
    else:
        print("❌ RESULT: FAILURE")

    print(f"📄 Report saved to: {report_path}")

    # Exit with status code
    sys.exit(0 if overall_success else 1)

if __name__ == "__main__":
    main()