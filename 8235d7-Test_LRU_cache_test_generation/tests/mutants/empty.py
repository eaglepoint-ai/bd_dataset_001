from collections import OrderedDict

class EmptyCache:
    """Bug: Always returns -1."""
    def __init__(self, capacity):
        pass
    def get(self, key):
        return -1
    def put(self, key, value):
        pass
