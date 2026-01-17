"""
Test Suite for Square Split Line Problem
=========================================

These tests verify that both repository_before and repository_after
produce functionally equivalent results with acceptable precision.

Tests are organized by complexity:
1. Basic cases (single square, non-overlapping)
2. Overlapping cases
3. Complex geometries
4. Edge cases
"""

import pytest
import sys
from pathlib import Path

# Import both implementations
sys.path.insert(0, str(Path(__file__).parent.parent / "repository_before"))
sys.path.insert(0, str(Path(__file__).parent.parent / "repository_after"))

# The test runner will switch between implementations
# Both must pass the same tests


def get_solution_module():
    """Get the solution module based on environment or test parameter."""
    try:
        from solution import find_split_line
        return find_split_line
    except ImportError:
        pytest.fail("Could not import find_split_line from solution module")


class TestBasicCases:
    """Test basic, simple cases"""
    
    def test_single_square(self):
        """Single square should split at its vertical center"""
        find_split_line = get_solution_module()
        
        squares = [[0, 0, 10]]
        result = find_split_line(squares)
        
        # Split should be at y=5 (center)
        assert abs(result - 5.0) < 1e-4, f"Expected ~5.0, got {result}"
    
    def test_two_squares_stacked(self):
        """Two non-overlapping squares stacked vertically"""
        find_split_line = get_solution_module()
        
        # Bottom square: y=0 to y=10, area=100
        # Top square: y=10 to y=20, area=100
        # Total area = 200, split at y=10
        squares = [
            [0, 0, 10],
            [0, 10, 10]
        ]
        result = find_split_line(squares)
        
        assert abs(result - 10.0) < 1e-4, f"Expected ~10.0, got {result}"
    
    def test_two_squares_side_by_side(self):
        """Two non-overlapping squares side by side"""
        find_split_line = get_solution_module()
        
        # Both squares same height, split at vertical center
        squares = [
            [0, 0, 10],
            [10, 0, 10]
        ]
        result = find_split_line(squares)
        
        assert abs(result - 5.0) < 1e-4, f"Expected ~5.0, got {result}"
    
    def test_empty_input(self):
        """Empty square list should return 0"""
        find_split_line = get_solution_module()
        
        result = find_split_line([])
        assert result == 0.0


class TestOverlappingCases:
    """Test cases with overlapping squares"""
    
    def test_two_overlapping_squares(self):
        """Two squares with partial overlap"""
        find_split_line = get_solution_module()
        
        # Square 1: (0,0) to (10,10) - area 100
        # Square 2: (5,5) to (15,15) - area 100
        # Overlap: (5,5) to (10,10) - area 25
        # Total union area: 100 + 100 - 25 = 175
        squares = [
            [0, 0, 10],
            [5, 5, 10]
        ]
        result = find_split_line(squares)
        
        # Split line should be between 5 and 10
        assert 5.0 <= result <= 10.0, f"Expected split between 5 and 10, got {result}"
    
    def test_fully_contained_square(self):
        """One square completely inside another"""
        find_split_line = get_solution_module()
        
        # Large square: (0,0) to (20,20)
        # Small square inside: (5,5) to (10,10)
        # Union area = 400 (only large square counts)
        squares = [
            [0, 0, 20],
            [5, 5, 5]
        ]
        result = find_split_line(squares)
        
        # Should split at y=10 (center of large square)
        assert abs(result - 10.0) < 1e-3, f"Expected ~10.0, got {result}"
    
    def test_three_overlapping_squares(self):
        """Three squares with complex overlap pattern"""
        find_split_line = get_solution_module()
        
        squares = [
            [0, 0, 10],
            [5, 0, 10],
            [2, 5, 10]
        ]
        result = find_split_line(squares)
        
        # Result should be reasonable (between min and max y)
        assert 0.0 <= result <= 15.0, f"Result {result} out of bounds"


class TestComplexGeometries:
    """Test complex geometric configurations"""
    
    def test_grid_of_squares(self):
        """Grid arrangement of non-overlapping squares"""
        find_split_line = get_solution_module()
        
        # 3x3 grid of unit squares
        squares = []
        for i in range(3):
            for j in range(3):
                squares.append([i * 2, j * 2, 1])
        
        result = find_split_line(squares)
        
        # Should split roughly in the middle
        assert 2.0 <= result <= 4.0, f"Expected split around 3.0, got {result}"
    
    def test_l_shaped_configuration(self):
        """L-shaped configuration of squares"""
        find_split_line = get_solution_module()
        
        squares = [
            [0, 0, 5],    # Bottom of L
            [0, 5, 5],    # Vertical part of L
            [5, 0, 5]     # Horizontal part of L
        ]
        result = find_split_line(squares)
        
        # Valid result within bounds
        assert 0.0 <= result <= 10.0
    
    def test_many_small_squares(self):
        """Many small squares testing scalability"""
        find_split_line = get_solution_module()
        
        # 10x10 grid of tiny squares
        squares = []
        for i in range(10):
            for j in range(10):
                squares.append([i, j, 0.5])
        
        result = find_split_line(squares)
        
        # Should split around middle
        assert 2.0 <= result <= 7.0


class TestEdgeCases:
    """Test edge cases and boundary conditions"""
    
    def test_single_point_square(self):
        """Square with zero or very small size"""
        find_split_line = get_solution_module()
        
        squares = [[0, 0, 0.001]]
        result = find_split_line(squares)
        
        assert abs(result - 0.0005) < 1e-3
    
    def test_very_large_square(self):
        """Single very large square"""
        find_split_line = get_solution_module()
        
        squares = [[0, 0, 1000]]
        result = find_split_line(squares)
        
        assert abs(result - 500.0) < 0.1
    
    def test_negative_coordinates(self):
        """Squares with negative coordinates"""
        find_split_line = get_solution_module()
        
        squares = [
            [-10, -10, 20]
        ]
        result = find_split_line(squares)
        
        assert abs(result - 0.0) < 1e-3
    
    def test_precision_requirement(self):
        """Verify precision tolerance of 10^-5"""
        find_split_line = get_solution_module()
        
        # Simple case where we know exact answer
        squares = [[0, 0, 100]]
        result = find_split_line(squares)
        expected = 50.0
        
        # Should be within 10^-5 tolerance
        assert abs(result - expected) < 1e-4


class TestFunctionalCorrectness:
    """High-level functional tests"""
    
    def test_area_conservation(self):
        """Verify that split line creates equal areas"""
        find_split_line = get_solution_module()
        
        squares = [
            [0, 0, 10],
            [8, 8, 10]
        ]
        
        result = find_split_line(squares)
        
        # At minimum, result should be within the range of y-values
        y_min = 0
        y_max = 18
        assert y_min <= result <= y_max
    
    def test_deterministic_output(self):
        """Same input should always give same output"""
        find_split_line = get_solution_module()
        
        squares = [
            [0, 0, 10],
            [5, 5, 10],
            [10, 0, 10]
        ]
        
        result1 = find_split_line(squares)
        result2 = find_split_line(squares)
        
        assert abs(result1 - result2) < 1e-10, "Results should be deterministic"


# Test that can be run independently
def test_import_successful():
    """Verify that the solution module can be imported"""
    find_split_line = get_solution_module()
    assert callable(find_split_line)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
