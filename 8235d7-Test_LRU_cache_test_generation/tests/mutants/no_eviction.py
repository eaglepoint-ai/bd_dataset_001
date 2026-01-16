from collections import OrderedDict

class NoEvictionCache:
    """Bug: Never evicts anything. Capacity is ignored."""
    def __init__(self, capacity):
        self.cache = OrderedDict()
        self.capacity = capacity
        
    def get(self, key):
        if key not in self.cache:
            return -1
        # It DOES update recency correctly, to isolate the eviction bug
        self.cache.move_to_end(key)
        return self.cache[key]
        
    def put(self, key, value):
        if key in self.cache:
            self.cache.move_to_end(key)
        self.cache[key] = value
        # ERROR: No check for len(self.cache) > self.capacity
