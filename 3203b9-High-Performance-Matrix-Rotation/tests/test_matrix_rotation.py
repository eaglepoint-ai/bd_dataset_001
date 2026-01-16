#!/usr/bin/env python3
"""
Comprehensive test suite for matrix rotation function.
Tests various matrix sizes including edge cases and benchmarks performance.
"""

import time
import copy
from rotation import rotate_2d_matrix


def test_rotate_1x1():
    """Test edge case: 1x1 matrix"""
    matrix = [[42]]
    rotate_2d_matrix(matrix)
    assert matrix == [[42]]


def test_rotate_2x2():
    """Test edge case: 2x2 matrix"""
    matrix = [
        [1, 2],
        [3, 4]
    ]
    rotate_2d_matrix(matrix)
    expected = [
        [3, 1],
        [4, 2]
    ]
    assert matrix == expected


def test_rotate_3x3():
    """Test small matrix: 3x3"""
    matrix = [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9]
    ]
    rotate_2d_matrix(matrix)
    expected = [
        [7, 4, 1],
        [8, 5, 2],
        [9, 6, 3]
    ]
    assert matrix == expected


def test_rotate_5x5():
    """Test small matrix: 5x5"""
    matrix = [
        [1,  2,  3,  4,  5],
        [6,  7,  8,  9,  10],
        [11, 12, 13, 14, 15],
        [16, 17, 18, 19, 20],
        [21, 22, 23, 24, 25]
    ]
    rotate_2d_matrix(matrix)
    expected = [
        [21, 16, 11, 6, 1],
        [22, 17, 12, 7, 2],
        [23, 18, 13, 8, 3],
        [24, 19, 14, 9, 4],
        [25, 20, 15, 10, 5]
    ]
    assert matrix == expected


def test_rotate_4x4():
    """Test even-sized matrix: 4x4"""
    matrix = [
        [1,  2,  3,  4],
        [5,  6,  7,  8],
        [9,  10, 11, 12],
        [13, 14, 15, 16]
    ]
    rotate_2d_matrix(matrix)
    expected = [
        [13, 9,  5, 1],
        [14, 10, 6, 2],
        [15, 11, 7, 3],
        [16, 12, 8, 4]
    ]
    assert matrix == expected


def test_rotate_100x100():
    """Test medium matrix: 100x100"""
    # Create a 100x100 matrix with sequential values
    matrix = [[i * 100 + j for j in range(100)] for i in range(100)]
    
    # Store original for verification
    original = copy.deepcopy(matrix)
    
    start_time = time.time()
    rotate_2d_matrix(matrix)
    duration = time.time() - start_time
    
    # Verify rotation correctness by checking a few key positions
    # After 90° clockwise rotation: new[i][j] = old[n-1-j][i]
    assert matrix[0][0] == original[99][0]  # Top-left should be old bottom-left
    assert matrix[0][99] == original[0][0]  # Top-right should be old top-left
    assert matrix[99][99] == original[0][99]  # Bottom-right should be old top-right
    assert matrix[99][0] == original[99][99]  # Bottom-left should be old bottom-right
    
    print(f"100x100 matrix rotated in {duration:.6f} seconds")
    assert duration < 1.0, f"100x100 rotation took too long: {duration:.6f}s"


def test_rotate_500x500():
    """Test medium matrix: 500x500"""
    # Create a 500x500 matrix
    matrix = [[i * 500 + j for j in range(500)] for i in range(500)]
    
    original = copy.deepcopy(matrix)
    
    start_time = time.time()
    rotate_2d_matrix(matrix)
    duration = time.time() - start_time
    
    # Verify rotation correctness
    assert matrix[0][0] == original[499][0]
    assert matrix[0][499] == original[0][0]
    assert matrix[499][499] == original[0][499]
    assert matrix[499][0] == original[499][499]
    
    print(f"500x500 matrix rotated in {duration:.6f} seconds")
    assert duration < 5.0, f"500x500 rotation took too long: {duration:.6f}s"


def test_rotate_1000x1000():
    """Test large matrix: 1000x1000"""
    # Create a 1000x1000 matrix
    matrix = [[i * 1000 + j for j in range(1000)] for i in range(1000)]
    
    original = copy.deepcopy(matrix)
    
    start_time = time.time()
    rotate_2d_matrix(matrix)
    duration = time.time() - start_time
    
    # Verify rotation correctness
    assert matrix[0][0] == original[999][0]
    assert matrix[0][999] == original[0][0]
    assert matrix[999][999] == original[0][999]
    assert matrix[999][0] == original[999][999]
    
    print(f"1000x1000 matrix rotated in {duration:.6f} seconds")
    assert duration < 15.0, f"1000x1000 rotation took too long: {duration:.6f}s"


def test_rotate_2000x2000():
    """Test large matrix: 2000x2000"""
    # Create a 2000x2000 matrix
    matrix = [[i * 2000 + j for j in range(2000)] for i in range(2000)]
    
    original = copy.deepcopy(matrix)
    
    start_time = time.time()
    rotate_2d_matrix(matrix)
    duration = time.time() - start_time
    
    # Verify rotation correctness
    assert matrix[0][0] == original[1999][0]
    assert matrix[0][1999] == original[0][0]
    assert matrix[1999][1999] == original[0][1999]
    assert matrix[1999][0] == original[1999][1999]
    
    print(f"2000x2000 matrix rotated in {duration:.6f} seconds")
    assert duration < 60.0, f"2000x2000 rotation took too long: {duration:.6f}s"


def test_in_place_modification():
    """Verify that the function modifies the matrix in-place"""
    matrix = [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9]
    ]
    matrix_id = id(matrix)
    
    result = rotate_2d_matrix(matrix)
    
    # Function should return None and modify in-place
    assert result is None
    assert id(matrix) == matrix_id  # Same object reference


def test_double_rotation():
    """Test that rotating twice gives 180-degree rotation"""
    matrix = [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9]
    ]
    
    rotate_2d_matrix(matrix)
    rotate_2d_matrix(matrix)
    
    expected = [
        [9, 8, 7],
        [6, 5, 4],
        [3, 2, 1]
    ]
    
    assert matrix == expected


def test_quadruple_rotation():
    """Test that rotating 4 times returns to original"""
    original = [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9]
    ]
    matrix = copy.deepcopy(original)
    
    for _ in range(4):
        rotate_2d_matrix(matrix)
    
    assert matrix == original


if __name__ == "__main__":
    print("Running matrix rotation tests...")
    print("=" * 60)
    
    # Edge cases
    print("\n[Edge Cases]")
    test_rotate_1x1()
    print("✓ 1x1 matrix")
    
    test_rotate_2x2()
    print("✓ 2x2 matrix")
    
    # Small matrices
    print("\n[Small Matrices]")
    test_rotate_3x3()
    print("✓ 3x3 matrix")
    
    test_rotate_4x4()
    print("✓ 4x4 matrix")
    
    test_rotate_5x5()
    print("✓ 5x5 matrix")
    
    # Medium matrices
    print("\n[Medium Matrices]")
    test_rotate_100x100()
    print("✓ 100x100 matrix")
    
    test_rotate_500x500()
    print("✓ 500x500 matrix")
    
    # Large matrices
    print("\n[Large Matrices]")
    test_rotate_1000x1000()
    print("✓ 1000x1000 matrix")
    
    test_rotate_2000x2000()
    print("✓ 2000x2000 matrix")
    
    # Additional tests
    print("\n[Correctness Tests]")
    test_in_place_modification()
    print("✓ In-place modification")
    
    test_double_rotation()
    print("✓ Double rotation (180°)")
    
    test_quadruple_rotation()
    print("✓ Quadruple rotation (360°)")
    
    print("\n" + "=" * 60)
    print("All tests passed! ✓")
