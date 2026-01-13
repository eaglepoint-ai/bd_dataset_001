from collections import OrderedDict

class NoRecencyUpdateOnGetCache:
    """Bug: 'get' does NOT update the recency of the item."""
    def __init__(self, capacity):
        self.cache = OrderedDict()
        self.capacity = capacity

    def get(self, key):
        if key not in self.cache:
            return -1
        # ERROR: Missing self.cache.move_to_end(key) or equivalent re-insert
        return self.cache[key]

    def put(self, key, value):
        if self.capacity == 0: return
        if key in self.cache:
            self.cache.move_to_end(key)
        self.cache[key] = value
        if len(self.cache) > self.capacity:
            self.cache.popitem(last=False)
