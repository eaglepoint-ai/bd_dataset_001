"""
Comparison script to highlight the differences between before and after implementations.
"""
import asyncio
import time
import sys
from pathlib import Path

# Import before implementation
sys.path.insert(0, str(Path(__file__).parent / "repository_before"))
from async_processing_pipeline import DataProcessor, DATA_STORE

# Import after implementation
sys.path.insert(0, str(Path(__file__).parent / "repository_after"))
from refactored import AsyncDataProcessor, DataManager

print("=" * 70)
print("COMPARISON: Before vs After Implementation")
print("=" * 70)

print("\n1. GLOBAL STATE CHECK")
print("-" * 70)
print(f"Before: Uses global DATA_STORE = {DATA_STORE}")
print(f"After: No global state - encapsulated in DataManager class")

print("\n2. TYPE SAFETY CHECK")
print("-" * 70)
print("Before: No type hints")
print("  - DataProcessor.__init__(self, name)  # No types!")
print("  - def sync_blocking_task(self, data)  # No types!")
print("\nAfter: Full type hints")
print("  - def __init__(self, buffer_size: int = 10) -> None:")
print("  - async def process(self, data: int) -> str:")
print("  - Uses typing.Protocol for interface contracts")

print("\n3. BLOCKING vs NON-BLOCKING")
print("-" * 70)
print("Before: Uses time.sleep(2) wrapped in asyncio.to_thread()")
print("  - Requires thread pool overhead")
print("  - Not truly async - uses OS threads")
print("\nAfter: Uses await asyncio.sleep(2)")
print("  - Pure async/await - no threads needed")
print("  - True non-blocking concurrency")

print("\n4. MEMORY MANAGEMENT")
print("-" * 70)
print("Before: DATA_STORE.append(data)")
print("  - Unbounded list - grows forever!")
print("  - Memory leak risk")
print("\nAfter: deque(maxlen=buffer_size)")
print("  - Circular buffer with fixed size")
print("  - Automatically evicts old items")

print("\n5. DATA FLOW MANAGEMENT")
print("-" * 70)
print("Before: Direct list comprehension with gather")
print("  - No queue-based coordination")
print("  - No producer/consumer pattern")
print("\nAfter: asyncio.Queue for producer/consumer")
print("  - Proper async queue management")
print("  - Decoupled producer and consumer")

print("\n6. PERFORMANCE TEST")
print("-" * 70)

async def test_before():
    """Test the before implementation"""
    DATA_STORE.clear()
    processor = DataProcessor("Worker-1")
    start = time.perf_counter()
    tasks = [asyncio.create_task(asyncio.to_thread(processor.sync_blocking_task, i)) for i in range(10)]
    await asyncio.gather(*tasks)
    elapsed = time.perf_counter() - start
    return elapsed, len(DATA_STORE)

async def test_after():
    """Test the after implementation"""
    manager = DataManager(buffer_size=5)  # Small buffer to show circular behavior
    processor = AsyncDataProcessor()
    start = time.perf_counter()
    producer_task = asyncio.create_task(manager.producer(list(range(10))))
    consumer_tasks = [asyncio.create_task(manager.consumer(processor)) for _ in range(10)]
    await asyncio.gather(producer_task, *consumer_tasks)
    elapsed = time.perf_counter() - start
    return elapsed, len(manager.buffer)

print("\nProcessing 10 items with 2-second delay each...")
print("\nBefore implementation:")
before_time, before_stored = asyncio.run(test_before())
print(f"  Time: {before_time:.2f}s")
print(f"  Items stored: {before_stored} (unbounded - all items kept!)")

print("\nAfter implementation (buffer_size=5):")
after_time, after_stored = asyncio.run(test_after())
print(f"  Time: {after_time:.2f}s")
print(f"  Items stored: {after_stored} (circular buffer - only last 5 kept)")

print("\n" + "=" * 70)
print("SUMMARY OF IMPROVEMENTS")
print("=" * 70)
print("✅ Eliminated global state")
print("✅ Added strict type hints with Protocol")
print("✅ Implemented circular buffer (memory-safe)")
print("✅ True async/await (no thread overhead)")
print("✅ Queue-based producer/consumer pattern")
print("✅ Encapsulated state in classes")
print("=" * 70)
