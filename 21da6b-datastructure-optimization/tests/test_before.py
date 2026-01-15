import sys
import time
sys.path.insert(0, '../repository_before')
from algorithm import find_horizontal_line, compute_union_area

def test_basic_single_square():
    """Single square - split at middle"""
    squares = [(0, 0, 2)]
    result = find_horizontal_line(squares)
    assert abs(result - 1.0) < 1e-6, f"Expected ~1.0, got {result}"
    print("✅ Single square")

def test_two_overlapping():
    """Two overlapping squares"""
    squares = [(0, 0, 2), (1, 1, 2)]
    result = find_horizontal_line(squares)
    assert 0 < result < 4, f"Result {result} out of range"
    print("✅ Two overlapping")

def test_non_overlapping():
    """Non-overlapping squares"""
    squares = [(0, 0, 1), (2, 2, 1)]
    result = find_horizontal_line(squares)
    assert 0 < result < 4, f"Result {result} out of range"
    print("✅ Non-overlapping")

def test_empty():
    """Empty input"""
    result = find_horizontal_line([])
    assert result == 0.0
    print("✅ Empty input")

def test_area_calculation():
    """Area calculation correctness"""
    rectangles = [(0, 0, 2, 2), (1, 1, 3, 3)]
    area = compute_union_area(rectangles)
    expected = 7.0  # 4 + 4 - 1 overlap
    assert abs(area - expected) < 1e-6, f"Expected {expected}, got {area}"
    print("✅ Area calculation")

def test_performance_small():
    """Small input performance - should pass"""
    squares = [(i, i, 1) for i in range(100)]
    start = time.time()
    result = find_horizontal_line(squares)
    elapsed = time.time() - start
    assert elapsed < 1.0, f"Took {elapsed}s, too slow"
    print(f"✅ Small performance ({elapsed:.3f}s)")

def test_performance_large():
    """Large input - SHOULD TIMEOUT"""
    squares = [(i % 100, i % 100, 1) for i in range(10000)]
    start = time.time()
    try:
        result = find_horizontal_line(squares)
        elapsed = time.time() - start
        if elapsed > 5.0:
            print(f"❌ Large input timeout ({elapsed:.1f}s)")
        else:
            print(f"⚠️  Large input passed ({elapsed:.3f}s) - unexpected")
    except:
        print("❌ Large input crashed")

if __name__ == "__main__":
    test_empty()
    test_basic_single_square()
    test_two_overlapping()
    test_non_overlapping()
    test_area_calculation()
    test_performance_small()
    test_performance_large()
    print("\nDone!")
