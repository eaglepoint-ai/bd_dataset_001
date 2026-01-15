import argparse
import asyncio
import importlib.util
import json
import os
import sys
import time
from statistics import mean
from typing import Iterable
from datetime import datetime

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
    args = parser.parse_args()

    # Generate timestamped filename in evaluation/reports folder
    reports_dir = os.path.join(os.path.dirname(__file__), "reports")
    os.makedirs(reports_dir, exist_ok=True)
    timestamp = datetime.now().strftime("%Y-%m-%d-%H-%M-%S")
    out_file = os.path.join(reports_dir, f"report-{timestamp}.json")

    results = asyncio.run(run_all(args.trials, args.items, args.buffer))
    summary = summarize(results)

    payload = {"summary": summary, "results": results}
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)

    print(f"Wrote detailed results to {out_file}")
    print("\nFull JSON report:")
    print(json.dumps(payload, indent=2))


if __name__ == "__main__":
    main()
