from collections import OrderedDict

class OffByOneEvictionCache:
    """Bug: Evicts only when len > capacity + 1 (allows one extra item)."""
    def __init__(self, capacity):
        self.cache = OrderedDict()
        self.capacity = capacity

    def get(self, key):
        if key not in self.cache:
            return -1
        self.cache.move_to_end(key)
        return self.cache[key]

    def put(self, key, value):
        if self.capacity == 0: return
        if key in self.cache:
            self.cache.move_to_end(key)
        self.cache[key] = value
        
        if len(self.cache) > self.capacity + 1:
            self.cache.popitem(last=False)
