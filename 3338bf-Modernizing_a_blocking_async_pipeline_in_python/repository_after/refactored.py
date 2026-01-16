import asyncio
from collections import deque
from typing import Protocol


class ProcessorProtocol(Protocol):
    async def process(self, data: int) -> str: ...


class AsyncDataProcessor:
    def __init__(self) -> None:
        pass

    async def process(self, data: int) -> str:
        print(f"Processing {data}...")
        await asyncio.sleep(2)  # Non-blocking sleep
        return f"Finished {data}"


class DataManager:
    def __init__(self, buffer_size: int = 10) -> None:
        self.queue: asyncio.Queue[int] = asyncio.Queue()
        self.buffer: deque[str] = deque(maxlen=buffer_size)

    async def producer(self, items: list[int]) -> None:
        await asyncio.gather(*[self.queue.put(item) for item in items])

    async def consumer(self, processor: ProcessorProtocol) -> None:
        data = await self.queue.get()
        result = await processor.process(data)
        self.buffer.append(result)


async def main_loop() -> None:
    processor = AsyncDataProcessor()
    manager = DataManager(buffer_size=10)
    producer_task = asyncio.create_task(manager.producer(list(range(5))))
    consumer_tasks = [asyncio.create_task(manager.consumer(processor)) for _ in range(5)]
    await asyncio.gather(producer_task, *consumer_tasks)
    print(list(manager.buffer))


if __name__ == "__main__":
    asyncio.run(main_loop())