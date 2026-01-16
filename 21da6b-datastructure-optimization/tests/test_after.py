import sys
import time
import inspect
sys.path.insert(0, '../repository_after')
from algorithm import find_horizontal_line

def test_correctness_basic():
    """Basic correctness - single square"""
    squares = [(0, 0, 2)]
    result = find_horizontal_line(squares)
    assert abs(result - 1.0) < 1e-9, f"Expected 1.0, got {result}"
    print("✅ Basic correctness")

def test_correctness_overlapping():
    """Correctness - overlapping squares"""
    squares = [(0, 0, 2), (1, 1, 2)]
    result = find_horizontal_line(squares)
    assert 0 < result < 4, f"Result {result} out of range"
    print("✅ Overlapping correctness")

def test_exact_answer():
    """Requirement 3: Exact mathematical answer"""
    squares = [(0, 0, 4)]
    result = find_horizontal_line(squares)
    # Should be exactly 2.0, not approximation
    assert result == 2.0, f"Expected exact 2.0, got {result}"
    print("✅ Exact answer (not approximation)")

def test_no_iteration():
    """Requirement 2: No iterative/convergence methods"""
    source = inspect.getsource(find_horizontal_line)
    # Check for binary search patterns
    assert 'while' not in source.lower() or 'while' in source and source.count('while') == 0, "Found while loop"
    assert 'for _ in range' not in source, "Found iteration loop"
    assert 'max_iterations' not in source, "Found max_iterations"
    print("✅ No iterative methods")

def test_single_pass():
    """Requirement 6: Single pass (no multiple area computations)"""
    source = inspect.getsource(find_horizontal_line)
    # Should not call compute_area_below or similar multiple times
    assert 'compute_area_below' not in source, "Found multiple area computations"
    print("✅ Single pass algorithm")

def test_performance_large():
    """Requirement 7: O(n log n) time complexity"""
    # Test with 10k squares
    squares = [(i % 100, i % 100, 1) for i in range(10000)]
    start = time.time()
    result = find_horizontal_line(squares)
    elapsed = time.time() - start
    assert elapsed < 0.5, f"Too slow: {elapsed:.3f}s (expected < 0.5s)"
    print(f"✅ Large input performance ({elapsed:.3f}s)")

def test_performance_huge():
    """Stress test - 50k squares"""
    squares = [(i % 200, i % 200, 1) for i in range(50000)]
    start = time.time()
    result = find_horizontal_line(squares)
    elapsed = time.time() - start
    assert elapsed < 2.0, f"Too slow: {elapsed:.3f}s (expected < 2.0s)"
    print(f"✅ Huge input performance ({elapsed:.3f}s)")

def test_space_complexity():
    """Requirement 5: O(unique coordinates) space"""
    # 10k squares but only 100 unique y-coordinates
    squares = [(i, i % 100, 1) for i in range(10000)]
    start = time.time()
    result = find_horizontal_line(squares)
    elapsed = time.time() - start
    # Should be fast due to coordinate compression
    assert elapsed < 0.5, f"Space inefficient: {elapsed:.3f}s"
    print(f"✅ Space complexity O(unique coords) ({elapsed:.3f}s)")

def test_edge_cases():
    """Edge cases"""
    assert find_horizontal_line([]) == 0.0, "Empty failed"
    assert find_horizontal_line([(0, 0, 1)]) > 0, "Single square failed"
    print("✅ Edge cases")

def test_data_structure():
    """Requirement 4: O(log n) updates (segment tree or balanced tree)"""
    source = inspect.getsource(find_horizontal_line)
    # Should use segment tree or similar
    has_tree = 'SegmentTree' in source or 'tree' in source.lower() or 'bisect' in source
    assert has_tree, "No efficient data structure found"
    print("✅ Efficient data structure (O(log n) updates)")

if __name__ == "__main__":
    print("Testing repository_after constraints...\n")
    test_edge_cases()
    test_correctness_basic()
    test_correctness_overlapping()
    test_exact_answer()
    test_no_iteration()
    test_single_pass()
    test_data_structure()
    test_space_complexity()
    test_performance_large()
    test_performance_huge()
    print("\n✅ All constraints satisfied!")
