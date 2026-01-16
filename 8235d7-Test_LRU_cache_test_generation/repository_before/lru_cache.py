from collections import OrderedDict 

class LRUCache:
    def __init__(self, capacity: int):
        self.cache = OrderedDict()
        self.capacity = capacity

    def get(self, key: int) -> int:
        if key not in self.cache:
            return -1
        val = self.cache.pop(key)
        # Move the accessed key to the end to indicate recent use
        self.cache[key] = val
        return val

    def put(self, key: int, value: int) -> None:
        if self.capacity == 0:
            return

        if key in self.cache:
            # Remove the old key to update the order
            self.cache.pop(key)
        elif len(self.cache) >= self.capacity:
            # Pop the first item to remove the least recently used item
            self.cache.popitem(last=False)
        # Insert the new key-value pair, marking it as recently used
        self.cache[key] = value

# Your LRUCache object will be instantiated and called as such:
# obj = LRUCache(capacity)
# param_1 = obj.get(key)
# obj.put(key,value)