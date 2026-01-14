class RollingMedian:
    def __init__(self, window_size):
        self.window = []  # Grows to O(n), unacceptable
        self.window_size = window_size
    def add(self, price):
        self.window.append(price)
        if len(self.window) > self.window_size:
            self.window.pop(0)  # O(n) shift
        return self._calculate_median()
    def _calculate_median(self):
        sorted_window = sorted(self.window)  # O(n log n) each time
        mid = len(sorted_window) // 2
        if len(sorted_window) % 2 == 0:
            return (sorted_window[mid-1] + sorted_window[mid]) / 2
        return sorted_window[mid]