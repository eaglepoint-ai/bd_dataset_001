from collections import OrderedDict

class MissingKeyReturnsNoneCache:
    """Bug: Returns None instead of -1 for missing keys."""
    def __init__(self, capacity):
        self.cache = OrderedDict()
        self.capacity = capacity
        
    def get(self, key):
        if key not in self.cache:
            # ERROR: Return None instead of -1
            return None
        self.cache.move_to_end(key)
        return self.cache[key]
        
    def put(self, key, value):
        if key in self.cache:
            self.cache.move_to_end(key)
        self.cache[key] = value
        
        if len(self.cache) > self.capacity:
            self.cache.popitem(last=False)
