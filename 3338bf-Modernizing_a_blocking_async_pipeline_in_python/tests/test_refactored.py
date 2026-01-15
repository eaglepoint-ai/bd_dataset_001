import asyncio
import unittest
from collections import deque
from unittest.mock import AsyncMock

# Assuming the refactored code is in repository_after/refactored.py
import sys
import os
import importlib.util
from pathlib import Path

repo_after = Path(__file__).resolve().parent.parent / 'repository_after'
refactored_path = repo_after / 'refactored.py'

if not refactored_path.exists():
    raise ImportError(f"Could not find refactored.py at {refactored_path}")

spec = importlib.util.spec_from_file_location("refactored", str(refactored_path))
refactored = importlib.util.module_from_spec(spec)
spec.loader.exec_module(refactored)

ProcessorProtocol = getattr(refactored, "ProcessorProtocol")
AsyncDataProcessor = getattr(refactored, "AsyncDataProcessor")
DataManager = getattr(refactored, "DataManager")


class TestAsyncDataProcessor(unittest.TestCase):
    def test_process(self):
        async def run_test():
            processor = AsyncDataProcessor()
            result = await processor.process(1)
            self.assertEqual(result, "Finished 1")

        asyncio.run(run_test())


class TestDataManager(unittest.TestCase):
    def test_buffer_maxlen(self):
        manager = DataManager(buffer_size=3)
        self.assertEqual(manager.buffer.maxlen, 3)

    def test_producer_puts_items(self):
        async def run_test():
            manager = DataManager()
            items = [1, 2, 3]
            await manager.producer(items)
            self.assertEqual(manager.queue.qsize(), 3)

        asyncio.run(run_test())

    def test_consumer_processes_and_stores(self):
        async def run_test():
            manager = DataManager()
            processor = AsyncDataProcessor()
            await manager.queue.put(1)
            await manager.consumer(processor)
            self.assertEqual(list(manager.buffer), ["Finished 1"])

        asyncio.run(run_test())

    def test_concurrent_processing(self):
        async def run_test():
            manager = DataManager()
            processor = AsyncDataProcessor()
            items = list(range(5))
            start_time = asyncio.get_event_loop().time()
            producer_task = asyncio.create_task(manager.producer(items))
            consumer_tasks = [asyncio.create_task(manager.consumer(processor)) for _ in range(5)]
            await asyncio.gather(producer_task, *consumer_tasks)
            end_time = asyncio.get_event_loop().time()
            elapsed = end_time - start_time
            # Should take about 2 seconds, not 10
            self.assertLess(elapsed, 3.0)
            results = sorted(list(manager.buffer))
            expected = sorted([f"Finished {i}" for i in range(5)])
            self.assertEqual(results, expected)

        asyncio.run(run_test())


if __name__ == '__main__':
    unittest.main()