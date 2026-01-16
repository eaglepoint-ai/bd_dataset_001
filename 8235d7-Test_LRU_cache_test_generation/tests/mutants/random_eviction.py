from collections import OrderedDict
import random

class RandomEvictionCache:
    """Bug: Evicts a random item instead of the LRU item."""
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
        
        if len(self.cache) > self.capacity:
            # ERROR: Random eviction
            random_key = random.choice(list(self.cache.keys()))
            self.cache.pop(random_key)
