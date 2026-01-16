def merge_intervals(intervals):
   if not intervals:
       return []
   sorted_intervals = sorted(intervals, key=lambda x: x[0])
   merged = [sorted_intervals[0]]
   for current in sorted_intervals[1:]:
       last = merged[-1]
       if current[0] <= last[1]:
           merged[-1] = (last[0], max(last[1], current[1]))
       else:
           merged.append(current)
   return merged

def compute_union_area(rectangles):
   if not rectangles:
       return 0.0
   events = []
   for x1, y1, x2, y2 in rectangles:
       if x1 >= x2 or y1 >= y2:
           continue
       events.append((x1, 0, y1, y2))
       events.append((x2, 1, y1, y2))
   events.sort(key=lambda x: (x[0], x[1]))
   total_area = 0.0
   previous_x = None
   active_intervals = []
   for event in events:
       current_x, event_type, y1, y2 = event
       if previous_x is not None and current_x > previous_x:
           merged = merge_intervals(active_intervals)
           union_length = sum(y2_ - y1_ for y1_, y2_ in merged)
           total_area += union_length * (current_x - previous_x)
       if event_type == 0:
           active_intervals.append((y1, y2))
       else:
           try:
               active_intervals.remove((y1, y2))
           except ValueError:
               pass
       previous_x = current_x
   return total_area

def compute_area_below(k, squares):
   rectangles = []
   for x, y, l in squares:
       y_bottom = y
       y_top = y + l
       current_y_top = min(k, y_top)
       if current_y_top <= y_bottom:
           continue
       rect = (x, y_bottom, x + l, current_y_top)
       rectangles.append(rect)
   return compute_union_area(rectangles)
   
def find_horizontal_line(squares):
   if not squares:
       return 0.0
   total_rectangles = [(x, y, x + l, y + l) for x, y, l in squares]
   total_area = compute_union_area(total_rectangles)
   if total_area < 1e-9:
       return 0.0
   target = total_area / 2.0
   y_min = min(y for x, y, l in squares)
   y_max = max(y + l for x, y, l in squares)
   max_iterations = 100
   for _ in range(max_iterations):
       mid = (y_min + y_max) / 2
       ab = compute_area_below(mid, squares)
       if ab < target:
           y_min = mid
       else:
           y_max = mid
   return y_max
