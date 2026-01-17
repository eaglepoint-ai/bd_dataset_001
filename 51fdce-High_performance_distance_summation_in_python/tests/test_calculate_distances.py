import pytest
import math
import inspect
import calculate_distances

class TestEuclideanDistance:
    def test_correctness(self):
        """Requirement 5: Preserve correct computation of the total Euclidean distance."""
        points = [
            calculate_distances.Point(0, 0),
            calculate_distances.Point(3, 4),  # dist 5
            calculate_distances.Point(5, 12)  # dist 13
        ]
        total = calculate_distances.calculate_distances(points)
        assert abs(total - 18.0) < 1e-9, "Total distance calculation is incorrect"

    def test_memory_optimization_slots(self):
        """Requirement 2: Reduce memory overhead caused by unnecessary list creation (Point slots)."""
        p = calculate_distances.Point(1, 1)
        # Point should use __slots__ to save memory, so no __dict__
        assert not hasattr(p, '__dict__'), "Point class should use __slots__ for memory efficiency"

    def test_no_redundant_list_creation(self):
        """Requirement 2: Reduce memory overhead - avoid accumulating results in a list."""
        source = inspect.getsource(calculate_distances.calculate_distances)
        # Should not use .append() which implies building a full list
        assert "append(" not in source, "Function should not build a list using .append()"
        # Should likely use sum() directly on a generator
        assert "sum(" in source, "Function should likely use sum() directly"

    def test_cpu_efficiency_computation(self):
        """Requirement 1 & 3: Minimize redundant computations and CPU efficiency."""
        source = inspect.getsource(calculate_distances.calculate_distances)
        # Should use x*x instead of x**2 for efficiency
        assert "**2" not in source, "Avoid using **2 (exponentiation) as it is slower than multiplication"

    def test_line_count_limit(self):
        """Requirement 4: Keep the solution under 50 lines."""
        source = inspect.getsource(calculate_distances)
        # Inspecting the module source usually gives the whole file content if we read the file
        # inspect.getsource(module) might fail if it's imported weirdly, let's read file directly
        filename = calculate_distances.__file__
        with open(filename, 'r') as f:
            lines = f.readlines()
        
        # Filter out empty lines? Requirement says "Keep the solution under 50 lines". 
        # Usually implies total lines in file.
        count = len(lines)
        assert count < 50, f"Solution is {count} lines, should be under 50"

    def test_pure_python(self):
        """Requirement 4: Pure Python."""
        # Check imports in source?
        filename = calculate_distances.__file__
        with open(filename, 'r') as f:
            content = f.read()
        
        assert "import numpy" not in content, "Should be pure Python, no numpy"
        assert "import pandas" not in content, "Should be pure Python, no pandas"
