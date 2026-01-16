import unittest
from lru_cache import LRUCache

class TestLRUCache(unittest.TestCase):

    # --- CATEGORY 1: Basic Retrieval & Initialization ---
    def test_initialization_and_empty_get(self):
        """Test cache initial state: non-existent keys return -1."""
        cache = LRUCache(capacity=2)
        self.assertEqual(cache.get(1), -1)
        self.assertEqual(cache.get(100), -1)

    def test_basic_put_get(self):
        """Test basic storage and retrieval."""
        cache = LRUCache(2)
        cache.put(1, 10)
        cache.put(2, 20)
        self.assertEqual(cache.get(1), 10)
        self.assertEqual(cache.get(2), 20)

    # --- CATEGORY 2: Key Updates & Size Management ---
    def test_update_existing_key(self):
        """Test that updating an existing key changes its value."""
        cache = LRUCache(2)
        cache.put(1, 1)
        cache.put(1, 10)
        self.assertEqual(cache.get(1), 10)

    def test_put_existing_key_does_not_increase_size(self):
        """Updating a key should update value without exceeding capacity."""
        cache = LRUCache(2)
        cache.put(1, 1)
        cache.put(2, 2)
        cache.put(1, 10)
        self.assertEqual(len(cache.cache), 2)
        self.assertEqual(cache.get(1), 10)

    def test_multiple_updates_to_same_key(self):
        """Repeated updates should maintain the key as MRU."""
        cache = LRUCache(2)
        cache.put(1, 10)
        cache.put(2, 20)
        cache.put(1, 100)
        cache.put(1, 1000)
        cache.put(3, 30)  # Should evict 2
        self.assertEqual(cache.get(1), 1000)
        self.assertEqual(cache.get(2), -1)

    # --- CATEGORY 3: Eviction & Recency Logic ---
    def test_eviction_when_capacity_exceeded(self):
        """Classic LRU eviction: the first key entered is the first out."""
        cache = LRUCache(2)
        cache.put(1, 1)
        cache.put(2, 2)
        cache.put(3, 3) 
        self.assertEqual(cache.get(1), -1)

    def test_get_marks_as_recently_used(self):
        """Retrieving a key prevents it from being evicted next."""
        cache = LRUCache(2)
        cache.put(1, 10)
        cache.put(2, 20)
        cache.get(1)      # 1 becomes MRU
        cache.put(3, 30)  # Evicts 2
        self.assertEqual(cache.get(2), -1)
        self.assertEqual(cache.get(1), 10)

    def test_evict_after_getting_old_key(self):
        """Ensure reviving an old key in a larger capacity works correctly."""
        cache = LRUCache(3)
        cache.put(1, 10)
        cache.put(2, 20)
        cache.put(3, 30)
        cache.get(1)      # Order: [2, 3, 1]
        cache.put(4, 40)  # Evicts 2
        self.assertEqual(cache.get(2), -1)
        self.assertEqual(cache.get(1), 10)

    def test_reinsert_evicted_key(self):
        """Reinserting a key that was previously evicted."""
        cache = LRUCache(2)
        cache.put(1, 10)
        cache.put(2, 20)
        cache.put(3, 30)  # Evicts 1
        self.assertEqual(cache.get(1), -1)
        cache.put(1, 10)  # Re-insert 1, evicts 2
        self.assertEqual(cache.get(2), -1)
        self.assertEqual(cache.get(1), 10)

    # --- CATEGORY 4: Complex Sequences ---
    def test_mixed_get_put_sequential(self):
        """Validates complex order: put 1,2,3 -> get 2 -> put 4 -> get 1 -> put 5."""
        cache = LRUCache(3)
        cache.put(1, 10); cache.put(2, 20); cache.put(3, 30)
        cache.get(2)      # MRU: 2, 3, 1 (LRU)
        cache.put(4, 40)  # Evict 1
        self.assertEqual(cache.get(1), -1)
        cache.put(5, 50)  # Evict 3 (new LRU)
        self.assertEqual(cache.get(3), -1)

    def test_large_number_of_operations(self):
        """Verify bulk operations respect the 5-item window."""
        cache = LRUCache(5)
        for i in range(1, 11):
            cache.put(i, i*10)
        for i in range(1, 6):
            self.assertEqual(cache.get(i), -1)
        for i in range(6, 11):
            self.assertEqual(cache.get(i), i*10)

    # --- CATEGORY 5: Edge Cases ---
    def test_capacity_1_operations(self):
        """Verify behavior when capacity is strictly 1."""
        cache = LRUCache(1)
        cache.put(1, 10)
        cache.put(2, 20)
        self.assertEqual(cache.get(1), -1)
        self.assertEqual(cache.get(2), 20)

    def test_zero_capacity_cache(self):
        """Ensure the code doesn't crash with 0 capacity."""
        cache = LRUCache(0)
        cache.put(1, 1)
        self.assertEqual(cache.get(1), -1)
        self.assertEqual(len(cache.cache), 0)

if __name__ == '__main__':
    unittest.main()