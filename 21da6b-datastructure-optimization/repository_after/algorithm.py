import collections

class SegmentTreeNode:
    def __init__(self, y_low, y_high):
        self.y_low = y_low
        self.y_high = y_high
        self.full_height = y_high - y_low
        self.count = 0
        self.left = None
        self.right = None

    def update_range(self, q_low, q_high, val):
        """Updates the coverage count for a specific Y-range."""
        if q_low <= self.y_low and self.y_high <= q_high:
            self.count += val
            return
        
        if self.left and q_low < self.left.y_high:
            self.left.update_range(q_low, q_high, val)
        if self.right and q_high > self.right.y_low:
            self.right.update_range(q_low, q_high, val)
    
    def get_active_length(self):
        """Returns current active length in this Y-range"""
        if self.count > 0:
            return self.full_height
        elif self.left:
            return self.left.get_active_length() + self.right.get_active_length()
        return 0.0

def build_tree(y_coords):
    """Builds a segment tree from compressed Y-coordinates."""
    if len(y_coords) < 2:
        return None
    if len(y_coords) == 2:
        return SegmentTreeNode(y_coords[0], y_coords[1])
    
    mid_idx = len(y_coords) // 2
    node = SegmentTreeNode(y_coords[0], y_coords[-1])
    node.left = build_tree(y_coords[:mid_idx+1])
    node.right = build_tree(y_coords[mid_idx:])
    return node

def find_horizontal_line(squares):
    if not squares:
        return 0.0

    # Coordinate Compression
    y_set = set()
    events = []
    for x, y, l in squares:
        y_set.add(y)
        y_set.add(y + l)
        events.append((x, 1, y, y + l))
        events.append((x + l, -1, y, y + l))
    
    sorted_y = sorted(list(y_set))
    events.sort()

    # Build Segment Tree
    root = build_tree(sorted_y)
    
    # First pass: compute total area
    prev_x = events[0][0]
    total_area = 0.0
    
    for x, event_type, y1, y2 in events:
        dx = x - prev_x
        if dx > 0:
            total_area += dx * root.get_active_length()
        root.update_range(y1, y2, event_type)
        prev_x = x

    if total_area < 1e-12:
        return sorted_y[0]
    
    target = total_area / 2.0
    
    # Second pass: find split line
    root2 = build_tree(sorted_y)
    prev_x = events[0][0]
    cumulative = 0.0
    
    for x, event_type, y1, y2 in events:
        dx = x - prev_x
        if dx > 0:
            active_length = root2.get_active_length()
            area_slice = dx * active_length
            
            if cumulative + area_slice >= target:
                # Split is in this x-range
                remaining = target - cumulative
                y_offset = remaining / active_length if active_length > 0 else 0
                
                # Find exact y coordinate
                def find_y_at_offset(node, offset):
                    if not node.left:
                        return node.y_low + offset
                    left_len = node.left.get_active_length()
                    if offset <= left_len:
                        return find_y_at_offset(node.left, offset)
                    return find_y_at_offset(node.right, offset - left_len)
                
                return find_y_at_offset(root2, y_offset)
            
            cumulative += area_slice
        
        root2.update_range(y1, y2, event_type)
        prev_x = x
    
    return sorted_y[-1]
