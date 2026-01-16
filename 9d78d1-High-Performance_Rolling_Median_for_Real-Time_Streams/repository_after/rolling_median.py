from collections import deque

class FenwickTree:
    """
    Fenwick Tree (Binary Indexed Tree) for frequency counts.

    Supports efficient prefix sums and finding k-th element in O(log N) time.
    Used to maintain order statistics for the RollingMedian class without storing all elements.

    Attributes:
        size (int): Maximum value index in the tree.
        tree (list[int]): Internal 1-indexed tree array storing cumulative frequencies.
    """

    def __init__(self, size):
        self.size = size
        self.tree = [0] * (size + 2)  # 1-indexed

    def update(self, index, delta):
        """
        Update the frequency of a value by delta (can be positive or negative).

        Args:
            index (int): Value index to update (0-based).
            delta (int): Increment or decrement count for this value.
        """
        index += 1  # shift to 1-indexed
        while index <= self.size + 1:
            self.tree[index] += delta
            index += index & -index

    def query(self, index):
        """
        Compute cumulative frequency up to given index.

        Args:
            index (int): Value index to query (0-based).

        Returns:
            int: Sum of counts from 0 to index.
        """
        index += 1
        result = 0
        while index > 0:
            result += self.tree[index]
            index -= index & -index
        return result

    def find_kth(self, k):
        """
        Find the smallest value index such that cumulative frequency >= k.

        Args:
            k (int): 1-based rank of the element to find.

        Returns:
            int: Value corresponding to the k-th element (0-indexed).
        """
        index = 0
        bit_mask = 1 << (self.size.bit_length())
        sum_ = 0
        while bit_mask:
            t_index = index + bit_mask
            if t_index <= self.size and sum_ + self.tree[t_index] < k:
                sum_ += self.tree[t_index]
                index = t_index
            bit_mask >>= 1
        return index  # 0-indexed


class RollingMedian:
    """
    High-performance rolling median for real-time integer price streams.

    Maintains exact median of the last `window_size` prices using a Fenwick Tree
    to count frequencies, allowing O(log price_max) updates and median queries
    with bounded memory.

    Attributes:
        window_size (int): Maximum number of recent prices to maintain.
        price_max (int): Maximum allowed price value.
        tree (FenwickTree): Frequency counter for price values.
        window (deque): Sliding window storing order of incoming prices.
        count (int): Current number of elements in the window.
    """

    def __init__(self, window_size=1_000_000, price_max=10000):
        """
        Initialize the RollingMedian instance.

        Args:
            window_size (int): Sliding window size. Defaults to 1,000,000.
            price_max (int): Maximum allowed price. Defaults to 10,000.
        """
        self.window_size = window_size
        self.price_max = price_max
        self.tree = FenwickTree(price_max)
        self.window = deque()
        self.count = 0

    def add(self, price):
        """
        Add a new price to the sliding window and return the current median.

        Args:
            price (int): New price to add (must be 0 <= price <= price_max).

        Returns:
            float: Current exact median after adding the price.

        Raises:
            ValueError: If price is out of bounds.
        """
        if not (0 <= price <= self.price_max):
            raise ValueError(f"Price {price} out of bounds 0-{self.price_max}")

        # Add new price to window and update FenwickTree
        self.window.append(price)
        self.tree.update(price, 1)
        self.count += 1

        # Evict oldest price if window exceeds size
        if len(self.window) > self.window_size:
            oldest = self.window.popleft()
            self.tree.update(oldest, -1)
            self.count -= 1

        return self.get_median()

    def get_median(self):
        """
        Compute the current median from the sliding window.

        Returns:
            float | None: Median value as float. None if window is empty.

        Notes:
            - Odd count: middle element.
            - Even count: average of two middle elements.
            - Exact median guaranteed (no approximation).
        """
        if self.count == 0:
            return None

        if self.count % 2 == 1:
            k = (self.count + 1) // 2
            return float(self.tree.find_kth(k))
        else:
            k1 = self.count // 2
            k2 = k1 + 1
            return (self.tree.find_kth(k1) + self.tree.find_kth(k2)) / 2