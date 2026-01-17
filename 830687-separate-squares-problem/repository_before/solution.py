from typing import List


def find_split_line(squares: List[List[int]]) -> float:
    """Find horizontal line that splits union of squares into equal areas."""
    if not squares:
        return 0.0
    
    if not all(len(sq) == 3 for sq in squares):
        raise ValueError("Each square must have exactly 3 values: [x, y, side_length]")
    
    total_area = compute_union_area(squares)
    
    if total_area == 0:
        return 0.0
    
    target_area = total_area / 2.0
    
    y_coords = set()
    for x, y, side in squares:
        y_coords.add(y)
        y_coords.add(y + side)
    
    y_min = min(y_coords)
    y_max = max(y_coords)
    
    tolerance = 1e-5
    left, right = y_min, y_max
    
    candidates = sorted(y_coords)
    best_y = (y_min + y_max) / 2.0
    best_diff = float('inf')
    
    for y_candidate in candidates:
        area_below = compute_area_below(squares, y_candidate)
        diff = abs(area_below - target_area)
        if diff < best_diff:
            best_diff = diff
            best_y = y_candidate
    
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
    """Compute total area of union of squares using coordinate compression."""
    if not squares:
        return 0.0
    
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
    
    for i in range(len(x_sorted) - 1):
        for j in range(len(y_sorted) - 1):
            x1, x2 = x_sorted[i], x_sorted[i + 1]
            y1, y2 = y_sorted[j], y_sorted[j + 1]
            
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
    """Compute union area of squares below given y-coordinate."""
    clipped_squares = []
    
    for x, y, side in squares:
        y_top = y + side
        
        if y >= split_y:
            continue
        
        if y_top <= split_y:
            clipped_squares.append([x, y, side])
        else:
            new_height = split_y - y
            if new_height > 0:
                clipped_squares.append([x, y, side])
    
    return compute_union_area_clipped(clipped_squares, split_y)


def compute_union_area_clipped(squares: List[List[int]], clip_y: float) -> float:
    """Compute union area with top edge clipped at clip_y."""
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
