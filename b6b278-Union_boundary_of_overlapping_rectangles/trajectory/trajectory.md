# Trajectory: Rectangle Union Boundary

## 1. Problem Understanding

The objective is to compute the **exact boundary (contour)** of the union of multiple axis-aligned rectangles.
The result is not an area calculation, but one or more **closed polygon paths** representing the outer boundary (and possible holes).

## 2. Conceptual References

The approach is inspired by existing geometric insights:

- **StackOverflow discussion** on extracting the _perimeter_ of the union of rectangles (not just the area):
  https://stackoverflow.com/questions/42171051/perimeter-of-union-of-n-rectangles#:~:text=On%20the%20one%20hand%2C%20the,area%20with%20holes%20in%20it.

- **YouTube explanation** of sweep-line thinking applied to geometry problems:
  https://youtu.be/xm5-u_l8tTY?si=Ge2xte3-Oy15bSWr

These references helped clarify \_how boundaries emerge when coverage changes, but the final solution is implemented independently.

## 3. Input Validation

Rectangles with zero or negative width or height are discarded early.
This avoids degenerate cases and simplifies the boundary logic.

## 4. Sweep-Line Event Setup (X-Axis)

Each valid rectangle is converted into two sweep events:

- A **start event** at `x`
- An **end event** at `x + width`

Events are sorted by:

1. X-coordinate
2. Event type (starts before ends)

This ordering ensures rectangles that touch at edges are treated as a single continuous shape.

## 5. Active Interval Tracking (Y-Axis)

As the sweep-line moves from left to right:

- Active Y-intervals are maintained
- Overlapping or touching intervals are merged
- The merged intervals represent the current vertical coverage of the union

## 6. Boundary Segment Extraction

Boundary edges are generated from coverage changes:

- **Horizontal edges**
  Created between consecutive X positions using the current merged Y-intervals.

- **Vertical edges**
  Created by comparing Y-coverage _before_ and _after_ processing all events at the same X.
  Any gained or lost coverage produces a vertical boundary edge.

## 7. Graph Construction

All boundary segments are stored as **directed edges** in an adjacency list:

- Nodes are `(x, y)` points
- Edges represent boundary segments

This transforms the geometric boundary into a graph problem.

## 8. Cycle Detection (Islands and Holes)

The adjacency graph is traversed to extract closed loops:

- Each loop represents one boundary polygon
- Disconnected components naturally form separate paths
- Holes inside shapes also appear as independent closed cycles

## 9. Collinear Point Cleanup

Each extracted path is simplified by removing collinear points:

- Ensures a tight boundary
- Removes unnecessary intermediate vertices
- Preserves axis-aligned geometry

## 10. Final Result

The function returns a list of polygon paths, each defined as an ordered list of `{x, y}` points, representing the complete boundary of the rectangle union.
