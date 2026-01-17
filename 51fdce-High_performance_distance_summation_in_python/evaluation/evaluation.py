import json
import subprocess
import datetime
import uuid
import sys
import os
import time
import random
import platform
import math

# Add root directory to path to allow imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

def run_tests(repo_path, python_path_env):
    """Result of running pytest on the specified repository."""
    env = os.environ.copy()
    env['PYTHONPATH'] = python_path_env
    
    # Use a temporary file for the JSON report
    report_file = f"/tmp/report_{uuid.uuid4()}.json"
    
    try:
        # Running pytest with --json-report to get structured output
        result = subprocess.run(
            ['pytest', '-q', '--json-report', f'--json-report-file={report_file}', 'tests'],
            capture_output=True,
            text=True,
            env=env
        )
        
        test_data = {
            "passed": result.returncode == 0,
            "return_code": result.returncode,
            "output": result.stdout + result.stderr,
            "summary": {},
            "summary_matrix": [],
            "tests": [],
            "raw_output": ""
        }

        if os.path.exists(report_file):
            with open(report_file, 'r') as f:
                json_report = json.load(f)
                
            test_data["raw_output"] = json.dumps(json_report)
            
            # Extract summary
            summary = json_report.get("summary", {})
            test_data["summary"] = {
                "numTotalTests": summary.get("total", 0),
                "numPassedTests": summary.get("passed", 0),
                "numFailedTests": summary.get("failed", 0),
                # Pytest report summary is slightly different from jest, mapping best effort
                "numTotalTestSuites": 1, 
                "numPassedTestSuites": 1 if result.returncode == 0 else 0,
                "numFailedTestSuites": 0 if result.returncode == 0 else 1
            }
            
            # Matrix: [Passed, Failed]
            test_data["summary_matrix"] = [[
                test_data["summary"]["numPassedTests"],
                test_data["summary"]["numFailedTests"]
            ]]
            
            # Extract individual tests
            tests_list = []
            for test in json_report.get("tests", []):
                status_map = {
                    "passed": "passed",
                    "failed": "failed",
                    "skipped": "pending"
                }
                
                # Extract failure messages
                failure_msgs = []
                if "call" in test and "longrepr" in test["call"]:
                    failure_msgs.append(str(test["call"]["longrepr"]))
                elif "setup" in test and "longrepr" in test["setup"]:
                     failure_msgs.append(str(test["setup"]["longrepr"]))

                tests_list.append({
                    "fullName": test.get("nodeid", ""),
                    "status": status_map.get(test.get("outcome", ""), "failed"),
                    "title": test.get("nodeid", "").split("::")[-1],
                    "failureMessages": failure_msgs,
                    "location": {
                        "column": 0, # Not readily available in basic json report
                        "line": test.get("lineno", 0)
                    }
                })
            test_data["tests"] = tests_list
            
            # Cleanup
            os.remove(report_file)
            
        return test_data

    except Exception as e:
        if os.path.exists(report_file):
             os.remove(report_file)
        return {
            "passed": False,
            "return_code": -1,
            "output": str(e),
            "summary": {},
            "summary_matrix": [],
            "tests": [],
            "raw_output": ""
        }

def benchmark_module(module_name, n=1_000_000):
    """Benchmarks the calculate_distances function of the given module."""
    try:
        # Dynamic import based on module name
        # We need to import the 'calculate_distances' submodule from the package
        full_module_name = f"{module_name}.calculate_distances"
        mod = __import__(full_module_name, fromlist=['calculate_distances', 'Point'])
        
        calc_dist = mod.calculate_distances
        Point = mod.Point
        
        # Generator data
        data = [(random.random() * 100, random.random() * 100) for _ in range(n)]
        points = [Point(x, y) for x, y in data]
        
        start_time = time.time()
        _ = calc_dist(points)
        end_time = time.time()
        
        return {
            "execution_time_seconds": end_time - start_time,
            "items_processed": n,
            "error": None
        }
    except Exception as e:
        return {
            "execution_time_seconds": None,
            "items_processed": n,
            "error": str(e)
        }

def main():
    start_time = datetime.datetime.now(datetime.timezone.utc)
    run_id = str(uuid.uuid4())
    
    report = {
        "run_id": run_id,
        "started_at": start_time.isoformat(),
        "finished_at": "",
        "duration_seconds": 0.0,
        "environment": {
            "python_version": platform.python_version(),
            "platform": platform.platform()
        },
        "before": {
            "tests": {},
            "metrics": {}
        },
        "after": {
            "tests": {},
            "metrics": {}
        },
        "comparison": {},
        "success": False,
        "error": None
    }

    try:
        root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
        
        # 1. Evaluate 'before'
        # print("Evaluating repository_before...") # Suppressed console output
        report["before"]["tests"] = run_tests(
            os.path.join(root_dir, 'repository_before'),
            os.path.join(root_dir, 'repository_before')
        )
        report["before"]["metrics"] = benchmark_module('repository_before')

        # 2. Evaluate 'after'
        # print("Evaluating repository_after...") # Suppressed console output
        report["after"]["tests"] = run_tests(
            os.path.join(root_dir, 'repository_after'),
            os.path.join(root_dir, 'repository_after')
        )
        report["after"]["metrics"] = benchmark_module('repository_after')

        # 3. Comparison
        passed_tests = report["after"]["tests"]["passed"]
        
        time_before = report["before"]["metrics"]["execution_time_seconds"]
        time_after = report["after"]["metrics"]["execution_time_seconds"]
        
        improvement_msg = "No improvement or error in metrics."
        speedup = 0.0
        
        if time_before is not None and time_after is not None and time_after > 0:
            speedup = time_before / time_after
            improvement_msg = f"Speedup: {speedup:.2f}x"
        
        report["comparison"] = {
            "passed_gate": passed_tests and speedup > 1.0,
            "improvement_summary": improvement_msg,
            "speedup_factor": speedup
        }
        
        report["success"] = True

    except Exception as e:
        report["error"] = str(e)
        report["success"] = False
    
    finally:
        end_time = datetime.datetime.now(datetime.timezone.utc)
        report["finished_at"] = end_time.isoformat()
        report["duration_seconds"] = (end_time - start_time).total_seconds()
        
        # Ensure directory exists
        report_dir = os.path.join(
            os.path.dirname(__file__),
            'reports',
            start_time.strftime('%Y-%m-%d'),
            start_time.strftime('%H-%M-%S')
        )
        os.makedirs(report_dir, exist_ok=True)
        
        report_path = os.path.join(report_dir, 'report.json')
        with open(report_path, 'w') as f:
            json.dump(report, f, indent=2)
            
        print(f"Report generated at: {report_path}")
        # print(json.dumps(report, indent=2)) # Suppressed console output

if __name__ == "__main__":
    main()
