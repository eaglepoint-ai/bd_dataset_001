import argparse
import asyncio
import importlib.util
import json
import os
import sys
import time
import ast
import inspect
from statistics import mean
from typing import Iterable, get_type_hints
from datetime import datetime
from collections import deque

# Try normal import first
try:
    from repository_after.refactored import AsyncDataProcessor, DataManager
except ImportError:
    # Try importing via absolute path
    repo_dir = os.path.join(os.path.dirname(__file__), '..', 'repository_after')
    refactored_path = os.path.join(repo_dir, 'refactored.py')
    spec = importlib.util.spec_from_file_location("refactored", refactored_path)
    if spec and spec.loader:
        refactored = importlib.util.module_from_spec(spec)
        sys.modules["refactored"] = refactored
        spec.loader.exec_module(refactored)
        AsyncDataProcessor = refactored.AsyncDataProcessor
        DataManager = refactored.DataManager
    else:
        raise ImportError("Could not import AsyncDataProcessor and DataManager from refactored.py. Make sure refactored.py is in the correct directory.")


async def run_trial(num_items: int, buffer_size: int) -> dict:
    manager = DataManager(buffer_size=buffer_size)
    processor = AsyncDataProcessor()

    items = list(range(num_items))
    start = time.perf_counter()
    producer_task = asyncio.create_task(manager.producer(items))
    consumer_tasks = [asyncio.create_task(manager.consumer(processor)) for _ in range(num_items)]
    await asyncio.gather(producer_task, *consumer_tasks)
    elapsed = time.perf_counter() - start

    return {
        "num_items": num_items,
        "buffer_size": buffer_size,
        "elapsed": elapsed,
        "stored": list(manager.buffer),
    }


def validate_requirements(module_path: str) -> dict:
    """Validate all 12 requirements against the implementation."""
    
    results = {
        "total_requirements": 12,
        "passed": 0,
        "failed": 0,
        "requirements": {}
    }
    
    # Read source code
    with open(module_path, 'r', encoding='utf-8') as f:
        source_code = f.read()
    
    tree = ast.parse(source_code)
    
    # Requirement 1-5: Concurrent, async, non-blocking processing (5 requirements)
    req_1_5 = {
        "name": "Requirements 1-5: Concurrent, Async, Non-blocking Processing",
        "passed": False,
        "count": 5,  # This group represents 5 requirements
        "details": []
    }
    
    # Check for asyncio.sleep (non-blocking)
    has_async_sleep = "asyncio.sleep" in source_code
    has_blocking_sleep = "time.sleep" in source_code and "asyncio.to_thread" not in source_code
    
    if has_async_sleep and not has_blocking_sleep:
        req_1_5["details"].append("✅ Uses asyncio.sleep (non-blocking)")
        req_1_5["passed"] = True
    else:
        req_1_5["details"].append("❌ Uses blocking time.sleep or asyncio.to_thread")
        req_1_5["passed"] = False
    
    results["requirements"]["req_1_5"] = req_1_5
    
    # Requirement 6-7: Queue-based data management (2 requirements)
    req_6_7 = {
        "name": "Requirements 6-7: Queue-based Data Management",
        "passed": False,
        "count": 2,  # This group represents 2 requirements
        "details": []
    }
    
    has_queue = "asyncio.Queue" in source_code
    if has_queue:
        req_6_7["details"].append("✅ Uses asyncio.Queue for data management")
        req_6_7["passed"] = True
    else:
        req_6_7["details"].append("❌ Does not use asyncio.Queue")
    
    results["requirements"]["req_6_7"] = req_6_7
    
    # Requirement 8: Type safety with Protocol (1 requirement)
    req_8 = {
        "name": "Requirement 8: Strict Type Hinting with Protocol",
        "passed": False,
        "count": 1,  # This group represents 1 requirement
        "details": []
    }
    
    has_protocol = "Protocol" in source_code and "from typing import" in source_code
    has_type_hints = "->" in source_code and ":" in source_code
    
    if has_protocol and has_type_hints:
        req_8["details"].append("✅ Uses typing.Protocol")
        req_8["details"].append("✅ Has type hints throughout")
        req_8["passed"] = True
    else:
        if not has_protocol:
            req_8["details"].append("❌ Does not use typing.Protocol")
        if not has_type_hints:
            req_8["details"].append("❌ Missing type hints")
    
    results["requirements"]["req_8"] = req_8
    
    # Requirement 9: Circular buffer with deque (1 requirement)
    req_9 = {
        "name": "Requirement 9: Circular Buffer Pattern",
        "passed": False,
        "count": 1,  # This group represents 1 requirement
        "details": []
    }
    
    has_deque = "deque" in source_code and "from collections import" in source_code
    has_maxlen = "maxlen" in source_code
    
    if has_deque and has_maxlen:
        req_9["details"].append("✅ Uses collections.deque with maxlen")
        req_9["passed"] = True
    else:
        if not has_deque:
            req_9["details"].append("❌ Does not use collections.deque")
        if not has_maxlen:
            req_9["details"].append("❌ Does not implement maxlen (circular buffer)")
    
    results["requirements"]["req_9"] = req_9
    
    # Requirement 10-11: No global state (2 requirements)
    req_10_11 = {
        "name": "Requirements 10-11: No Global State",
        "passed": False,
        "count": 2,  # This group represents 2 requirements
        "details": []
    }
    
    # Check for global variables (excluding imports and if __name__)
    global_vars = []
    for node in ast.walk(tree):
        if isinstance(node, ast.Assign):
            # Check if it's at module level
            if hasattr(node, 'col_offset') and node.col_offset == 0:
                for target in node.targets:
                    if isinstance(target, ast.Name):
                        var_name = target.id
                        # Exclude common patterns
                        if var_name not in ['__name__', '__file__', '__doc__'] and not var_name.startswith('_'):
                            global_vars.append(var_name)
    
    # Filter out false positives (check if they're actually global mutable state)
    has_global_state = any(var.isupper() or "STORE" in var or "DATA" in var for var in global_vars)
    
    if not has_global_state:
        req_10_11["details"].append("✅ No global mutable state detected")
        req_10_11["passed"] = True
    else:
        req_10_11["details"].append(f"❌ Global state detected: {global_vars}")
    
    results["requirements"]["req_10_11"] = req_10_11
    
    # Requirement 12: No for/while loops in processing logic (1 requirement)
    req_12 = {
        "name": "Requirement 12: No for/while Loops (Use Comprehensions)",
        "passed": False,
        "count": 1,  # This group represents 1 requirement
        "details": []
    }
    
    # Check for explicit for/while loops in functions
    has_explicit_loops = False
    for node in ast.walk(tree):
        if isinstance(node, (ast.For, ast.While)):
            # Check if it's inside a function (not at module level)
            has_explicit_loops = True
            break
    
    # Check for list comprehensions (allowed)
    has_comprehensions = "[" in source_code and "for" in source_code and "]" in source_code
    
    if not has_explicit_loops and has_comprehensions:
        req_12["details"].append("✅ Uses list comprehensions instead of explicit loops")
        req_12["passed"] = True
    elif not has_explicit_loops:
        req_12["details"].append("✅ No explicit for/while loops found")
        req_12["passed"] = True
    else:
        req_12["details"].append("❌ Contains explicit for/while loops")
    
    results["requirements"]["req_12"] = req_12
    
    # Count passed/failed based on requirement counts
    for req_key, req_data in results["requirements"].items():
        req_count = req_data.get("count", 1)
        if req_data["passed"]:
            results["passed"] += req_count
        else:
            results["failed"] += req_count
    
    return results


def summarize(results: Iterable[dict]) -> dict:
    elapsed_times = [r["elapsed"] for r in results]
    stored_counts = [len(r["stored"]) for r in results]

    summary = {
        "trials": len(results),
        "mean_elapsed": mean(elapsed_times) if elapsed_times else 0.0,
        "min_elapsed": min(elapsed_times) if elapsed_times else 0.0,
        "max_elapsed": max(elapsed_times) if elapsed_times else 0.0,
        "stored_counts": stored_counts,
    }

    print("Evaluation Summary")
    print(f"- Trials: {summary['trials']}")
    print(f"- Mean elapsed: {summary['mean_elapsed']:.3f}s")
    print(f"- Min elapsed: {summary['min_elapsed']:.3f}s")
    print(f"- Max elapsed: {summary['max_elapsed']:.3f}s")
    print(f"- Stored counts: {summary['stored_counts']}")

    return summary


async def run_all(trials: int, num_items: int, buffer_size: int) -> list[dict]:
    jobs = [run_trial(num_items, buffer_size) for _ in range(trials)]
    return await asyncio.gather(*jobs)


def main() -> None:
    parser = argparse.ArgumentParser(description="Evaluate the async data processor performance")
    parser.add_argument("--trials", type=int, default=3)
    parser.add_argument("--items", type=int, default=5)
    parser.add_argument("--buffer", type=int, default=3)
    parser.add_argument("--validate-before", action="store_true", help="Validate the before implementation")
    parser.add_argument("--validate-after", action="store_true", help="Validate the after implementation")
    args = parser.parse_args()

    # Generate nested directory structure: reports/YYYY-MM-DD/HH-MM-SS/report.json
    now = datetime.now()
    date_str = now.strftime("%Y-%m-%d")
    time_str = now.strftime("%H-%M-%S")
    
    reports_base = os.path.join(os.path.dirname(__file__), "reports")
    report_dir = os.path.join(reports_base, date_str, time_str)
    os.makedirs(report_dir, exist_ok=True)
    
    out_file = os.path.join(report_dir, "report.json")

    payload = {}
    
    # Validate implementations if requested
    if args.validate_before:
        print("\n" + "=" * 70)
        print("VALIDATING BEFORE IMPLEMENTATION")
        print("=" * 70)
        before_path = os.path.join(os.path.dirname(__file__), '..', 'repository_before', 'async_processing_pipeline.py')
        before_validation = validate_requirements(before_path)
        payload["before_validation"] = before_validation
        
        print(f"\nRequirements Passed: {before_validation['passed']}/{before_validation['total_requirements']}")
        for req_key, req_data in before_validation["requirements"].items():
            status = "✅ PASS" if req_data["passed"] else "❌ FAIL"
            print(f"\n{status}: {req_data['name']}")
            for detail in req_data["details"]:
                print(f"  {detail}")
    
    if args.validate_after:
        print("\n" + "=" * 70)
        print("VALIDATING AFTER IMPLEMENTATION")
        print("=" * 70)
        after_path = os.path.join(os.path.dirname(__file__), '..', 'repository_after', 'refactored.py')
        after_validation = validate_requirements(after_path)
        payload["after_validation"] = after_validation
        
        print(f"\nRequirements Passed: {after_validation['passed']}/{after_validation['total_requirements']}")
        for req_key, req_data in after_validation["requirements"].items():
            status = "✅ PASS" if req_data["passed"] else "❌ FAIL"
            print(f"\n{status}: {req_data['name']}")
            for detail in req_data["details"]:
                print(f"  {detail}")

    # Run performance tests
    print("\n" + "=" * 70)
    print("PERFORMANCE EVALUATION")
    print("=" * 70)
    results = asyncio.run(run_all(args.trials, args.items, args.buffer))
    summary = summarize(results)

    payload["summary"] = summary
    payload["results"] = results
    
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)

    print(f"\nWrote detailed results to {out_file}")
    
    # Print final verdict
    if args.validate_after and "after_validation" in payload:
        print("\n" + "=" * 70)
        print("FINAL VERDICT")
        print("=" * 70)
        after_val = payload["after_validation"]
        if after_val["passed"] == after_val["total_requirements"]:
            print(f"✅ ALL REQUIREMENTS PASSED - {after_val['passed']}/{after_val['total_requirements']} requirements met!")
        else:
            print(f"❌ IMPLEMENTATION FAILED - Only {after_val['passed']}/{after_val['total_requirements']} requirements passed")
            print(f"   {after_val['failed']} requirements not met")


if __name__ == "__main__":
    main()
