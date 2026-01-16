from collections import OrderedDict

class ZeroCapacityAsOneCache:
    """Bug: Treats capacity 0 as capacity 1."""
    def __init__(self, capacity):
        self.capacity = capacity if capacity > 0 else 1 # ERROR: Coerce 0 to 1
        self.cache = OrderedDict()

    def get(self, key):
        if key not in self.cache:
            return -1
        self.cache.move_to_end(key)
        return self.cache[key]

    def put(self, key, value):
        if key in self.cache:
            self.cache.move_to_end(key)
        self.cache[key] = value
        if len(self.cache) > self.capacity:
            self.cache.popitem(last=False)
