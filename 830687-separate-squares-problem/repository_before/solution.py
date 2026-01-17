"""
Naive Solution for Finding Equal-Area Split Line
=================================================

This is the "before" implementation - simple, correct, but not optimized.

Approach:
- Brute-force computation of union area using rectangle decomposition
- Test all candidate y-coordinates from square boundaries
- O(n²) or O(n³) time complexity - doesn't scale well

This works correctly but is inefficient for large inputs.
"""

from typing import List, Tuple, Set


def find_split_line(squares: List[List[int]]) -> float:
    """
    Find the horizontal line that splits the union of squares into equal areas.
    
    Args:
        squares: List of [x, y, side_length] where (x, y) is bottom-left corner
        
    Returns:
        The y-coordinate of the splitting line (precision: 10^-5)
        
    Algorithm (Naive):
    1. Collect all unique y-coordinates (square boundaries)
    2. Compute total union area using brute-force
    3. Binary search through y-candidates to find where area_below = total_area / 2
    """
    if not squares:
        return 0.0
    
    # Validate input
    if not all(len(sq) == 3 for sq in squares):
        raise ValueError("Each square must have exactly 3 values: [x, y, side_length]")
    
    # Compute total area using naive method
    total_area = compute_union_area(squares)
    
    if total_area == 0:
        return 0.0
    
    target_area = total_area / 2.0
    
    # Collect all unique y-coordinates as candidates
    y_coords = set()
    for x, y, side in squares:
        y_coords.add(y)           # bottom edge
        y_coords.add(y + side)    # top edge
    
    y_min = min(y_coords)
    y_max = max(y_coords)
    
    # Binary search for the split line
    # Precision tolerance: 10^-5
    tolerance = 1e-5
    left, right = y_min, y_max
    
    # Also try exact candidates
    candidates = sorted(y_coords)
    best_y = (y_min + y_max) / 2.0
    best_diff = float('inf')
    
    # First check discrete candidates
    for y_candidate in candidates:
        area_below = compute_area_below(squares, y_candidate)
        diff = abs(area_below - target_area)
        if diff < best_diff:
            best_diff = diff
            best_y = y_candidate
    
    # Refine with binary search
    max_iterations = 100
    for _ in range(max_iterations):
        mid = (left + right) / 2.0
        area_below = compute_area_below(squares, mid)
        
        diff = abs(area_below - target_area)
        if diff < best_diff:
            best_diff = diff
            best_y = mid
        
        if abs(area_below - target_area) < tolerance:
            break
        
        if area_below < target_area:
            left = mid
        else:
            right = mid
        
        if right - left < tolerance:
            break
    
    return best_y


def compute_union_area(squares: List[List[int]]) -> float:
    """
    Compute the total area of the union of squares (overlaps counted once).
    
    Naive approach: Use a grid-based method with fine granularity.
    This is simple but inefficient - O(n * resolution²)
    """
    if not squares:
        return 0.0
    
    # For small inputs, use exact computation
    # For large inputs, this becomes prohibitively expensive
    
    # Use coordinate compression approach (still naive)
    x_coords = set()
    y_coords = set()
    
    for x, y, side in squares:
        x_coords.add(x)
        x_coords.add(x + side)
        y_coords.add(y)
        y_coords.add(y + side)
    
    x_sorted = sorted(x_coords)
    y_sorted = sorted(y_coords)
    
    total_area = 0.0
    
    # Check each grid cell
    for i in range(len(x_sorted) - 1):
        for j in range(len(y_sorted) - 1):
            x1, x2 = x_sorted[i], x_sorted[i + 1]
            y1, y2 = y_sorted[j], y_sorted[j + 1]
            
            # Check if this cell is covered by any square
            cell_covered = False
            for sx, sy, side in squares:
                if (sx <= x1 < x2 <= sx + side and 
                    sy <= y1 < y2 <= sy + side):
                    cell_covered = True
                    break
            
            if cell_covered:
                total_area += (x2 - x1) * (y2 - y1)
    
    return total_area


def compute_area_below(squares: List[List[int]], split_y: float) -> float:
    """
    Compute the union area of all squares below the given y-coordinate.
    
    Clips squares at split_y and computes union area of clipped portions.
    This is the bottleneck - called many times during binary search.
    """
    clipped_squares = []
    
    for x, y, side in squares:
        y_top = y + side
        
        # Skip if entirely above split line
        if y >= split_y:
            continue
        
        # Take full square if entirely below
        if y_top <= split_y:
            clipped_squares.append([x, y, side])
        else:
            # Clip the square at split_y
            new_height = split_y - y
            if new_height > 0:
                # Create clipped square (rectangle)
                # For area computation, we need to handle as rectangle
                # Store as [x, y, width, height]
                clipped_squares.append([x, y, side])  # will handle in area computation
    
    # Compute union area of clipped squares
    # Reuse the same naive method
    return compute_union_area_clipped(clipped_squares, split_y)


def compute_union_area_clipped(squares: List[List[int]], clip_y: float) -> float:
    """
    Compute union area with top edge clipped at clip_y.
    """
    if not squares:
        return 0.0
    
    x_coords = set()
    y_coords = set()
    
    for x, y, side in squares:
        x_coords.add(x)
        x_coords.add(x + side)
        y_coords.add(y)
        y_coords.add(min(y + side, clip_y))
    
    x_sorted = sorted(x_coords)
    y_sorted = sorted(y_coords)
    
    total_area = 0.0
    
    for i in range(len(x_sorted) - 1):
        for j in range(len(y_sorted) - 1):
            x1, x2 = x_sorted[i], x_sorted[i + 1]
            y1, y2 = y_sorted[j], y_sorted[j + 1]
            
            # Cell must be below clip line
            if y2 > clip_y:
                continue
            
            cell_covered = False
            for sx, sy, side in squares:
                sy_top = min(sy + side, clip_y)
                if (sx <= x1 < x2 <= sx + side and 
                    sy <= y1 < y2 <= sy_top):
                    cell_covered = True
                    break
            
            if cell_covered:
                total_area += (x2 - x1) * (y2 - y1)
    
    return total_area
