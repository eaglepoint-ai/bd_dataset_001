import collections

def rectangle_union_boundary(rects):
    """
    Calculates the boundary of the union of multiple rectangles.

    Args:
        rects: List of dicts {'x', 'y', 'width', 'height'}

    Returns:
        List of lists of Points [{'x', 'y'}, ...] representing the boundary polygons.
    """
    # Edge Case: Zero Dimensions. Filter them out immediately.
    valid_rects = []
    for r in rects:
        if r['width'] > 0 and r['height'] > 0:
            valid_rects.append(r)

    if not valid_rects:
        return []

    # Create Events for Sweep-Line
    # Events: (x, type, y_min, y_max)
    # type: +1 for Left Edge (Start), -1 for Right Edge (End)
    events = []
    for r in valid_rects:
        events.append((r['x'], 1, r['y'], r['y'] + r['height']))
        events.append((r['x'] + r['width'], -1, r['y'], r['y'] + r['height']))

    events.sort(key=lambda e: (e[0], -e[1]))
    adj = collections.defaultdict(list)

    # 3. Sweep-Line Process
    active_y_intervals = []
    prev_x = events[0][0]

    for x, type, y1, y2 in events:
        if x > prev_x:
            covered_ranges = _merge_intervals(active_y_intervals)

            # For every covered vertical range, add horizontal edges top and bottom
            for cy1, cy2 in covered_ranges:
                _add_edge(adj, prev_x, cy1, x, cy1)
                _add_edge(adj, x, cy2, prev_x, cy2)

            prev_x = x

        if type == 1:
            active_y_intervals.append((y1, y2))
        else:
            active_y_intervals.remove((y1, y2))

    events_by_x = collections.defaultdict(list)
    for e in events:
        events_by_x[e[0]].append(e)

    sorted_x = sorted(events_by_x.keys())

    active_y_intervals = [] # Reset
    adj = collections.defaultdict(list) # Reset

    for i, x in enumerate(sorted_x):
        prev_covered = _merge_intervals(active_y_intervals)
        current_events = events_by_x[x]
        for _, type, y1, y2 in current_events:
            if type == 1:
                active_y_intervals.append((y1, y2))
            else:
                active_y_intervals.remove((y1, y2))

        curr_covered = _merge_intervals(active_y_intervals)

        if i < len(sorted_x) - 1:
            next_x = sorted_x[i+1]
            for y1, y2 in curr_covered:
                _add_edge(adj, x, y1, next_x, y1) # Top
                _add_edge(adj, next_x, y2, x, y2) # Bottom

        verticals = _diff_intervals(prev_covered, curr_covered)

        for y1, y2, type in verticals:
            if type == 'LOST':
                _add_edge(adj, x, y1, x, y2)
            elif type == 'GAINED':
                _add_edge(adj, x, y2, x, y1)

    paths = []
    visited_edges = set()

    for start_pt in list(adj.keys()):
        while adj[start_pt]:
            curr = start_pt
            path = []

            # Walk the cycle
            while True:
                path.append(curr)
                if not adj[curr]:
                    break

                next_pt = adj[curr].pop(0) # Take one edge

                edge_id = (curr, next_pt)
                if edge_id in visited_edges:
                     break
                visited_edges.add(edge_id)

                curr = next_pt
                if curr == start_pt:
                    break

            if path:
                cleaned_path = _clean_collinear(path)
                if len(cleaned_path) >= 4:
                    paths.append([{'x': p[0], 'y': p[1]} for p in cleaned_path])

    return paths

def _add_edge(adj, x1, y1, x2, y2):
    """Helper to add directed edge."""
    if (x1, y1) == (x2, y2): return
    adj[(x1, y1)].append((x2, y2))

def _merge_intervals(intervals):
    """
    Merges overlapping or adjacent intervals.
    Input: List of (y1, y2) tuples.
    Output: Sorted list of disjoint (y1, y2) tuples.
    """
    if not intervals:
        return []

    sorted_intervals = sorted(intervals, key=lambda x: (x[0], x[1]))
    merged = []

    current_start, current_end = sorted_intervals[0]

    for i in range(1, len(sorted_intervals)):
        next_start, next_end = sorted_intervals[i]

        if next_start < current_end:
            current_end = max(current_end, next_end)
        elif next_start == current_end:
            current_end = max(current_end, next_end)
        else:
            merged.append((current_start, current_end))
            current_start, current_end = next_start, next_end

    merged.append((current_start, current_end))
    return merged

def _diff_intervals(prev, curr):
    """
    Calculates the difference between two sets of sorted disjoint intervals.
    Returns list of (y1, y2, type) where type is 'GAINED' or 'LOST'.
    """
    diffs = []
    i, j = 0, 0
    # Sweep-line along Y axis
    y = -float('inf')

    while i < len(prev) or j < len(curr):
        ys = set()
        if i < len(prev): ys.add(prev[i][0]); ys.add(prev[i][1])
        if j < len(curr): ys.add(curr[j][0]); ys.add(curr[j][1])

        if not ys: break

        sorted_ys = sorted(list(ys))

        for k in range(len(sorted_ys) - 1):
            mid_y = (sorted_ys[k] + sorted_ys[k+1]) / 2

            in_prev = False
            while i < len(prev) and prev[i][1] <= sorted_ys[k]: i += 1
            if i < len(prev) and prev[i][0] <= mid_y <= prev[i][1]: in_prev = True

            in_curr = False
            while j < len(curr) and curr[j][1] <= sorted_ys[k]: j += 1
            if j < len(curr) and curr[j][0] <= mid_y <= curr[j][1]: in_curr = True

            if in_curr and not in_prev:
                diffs.append((sorted_ys[k], sorted_ys[k+1], 'GAINED'))
            elif in_prev and not in_curr:
                diffs.append((sorted_ys[k], sorted_ys[k+1], 'LOST'))

        break

    points = []
    for s, e in prev:
        points.append((s, -1))
        points.append((e, 1))
    for s, e in curr:
        points.append((s, 2))
        points.append((e, -2))

    all_y = sorted(list(set([x[0] for x in prev] + [x[1] for x in prev] +
                            [x[0] for x in curr] + [x[1] for x in curr])))

    diffs = []
    for k in range(len(all_y) - 1):
        y_start = all_y[k]
        y_end = all_y[k+1]
        mid = (y_start + y_end) / 2

        in_p = any(s <= mid <= e for s,e in prev)
        in_c = any(s <= mid <= e for s,e in curr)

        if in_c and not in_p:
            if diffs and diffs[-1][2] == 'GAINED' and diffs[-1][1] == y_start:
                diffs[-1] = (diffs[-1][0], y_end, 'GAINED')
            else:
                diffs.append((y_start, y_end, 'GAINED'))
        elif in_p and not in_c:
            if diffs and diffs[-1][2] == 'LOST' and diffs[-1][1] == y_start:
                diffs[-1] = (diffs[-1][0], y_end, 'LOST')
            else:
                diffs.append((y_start, y_end, 'LOST'))

    return diffs

def _clean_collinear(path):
    """
    Removes unnecessary collinear vertices from a path.
    Args:
        path: List of (x, y) tuples.
    Returns:
        List of (x, y) tuples.
    """
    if len(path) < 3: return path


    stack = [path[0]]

    for i in range(1, len(path) + 1):
        pt = path[i % len(path)]

        while len(stack) >= 2:
            p2 = stack[-1]
            p1 = stack[-2]
            p3 = pt
            val = (p2[1] - p1[1]) * (p3[0] - p2[0]) - (p3[1] - p2[1]) * (p2[0] - p1[0])

            if val == 0:
                stack.pop()
            else:
                break
        stack.append(pt)
    if len(stack) > 1 and stack[0] == stack[-1]:
        stack.pop()

    return stack