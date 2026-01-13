from collections import OrderedDict

class CorruptValueCache:
    """Bug: Returns value + 1 instead of the correct value."""
    def __init__(self, capacity):
        self.cache = OrderedDict()
        self.capacity = capacity
        
    def get(self, key):
        if key not in self.cache:
            return -1
        self.cache.move_to_end(key)
        # ERROR: Return corrupted value
        return self.cache[key] + 1
        
    def put(self, key, value):
        if key in self.cache:
            self.cache.move_to_end(key)
        self.cache[key] = value
        
        if len(self.cache) > self.capacity:
            self.cache.popitem(last=False)
