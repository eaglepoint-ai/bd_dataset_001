from collections import OrderedDict

class NoRecencyUpdateOnPutCache:
    """Bug: 'put' updates value but does NOT move to end (MRU)."""
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
        # ERROR: If key in cache, we update value bu DO NOT move to end
        self.cache[key] = value
        if len(self.cache) > self.capacity:
            self.cache.popitem(last=False)
