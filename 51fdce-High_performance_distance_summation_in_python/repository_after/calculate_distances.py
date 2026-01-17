import math

class Point:
    __slots__ = ('x', 'y')
    def __init__(self, x, y):
        self.x = x
        self.y = y

def calculate_distances(points_list):
    sqrt = math.sqrt
    return sum(sqrt(p.x*p.x + p.y*p.y) for p in points_list)
