import unittest
import sys
import os
import importlib.util

# -- Setup paths --
REPO_PATH = os.path.abspath(os.getenv('REPO_PATH', os.path.join(os.path.dirname(__file__), '..', 'repository_after')))
sys.path.append(REPO_PATH)
sys.path.append(os.path.dirname(__file__))

import lru_cache

from mutants import (
    NoEvictionCache, 
    RandomEvictionCache, 
    NoRecencyUpdateOnGetCache,
    NoRecencyUpdateOnPutCache,
    OffByOneEvictionCache,
    ZeroCapacityAsOneCache,
    EmptyCache,
    CorruptValueCache,
    MissingKeyReturnsNoneCache
)

# -- Helper to load and run the target test suite --
def run_target_tests():
    """
    Loads `lru_cache.test.py` dynamically and runs its tests.
    Returns a unittest.TestResult object.
    """
    test_file_path = os.path.join(REPO_PATH, 'lru_cache_test.py')
    
    # Load the module specifically
    spec = importlib.util.spec_from_file_location("lru_cache_test_module", test_file_path)
    module = importlib.util.module_from_spec(spec)
    # We must mock the import of 'lru_cache' inside the test module 
    # so it picks up our modified 'lru_cache' module from sys.modules
    sys.modules["lru_cache_test_module"] = module
    spec.loader.exec_module(module)
    
    # We reload the module to ensure it picks up the current state of lru_cache.LRUCache
    # However, since 'from lru_cache import LRUCache' executes at import time,
    # simply patching lru_cache.LRUCache in the global namespace works 
    # IF we reload/re-exec the test module every time.
    
    loader = unittest.TestLoader()
    suite = loader.loadTestsFromModule(module)
    
    with open(os.devnull, 'w') as stream:
        runner = unittest.TextTestRunner(stream=stream, verbosity=0)
        result = runner.run(suite)
    return result

# -- Define Mutants (Buggy Implementations) --

class OriginalLRUCache(lru_cache.LRUCache):
    """The correct implementation (proxy)."""
    pass

# -- Meta Test Suite --

class TestMetaLRUCache(unittest.TestCase):
    
    def tearDown(self):
        # Restore original implementation just in case
        lru_cache.LRUCache = OriginalLRUCache

    def test_original_implementation_passes(self):
        """Positive Scenario: The real implementation should pass all tests."""
        lru_cache.LRUCache = OriginalLRUCache
        result = run_target_tests()
        self.assertTrue(result.wasSuccessful(), f"Original implementation failed tests: {result.failures + result.errors}")

    def test_no_eviction_fails(self):
        """Negative Scenario: Cache that never evicts should fail capacity tests."""
        lru_cache.LRUCache = NoEvictionCache
        result = run_target_tests()
        self.assertFalse(result.wasSuccessful(), "NoEvictionCache should have failed tests but passed!")
        # We can broadly check that failures occurred. 
        # Ideally, we'd check *which* tests failed, but strictly: it MUST fail.

    def test_random_eviction_fails(self):
        """Negative Scenario: Cache that evicts randomly should fail deterministic LRU tests."""
        lru_cache.LRUCache = RandomEvictionCache
        result = run_target_tests()
        self.assertFalse(result.wasSuccessful(), "RandomEvictionCache should have failed tests but passed!")

    def test_no_recency_on_get_fails(self):
        """Negative Scenario: Cache that doesn't update (promote) on 'get' should fail."""
        lru_cache.LRUCache = NoRecencyUpdateOnGetCache
        result = run_target_tests()
        self.assertFalse(result.wasSuccessful(), "NoRecencyUpdateOnGetCache should have failed tests but passed!")

    def test_no_recency_on_put_fails(self):
        """Negative Scenario: Cache that doesn't update (promote) on 'put' should fail."""
        lru_cache.LRUCache = NoRecencyUpdateOnPutCache
        result = run_target_tests()
        self.assertFalse(result.wasSuccessful(), "NoRecencyUpdateOnPutCache should have failed tests but passed!")

    def test_off_by_one_eviction_fails(self):
        """Negative Scenario: Cache that allows one extra item should fail."""
        lru_cache.LRUCache = OffByOneEvictionCache
        result = run_target_tests()
        self.assertFalse(result.wasSuccessful(), "OffByOneEvictionCache should have failed tests but passed!")

    def test_zero_capacity_as_one_fails(self):
        """Negative Scenario: Cache that treats 0 capacity as 1 should fail."""
        lru_cache.LRUCache = ZeroCapacityAsOneCache
        result = run_target_tests()
        self.assertFalse(result.wasSuccessful(), "ZeroCapacityAsOneCache should have failed tests but passed!")

    def test_empty_cache_fails(self):
        """Negative Scenario: Cache that drops everything should fail."""
        lru_cache.LRUCache = EmptyCache
        result = run_target_tests()
        self.assertFalse(result.wasSuccessful(), "EmptyCache should have failed tests but passed!")

    def test_corrupt_value_fails(self):
        """Negative Scenario: Cache returning wrong values should fail."""
        lru_cache.LRUCache = CorruptValueCache
        result = run_target_tests()
        self.assertFalse(result.wasSuccessful(), "CorruptValueCache should have failed tests but passed!")

    def test_missing_key_none_fails(self):
        """Negative Scenario: Cache returning None for missing keys should fail."""
        lru_cache.LRUCache = MissingKeyReturnsNoneCache
        result = run_target_tests()
        self.assertFalse(result.wasSuccessful(), "MissingKeyReturnsNoneCache should have failed tests but passed!")

if __name__ == '__main__':
    unittest.main()
