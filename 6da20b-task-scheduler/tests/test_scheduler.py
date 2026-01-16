import json
import os
import sys
import subprocess
import tempfile
import shutil

def run_scheduler(scheduler_path, task_json_content):
    """
    Run a scheduler script with given task JSON content.
    Returns (returncode, stdout, stderr).
    """
    # Create a temporary directory with task.json
    temp_dir = tempfile.mkdtemp()
    
    try:
        # Write task.json
        task_json_path = os.path.join(temp_dir, "task.json")
        with open(task_json_path, "w") as f:
            json.dump(task_json_content, f, indent=2)
        
        # Copy scheduler to temp directory
        scheduler_copy = os.path.join(temp_dir, "scheduler.py")
        shutil.copy(scheduler_path, scheduler_copy)
        
        # Run the scheduler
        result = subprocess.run(
            [sys.executable, scheduler_copy],
            cwd=temp_dir,
            capture_output=True,
            text=True,
            timeout=5
        )
        
        return result.returncode, result.stdout, result.stderr
    except subprocess.TimeoutExpired:
        return -1, "", "Timeout: possible infinite loop"
    except Exception as e:
        return -1, "", str(e)
    finally:
        # Clean up
        shutil.rmtree(temp_dir, ignore_errors=True)

def test_basic_scheduling(scheduler_path):
    """Test basic task scheduling without dependencies"""
    tasks = [
        {
            "name": "Task A",
            "duration": 2,
            "earliest": 8,
            "latest": 12
        },
        {
            "name": "Task B",
            "duration": 3,
            "earliest": 10,
            "latest": 18
        }
    ]
    
    returncode, stdout, stderr = run_scheduler(scheduler_path, tasks)
    
    return {
        "test_name": "Basic Scheduling",
        "passed": returncode == 0 and "Task A" in stdout and "Task B" in stdout,
        "returncode": returncode,
        "stdout": stdout,
        "stderr": stderr,
        "description": "Schedule two independent tasks"
    }

def test_after_dependency(scheduler_path):
    """Test 'after' dependency constraint"""
    tasks = [
        {
            "name": "Task A",
            "duration": 2,
            "earliest": 8,
            "latest": 12
        },
        {
            "name": "Task B",
            "duration": 1,
            "earliest": 0,
            "latest": 18,
            "after": "Task A"
        }
    ]
    
    returncode, stdout, stderr = run_scheduler(scheduler_path, tasks)
    
    return {
        "test_name": "After Dependency",
        "passed": returncode == 0 and "Task B" in stdout,
        "returncode": returncode,
        "stdout": stdout,
        "stderr": stderr,
        "description": "Task B must start after Task A completes"
    }

def test_not_same_day(scheduler_path):
    """Test 'not_same_day_as' constraint"""
    tasks = [
        {
            "name": "Task A",
            "duration": 2,
            "earliest": 8,
            "latest": 12
        },
        {
            "name": "Task C",
            "duration": 0.5,
            "earliest": 0,
            "latest": 18,
            "not_same_day_as": "Task A"
        }
    ]
    
    returncode, stdout, stderr = run_scheduler(scheduler_path, tasks)
    
    # Check that tasks are on different days
    success = returncode == 0 and "Task C" in stdout
    if success and "Day 2" in stdout:
        success = True  # Task C should be on Day 2
    
    return {
        "test_name": "Not Same Day Constraint",
        "passed": success,
        "returncode": returncode,
        "stdout": stdout,
        "stderr": stderr,
        "description": "Task C cannot be on same day as Task A"
    }

def test_null_values(scheduler_path):
    """Test handling of null values in JSON"""
    tasks = [
        {
            "name": "Task A",
            "duration": 2,
            "earliest": None,
            "latest": None
        }
    ]
    
    returncode, stdout, stderr = run_scheduler(scheduler_path, tasks)
    
    return {
        "test_name": "Null Values Handling",
        "passed": returncode == 0,
        "returncode": returncode,
        "stdout": stdout,
        "stderr": stderr,
        "description": "Handle null earliest/latest values"
    }

def test_invalid_time_window(scheduler_path):
    """Test error handling for invalid time constraints"""
    tasks = [
        {
            "name": "Task A",
            "duration": 2,
            "earliest": 18,
            "latest": 12
        }
    ]
    
    returncode, stdout, stderr = run_scheduler(scheduler_path, tasks)
    
    return {
        "test_name": "Invalid Time Window",
        "passed": returncode != 0 or "Error" in stdout or "Error" in stderr,
        "returncode": returncode,
        "stdout": stdout,
        "stderr": stderr,
        "description": "Detect earliest > latest error"
    }

def test_task_too_long(scheduler_path):
    """Test error handling for task that doesn't fit"""
    tasks = [
        {
            "name": "Task A",
            "duration": 10,
            "earliest": 8,
            "latest": 12
        }
    ]
    
    returncode, stdout, stderr = run_scheduler(scheduler_path, tasks)
    
    return {
        "test_name": "Task Too Long",
        "passed": returncode != 0 or "Error" in stdout or "doesn't fit" in stdout,
        "returncode": returncode,
        "stdout": stdout,
        "stderr": stderr,
        "description": "Detect when duration exceeds time window"
    }

def test_missing_dependency(scheduler_path):
    """Test handling of missing dependency"""
    tasks = [
        {
            "name": "Task B",
            "duration": 1,
            "earliest": 0,
            "latest": 18,
            "after": "NonExistent"
        }
    ]
    
    returncode, stdout, stderr = run_scheduler(scheduler_path, tasks)
    
    return {
        "test_name": "Missing Dependency",
        "passed": "Warning" in stdout or "Error" in stdout,
        "returncode": returncode,
        "stdout": stdout,
        "stderr": stderr,
        "description": "Handle reference to non-existent task"
    }

def test_multi_day_scheduling(scheduler_path):
    """Test scheduling across multiple days"""
    tasks = [
        {
            "name": "Task A",
            "duration": 8,
            "earliest": 9,
            "latest": 17
        },
        {
            "name": "Task B",
            "duration": 8,
            "earliest": 9,
            "latest": 17,
            "after": "Task A"
        }
    ]
    
    returncode, stdout, stderr = run_scheduler(scheduler_path, tasks)
    
    # Task B should be on Day 2 since it needs to start after Task A
    success = returncode == 0 and ("Day 1" in stdout or "Day 2" in stdout)
    
    return {
        "test_name": "Multi-day Scheduling",
        "passed": success,
        "returncode": returncode,
        "stdout": stdout,
        "stderr": stderr,
        "description": "Schedule tasks across multiple days"
    }

def test_complex_constraints(scheduler_path):
    """Test combination of multiple constraints"""
    tasks = [
        {
            "name": "Task A",
            "duration": 2,
            "earliest": 8,
            "latest": 12
        },
        {
            "name": "Task B",
            "duration": 1,
            "earliest": 0,
            "latest": 18,
            "after": "Task A"
        },
        {
            "name": "Task C",
            "duration": 0.5,
            "earliest": 0,
            "latest": 18,
            "not_same_day_as": "Task A"
        }
    ]
    
    returncode, stdout, stderr = run_scheduler(scheduler_path, tasks)
    
    return {
        "test_name": "Complex Constraints",
        "passed": returncode == 0 and "Task A" in stdout and "Task B" in stdout and "Task C" in stdout,
        "returncode": returncode,
        "stdout": stdout,
        "stderr": stderr,
        "description": "Handle both after and not_same_day_as constraints"
    }

def run_all_tests(scheduler_path):
    """Run all tests and return results"""
    tests = [
        test_basic_scheduling,
        test_after_dependency,
        test_not_same_day,
        test_null_values,
        test_invalid_time_window,
        test_task_too_long,
        test_missing_dependency,
        test_multi_day_scheduling,
        test_complex_constraints
    ]
    
    results = []
    for test_func in tests:
        try:
            result = test_func(scheduler_path)
            results.append(result)
        except Exception as e:
            results.append({
                "test_name": test_func.__name__,
                "passed": False,
                "error": str(e),
                "description": test_func.__doc__ or "No description"
            })
    
    return results

def print_test_results(results, version_name):
    """Print formatted test results"""
    print(f"\n{'='*70}")
    print(f"Test Results for {version_name}")
    print(f"{'='*70}\n")
    
    passed = sum(1 for r in results if r.get("passed", False))
    total = len(results)
    
    for result in results:
        status = "✓ PASS" if result.get("passed", False) else "✗ FAIL"
        print(f"{status}: {result['test_name']}")
    
    print(f"\n{'='*70}")
    print(f"Summary: {passed}/{total} tests passed ({100*passed//total}%)")
    print(f"{'='*70}\n")
    
    return passed, total

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python test_scheduler.py <scheduler_path> [version_name]")
        sys.exit(1)
    
    scheduler_path = sys.argv[1]
    version_name = sys.argv[2] if len(sys.argv) > 2 else os.path.basename(os.path.dirname(scheduler_path))
    
    if not os.path.exists(scheduler_path):
        print(f"Error: Scheduler not found at {scheduler_path}")
        sys.exit(1)
    
    results = run_all_tests(scheduler_path)
    passed, total = print_test_results(results, version_name)
    
    # Return results as JSON for evaluation
    output = {
        "version": version_name,
        "tests": results,
        "summary": {
            "passed": passed,
            "total": total,
            "percentage": 100 * passed / total if total > 0 else 0
        }
    }
    
    # Save to file if requested
    if len(sys.argv) > 3:
        output_file = sys.argv[3]
        with open(output_file, "w") as f:
            json.dump(output, f, indent=2)
        print(f"Results saved to {output_file}")
    
    sys.exit(0 if passed == total else 1)
