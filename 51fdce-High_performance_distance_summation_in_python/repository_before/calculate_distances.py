import math

class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y

def calculate_distances(points_list):
    distances = []
    for p in points_list:
        dist = math.sqrt(p.x**2 + p.y**2)
        distances.append(dist)
    return sum(distances)