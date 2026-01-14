from repository_after import union_rectangle
import unittest

class TestRectangleUnion(unittest.TestCase):

    def assertPathsMatch(self, result_paths, expected_paths):
        """
        Helper to compare result paths with expected paths.
        Normalizes paths by sorting vertices to handle different start points/order.
        """
        self.assertEqual(len(result_paths), len(expected_paths),
                         f"Expected {len(expected_paths)} paths, found {len(result_paths)}")

        # Sort paths by their smallest coordinate to compare consistently
        sorted_results = sorted([sorted([(p['x'], p['y']) for p in path]) for path in result_paths])
        sorted_expected = sorted([sorted(path) for path in expected_paths])

        for res, exp in zip(sorted_results, sorted_expected):
            self.assertEqual(res, exp)

    def test_disconnected_islands(self):
        """Requirement 2: Return separate paths for disconnected regions."""
        rects = [
            {'x': 0, 'y': 0, 'width': 10, 'height': 10},
            {'x': 50, 'y': 50, 'width': 10, 'height': 10}
        ]
        # Expected: Two separate 10x10 squares
        expected = [
            [(0, 0), (10, 0), (10, 10), (0, 10)],
            [(50, 50), (60, 50), (60, 60), (50, 60)]
        ]
        self.assertPathsMatch(union_rectangle.rectangle_union_boundary(rects), expected)

    def test_collinear_cleaning(self):
        """Requirement 3: Remove unnecessary collinear points."""
        rects = [
            {'x': 0, 'y': 0, 'width': 10, 'height': 10},
            {'x': 10, 'y': 0, 'width': 10, 'height': 10}
        ]
        expected = [
            [(0, 0), (20, 0), (20, 10), (0, 10)]
        ]
        result = union_rectangle.rectangle_union_boundary(rects)
        self.assertPathsMatch(result, expected)
        self.assertEqual(len(result[0]), 4, "Collinear points were not removed.")

    def test_zero_dimensions(self):
        """Requirement 4: Handle zero width or height."""
        rects = [
            {'x': 0, 'y': 0, 'width': 10, 'height': 10},
            {'x': 5, 'y': 5, 'width': 0, 'height': 10}, # Zero width
            {'x': 20, 'y': 20, 'width': 10, 'height': 0} # Zero height
        ]
        expected = [[(0, 0), (10, 0), (10, 10), (0, 10)]]
        self.assertPathsMatch(union_rectangle.rectangle_union_boundary(rects), expected)

    def test_exactly_touching_edges(self):
        """Requirement 4: Rectangles that exactly touch at edges."""
        rects = [
            {'x': 0, 'y': 0, 'width': 10, 'height': 10},
            {'x': 0, 'y': 10, 'width': 10, 'height': 10} # Touches bottom edge
        ]
        expected = [[(0, 0), (10, 0), (10, 20), (0, 20)]]
        self.assertPathsMatch(union_rectangle.rectangle_union_boundary(rects), expected)

    def test_exactly_touching_corners(self):
        """Requirement 4: Rectangles that exactly touch at corners."""
        rects = [
            {'x': 0, 'y': 0, 'width': 10, 'height': 10},
            {'x': 10, 'y': 10, 'width': 10, 'height': 10} # Touches at (10,10)
        ]

        result = union_rectangle.rectangle_union_boundary(rects)
        self.assertEqual(len(result), 2)


    def test_identical_and_overlapping(self):
        """Requirement 4: Fully or partially overlapping identical rectangles."""
        rects = [
            {'x': 0, 'y': 0, 'width': 10, 'height': 10},
            {'x': 0, 'y': 0, 'width': 10, 'height': 10}, # Identical
            {'x': 2, 'y': 2, 'width': 6, 'height': 6}    # Fully inside
        ]
        # Expected: Still just one 10x10 rectangle
        expected = [[(0, 0), (10, 0), (10, 10), (0, 10)]]
        self.assertPathsMatch(union_rectangle.rectangle_union_boundary(rects), expected)

    def test_hole_generation(self):
        """Bonus: Ensure internal holes are returned as separate paths."""
        # Create a donut shape using 4 rectangles
        rects = [
            {'x': 0, 'y': 0, 'width': 30, 'height': 10},  # Top
            {'x': 0, 'y': 20, 'width': 30, 'height': 10}, # Bottom
            {'x': 0, 'y': 10, 'width': 10, 'height': 10}, # Left
            {'x': 20, 'y': 10, 'width': 10, 'height': 10} # Right
        ]
        result = union_rectangle.rectangle_union_boundary(rects)
        self.assertEqual(len(result), 2, "Should find an outer boundary and an inner hole.")

if __name__ == '__main__':
    unittest.main(argv=[''], exit=False, verbosity=2)