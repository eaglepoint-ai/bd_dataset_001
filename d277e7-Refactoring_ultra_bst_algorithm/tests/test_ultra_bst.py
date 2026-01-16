"""
Comprehensive Test Suite for BST Implementation
Tests all 7 constraints and can be run against both original and refactored code.

"""

import time
import unittest
from typing import List
from repository_after.refactored_code import BST


class TestBSTConstraints(unittest.TestCase):
    """Test suite verifying all 7 constraints"""
    
    # =========================================================================
    # CONSTRAINT 1: Standard BST Operations
    # =========================================================================
    
    def test_insert_basic(self):
        """Test basic insertion"""
        bst = BST()
        
        node = bst.insert(50)
        self.assertIsNotNone(node)
        self.assertEqual(node.key, 50)
        self.assertEqual(len(bst), 1)
    
    def test_insert_multiple(self):
        """Test multiple insertions"""
        bst = BST()
        
        keys = [50, 30, 70, 20, 40, 60, 80]
        for key in keys:
            bst.insert(key)
        
        self.assertEqual(len(bst), 7)
    
    def test_search_existing(self):
        """Test search for existing keys"""
        bst = BST()
        
        keys = [50, 30, 70, 20, 40]
        for key in keys:
            bst.insert(key)
        
        for key in keys:
            node = bst.search(key)
            self.assertIsNotNone(node, f"Key {key} should be found")
            self.assertEqual(node.key, key)
    
    def test_search_nonexistent(self):
        """Test search for non-existent keys"""
        bst = BST()
        
        bst.insert(50)
        bst.insert(30)
        bst.insert(70)
        
        self.assertIsNone(bst.search(100))
        self.assertIsNone(bst.search(10))
        self.assertIsNone(bst.search(55))
    
    def test_inorder_traversal_sorted(self):
        """Test inorder traversal returns sorted sequence"""
        bst = BST()
        
        keys = [50, 30, 70, 20, 40, 60, 80, 10, 25, 35, 45]
        for key in keys:
            bst.insert(key)
        
        result = list(bst.inorder_traversal())
        expected = sorted(keys)
        self.assertEqual(result, expected)
    
    def test_contains_operator(self):
        """Test __contains__ operator"""
        bst = BST()
        
        bst.insert(50)
        bst.insert(30)
        bst.insert(70)
        
        self.assertTrue(50 in bst)
        self.assertTrue(30 in bst)
        self.assertTrue(70 in bst)
        self.assertFalse(100 in bst)
    
    def test_iter_operator(self):
        """Test __iter__ operator"""
        bst = BST()
        
        keys = [50, 30, 70, 20, 40]
        for key in keys:
            bst.insert(key)
        
        result = list(bst)
        expected = sorted(keys)
        self.assertEqual(result, expected)
    
    # =========================================================================
    # CONSTRAINT 2: Duplicate Handling (COUNT Strategy)
    # =========================================================================
    
    def test_duplicate_counting_basic(self):
        """Test basic duplicate counting"""
        bst = BST()
        
        bst.insert(50)
        bst.insert(50)
        bst.insert(50)
        
        self.assertEqual(len(bst), 3)
        result = list(bst.inorder_traversal())
        self.assertEqual(result, [50, 50, 50])
    
    def test_duplicate_counting_complex(self):
        """Test duplicate counting with multiple keys"""
        bst = BST()
        
        for key in [50, 30, 50, 30, 50]:
            bst.insert(key)
        
        result = list(bst.inorder_traversal())
        self.assertEqual(result, [30, 30, 50, 50, 50])
        self.assertEqual(len(bst), 5)
    
    def test_duplicate_counting_mixed(self):
        """Test duplicates mixed with unique keys"""
        bst = BST()
        
        sequence = [50, 30, 70, 30, 50, 20, 50, 30]
        for key in sequence:
            bst.insert(key)
        
        result = list(bst.inorder_traversal())
        expected = sorted(sequence)
        self.assertEqual(result, expected)
        self.assertEqual(len(bst), 8)
    
    def test_duplicate_node_reference(self):
        """Test that duplicate insertion returns same node"""
        bst = BST()
        
        node1 = bst.insert(50)
        node2 = bst.insert(50)
        
        self.assertEqual(node1.key, node2.key)
        self.assertEqual(node1.metadata.duplicate_count, 2)
    
    def test_duplicate_value_update(self):
        """Test that duplicate insertion can update value"""
        bst = BST()
        
        bst.insert(50, "first")
        bst.insert(50, "second")
        
        node = bst.search(50)
        self.assertEqual(node.value, "second")
        self.assertEqual(node.metadata.duplicate_count, 2)
    
    # =========================================================================
    # CONSTRAINT 3: Snapshot & Rollback
    # =========================================================================
    
    def test_snapshot_basic(self):
        """Test basic snapshot creation"""
        bst = BST()
        
        bst.insert(10)
        bst.insert(20)
        version = bst.create_snapshot()
        
        self.assertIsNotNone(version)
        self.assertGreaterEqual(version, 0)
    
    def test_rollback_restores_structure(self):
        """Test rollback restores tree structure"""
        bst = BST()
        
        bst.insert(10)
        bst.insert(20)
        version = bst.create_snapshot()
        
        bst.insert(30)
        bst.insert(40)
        self.assertEqual(len(bst), 4)
        
        success = bst.rollback(version)
        self.assertTrue(success)
        self.assertEqual(len(bst), 2)
        self.assertEqual(list(bst), [10, 20])
    
    def test_rollback_restores_duplicates(self):
        """Test rollback preserves duplicate counts"""
        bst = BST()
        
        bst.insert(50)
        bst.insert(50)
        bst.insert(30)
        version = bst.create_snapshot()
        
        bst.insert(70)
        bst.insert(50)
        
        bst.rollback(version)
        result = list(bst)
        self.assertEqual(result, [30, 50, 50])
        self.assertEqual(len(bst), 3)
    
    def test_multiple_snapshots(self):
        """Test multiple snapshots coexist"""
        bst = BST()
        
        bst.insert(5)
        v1 = bst.create_snapshot()
        
        bst.insert(10)
        v2 = bst.create_snapshot()
        
        bst.insert(15)
        v3 = bst.create_snapshot()
        
        bst.rollback(v1)
        self.assertEqual(list(bst), [5])
        
        bst.rollback(v2)
        self.assertEqual(list(bst), [5, 10])
        
        bst.rollback(v3)
        self.assertEqual(list(bst), [5, 10, 15])
    
    def test_rollback_invalid_version(self):
        """Test rollback with invalid version"""
        bst = BST()
        
        bst.insert(10)
        success = bst.rollback(999)
        
        self.assertFalse(success)
    
    def test_snapshot_empty_tree(self):
        """Test snapshot of empty tree"""
        bst = BST()
        
        version = bst.create_snapshot()
        bst.insert(10)
        
        bst.rollback(version)
        self.assertEqual(len(bst), 0)
        self.assertEqual(list(bst), [])
    
    def test_operations_after_rollback(self):
        """Test tree operations work correctly after rollback"""
        bst = BST()
        
        bst.insert(10)
        version = bst.create_snapshot()
        
        bst.insert(20)
        bst.rollback(version)
        
        bst.insert(30)
        self.assertEqual(len(bst), 2)
        self.assertIsNotNone(bst.search(10))
        self.assertIsNotNone(bst.search(30))
        self.assertIsNone(bst.search(20))
    
    # =========================================================================
    # CONSTRAINT 4: Deterministic Behavior
    # =========================================================================
    
    def test_deterministic_insertion_order(self):
        """Test same operations produce same results"""
        operations = [50, 30, 70, 30, 50, 90, 10, 50]
        
        bst1 = BST()
        for op in operations:
            bst1.insert(op)
        
        bst2 = BST()
        for op in operations:
            bst2.insert(op)
        
        result1 = list(bst1.inorder_traversal())
        result2 = list(bst2.inorder_traversal())
        
        self.assertEqual(result1, result2)
        self.assertEqual(len(bst1), len(bst2))
    
    def test_deterministic_snapshots(self):
        """Test snapshots are deterministic"""
        def build_tree():
            bst = BST()
            for key in [50, 30, 70, 20, 40]:
                bst.insert(key)
            version = bst.create_snapshot()
            bst.insert(80)
            bst.rollback(version)
            return list(bst)
        
        result1 = build_tree()
        result2 = build_tree()
        
        self.assertEqual(result1, result2)
    
    # =========================================================================
    # CONSTRAINT 5: Logarithmic Guarantee (O(log n))
    # =========================================================================
    
    def test_sequential_insertion_height_small(self):
        """Test height remains logarithmic for 1000 sequential inserts"""
        bst = BST()
        
        for i in range(1, 1001):
            bst.insert(i)
        
        height = bst.get_height()
        self.assertLessEqual(height, 14, 
            f"Height {height} too large for 1000 nodes (indicates O(n) degradation)")
    
    def test_sequential_insertion_height_large(self):
        """Test height remains logarithmic for 10000 sequential inserts (CRITICAL)"""
        bst = BST()
        
        for i in range(1, 10001):
            bst.insert(i)
        
        height = bst.get_height()
        self.assertLessEqual(height, 20, 
            f"CRITICAL FAILURE: Height {height} exceeds limit of 20 for 10000 nodes")
    
    def test_reverse_sequential_insertion(self):
        """Test height with reverse sequential insertion"""
        bst = BST()
        
        for i in range(1000, 0, -1):
            bst.insert(i)
        
        height = bst.get_height()
        self.assertLessEqual(height, 14)
    
    def test_search_performance_after_sequential(self):
        """Test search remains fast after sequential insertions"""
        bst = BST()
        
        for i in range(1, 1001):
            bst.insert(i)
        
        start = time.time()
        for i in [1, 500, 1000]:
            result = bst.search(i)
            self.assertIsNotNone(result)
        elapsed = time.time() - start
        
        self.assertLess(elapsed, 0.01, "Search too slow after sequential insertions")
    
    # =========================================================================
    # CONSTRAINT 6: Snapshot Performance
    # =========================================================================
    
    def test_snapshot_performance_basic(self):
        """Test snapshot creation and rollback performance"""
        bst = BST()
        
        for i in range(10000):
            bst.insert(i)
        
        start = time.time()
        version = bst.create_snapshot()
        snapshot_time = (time.time() - start) * 1000
        
        for i in range(10000, 20000):
            bst.insert(i)
        
        start = time.time()
        bst.rollback(version)
        rollback_time = (time.time() - start) * 1000
        
        self.assertLess(rollback_time, 50, 
            f"Rollback took {rollback_time:.2f}ms (limit: 50ms)")
    
    def test_multiple_snapshots_performance(self):
        """Test performance with multiple snapshots"""
        bst = BST()
        
        # Create 5 snapshots with operations between
        versions = []
        for i in range(5):
            for j in range(1000):
                bst.insert(i * 1000 + j)
            versions.append(bst.create_snapshot())
        
        # Add many more operations
        for i in range(5000, 10000):
            bst.insert(i)
        
        # Test rollback to middle snapshot
        start = time.time()
        bst.rollback(versions[2])
        rollback_time = (time.time() - start) * 1000
        
        self.assertLess(rollback_time, 50)
        self.assertEqual(len(bst), 3000)
    
    def test_operations_performance_after_rollback(self):
        """Test operations maintain O(log n) after rollback"""
        bst = BST()
        
        for i in range(5000):
            bst.insert(i)
        
        version = bst.create_snapshot()
        
        for i in range(5000, 10000):
            bst.insert(i)
        
        bst.rollback(version)
        
        # Search should still be fast
        start = time.time()
        for i in [0, 2500, 4999]:
            bst.search(i)
        elapsed = time.time() - start
        
        self.assertLess(elapsed, 0.01)
    
    # =========================================================================
    # CONSTRAINT 7: Memory Correctness
    # =========================================================================
    
    def test_len_with_duplicates(self):
        """Test __len__ returns correct count with duplicates"""
        bst = BST()
        
        bst.insert(10)
        self.assertEqual(len(bst), 1)
        
        bst.insert(10)
        self.assertEqual(len(bst), 2)
        
        bst.insert(20)
        self.assertEqual(len(bst), 3)
        
        bst.insert(10)
        self.assertEqual(len(bst), 4)
    
    def test_len_after_rollback_with_duplicates(self):
        """Test __len__ correct after rollback with duplicates"""
        bst = BST()
        
        bst.insert(100)
        bst.insert(100)
        bst.insert(200)
        self.assertEqual(len(bst), 3)
        
        version = bst.create_snapshot()
        
        bst.insert(300)
        bst.insert(100)
        self.assertEqual(len(bst), 5)
        
        bst.rollback(version)
        self.assertEqual(len(bst), 3, "Length not restored correctly after rollback")
    
    def test_traversal_count_matches_len(self):
        """Test traversal yields exactly len() elements"""
        bst = BST()
        
        for key in [50, 30, 70, 30, 50, 50]:
            bst.insert(key)
        
        traversal_count = len(list(bst.inorder_traversal()))
        self.assertEqual(traversal_count, len(bst))
    
    def test_multiple_rollbacks_memory_correctness(self):
        """Test memory correctness with multiple rollbacks"""
        bst = BST()
        
        # Build tree with snapshots
        bst.insert(10)
        v1 = bst.create_snapshot()
        
        bst.insert(20)
        bst.insert(20)
        v2 = bst.create_snapshot()
        
        bst.insert(30)
        
        # Multiple rollbacks
        bst.rollback(v2)
        self.assertEqual(len(bst), 3)
        
        bst.rollback(v1)
        self.assertEqual(len(bst), 1)
        
        bst.rollback(v2)
        self.assertEqual(len(bst), 3)
    
    # =========================================================================
    # EDGE CASES & STRESS TESTS
    # =========================================================================
    
    def test_empty_tree_operations(self):
        """Test operations on empty tree"""
        bst = BST()
        
        self.assertEqual(len(bst), 0)
        self.assertEqual(list(bst), [])
        self.assertIsNone(bst.search(10))
        self.assertFalse(10 in bst)
        self.assertEqual(bst.get_height(), 0)
    
    def test_single_element_tree(self):
        """Test operations on single element tree"""
        bst = BST()
        
        bst.insert(42)
        
        self.assertEqual(len(bst), 1)
        self.assertEqual(list(bst), [42])
        self.assertIsNotNone(bst.search(42))
        self.assertTrue(42 in bst)
        self.assertEqual(bst.get_height(), 1)
    
    def test_custom_comparator(self):
        """Test BST with custom comparator"""
        def reverse_cmp(a, b):
            return (b > a) - (b < a)
        
        bst = BST(comparator=reverse_cmp)
        
        for key in [50, 30, 70, 20, 40]:
            bst.insert(key)
        
        result = list(bst.inorder_traversal())
        expected = [70, 50, 40, 30, 20]
        self.assertEqual(result, expected)
    
    def test_large_tree_operations(self):
        """Stress test with large tree"""
        bst = BST()
        
        for i in range(50000):
            bst.insert(i % 1000)  
        
        self.assertEqual(len(bst), 50000)
        
        self.assertIsNotNone(bst.search(500))
        self.assertIsNone(bst.search(2000))
        
        height = bst.get_height()
        self.assertLess(height, 20)


class TestBSTIntegration(unittest.TestCase):
    """Integration tests simulating real-world usage"""
    
    def test_order_book_simulation(self):
        """Simulate high-frequency trading order book"""
        bst = BST()
        
        prices = [100.50, 100.45, 100.55, 100.45, 100.50, 100.60, 100.45]
        
        for price in prices:
            bst.insert(price)
        
        audit_version = bst.create_snapshot()
        
        bst.insert(100.52)
        bst.insert(100.50)
        
        order_book = list(bst.inorder_traversal())
        self.assertEqual(len(order_book), 9)
        
        bst.rollback(audit_version)
        self.assertEqual(len(bst), 7)
    
    def test_time_series_data(self):
        """Test with time-series like sequential data"""
        bst = BST()
        
        for t in range(1000, 2000):
            bst.insert(t)
        
        self.assertLess(bst.get_height(), 15)
        all_times = list(bst.inorder_traversal())
        self.assertEqual(len(all_times), 1000)
        self.assertEqual(all_times[0], 1000)
        self.assertEqual(all_times[-1], 1999)


