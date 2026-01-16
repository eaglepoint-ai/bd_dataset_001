import pytest
from typing import List, Tuple, Dict, Any
from repository_before.dfs_recursive import Graph
import tracemalloc
import time


def test_single_node_dfs():
    g = Graph()
    g.graph["A"] = []

    visited = g.dfs_recursive("A")

    assert visited == {"A"}
    assert g.visited_order == ["A"]
    assert "A" in g.discovery_time
    assert "A" in g.finish_time
    assert g.discovery_time["A"] < g.finish_time["A"]


def test_linear_graph_dfs_order_and_edges():
    g = Graph()
    g.add_edge("A", "B")
    g.add_edge("B", "C")

    visited = g.dfs_recursive("A")

    assert visited == {"A", "B", "C"}
    assert g.visited_order == ["A", "B", "C"]

    assert g.edge_classification[("A", "B")] == "tree"
    assert g.edge_classification[("B", "C")] == "tree"


def test_branching_graph_tree_edges():
    g = Graph()
    g.add_edge("A", "B")
    g.add_edge("A", "C")

    visited = g.dfs_recursive("A")

    assert visited == {"A", "B", "C"}
    assert g.edge_classification[("A", "B")] == "tree"
    assert g.edge_classification[("A", "C")] == "tree"


def test_cycle_detection_back_edge():
    g = Graph()
    g.add_edge("A", "B")
    g.add_edge("B", "C")
    g.add_edge("C", "A")

    visited = g.dfs_recursive("A")

    assert visited == {"A", "B", "C"}
    assert g.edge_classification[("C", "A")] == "back"


def test_parent_edge_classification():
    g = Graph()
    g.add_edge("A", "B")
    g.add_edge("B", "A")

    g.dfs_recursive("A")

    assert g.edge_classification[("B", "A")] == "parent"


def test_discovery_and_finish_times_monotonic():
    g = Graph()
    g.add_edge("A", "B")
    g.add_edge("B", "C")

    g.dfs_recursive("A")

    for node in ["A", "B", "C"]:
        assert g.discovery_time[node] < g.finish_time[node]

    assert (
        g.discovery_time["A"]
        < g.discovery_time["B"]
        < g.discovery_time["C"]
    )


def test_callback_invocation_and_context_integrity():
    g = Graph()
    g.add_edge("A", "B")

    events: List[Tuple[str, str, str, Dict[str, Any]]] = []

    def callback(phase, node, related, context):
        events.append((phase, node, related, context))

    g.dfs_recursive("A", callback=callback)

    phases = [e[0] for e in events]

    assert "pre" in phases
    assert "post" in phases
    assert any(
        e[0] == "in" and e[3]["edge_type"] == "tree"
        for e in events
    )

    for _, _, _, context in events:
        assert "depth" in context


def test_recursion_depth_tracking():
    g = Graph()
    g.add_edge("A", "B")
    g.add_edge("B", "C")

    depths = {}

    def callback(phase, node, _, context):
        if phase == "pre":
            depths[node] = context["depth"]

    g.dfs_recursive("A", callback=callback)

    assert depths == {"A": 0, "B": 1, "C": 2}

def test_deterministic_execution():
    g = Graph()
    g.add_edge("A", "B")
    g.add_edge("B", "C")
    g.add_edge("C", "D")

    first_run = g.dfs_recursive("A")
    first_order = list(g.visited_order)
    first_discovery = dict(g.discovery_time)
    first_finish = dict(g.finish_time)
    first_edges = dict(g.edge_classification)

    # Reset graph internal states
    g.visited_order = []
    g.discovery_time = {}
    g.finish_time = {}
    g.edge_classification = {}
    g._timestamp_counter = 0.0

    second_run = g.dfs_recursive("A")
    second_order = list(g.visited_order)
    second_discovery = dict(g.discovery_time)
    second_finish = dict(g.finish_time)
    second_edges = dict(g.edge_classification)

    assert first_run == second_run
    assert first_order == second_order
    assert first_discovery == second_discovery
    assert first_finish == second_finish
    assert first_edges == second_edges

def test_dfs_space_scaling_ov():
    input_sizes = [1000, 2000, 4000, 8000]
    memory_usages = []

    for V in input_sizes:
        g = Graph()

        # Build a deep linear graph (worst case)
        for i in range(V - 1):
            g.add_edge(str(i), str(i + 1))

        tracemalloc.start()

        g.dfs_recursive("0")

        _, peak = tracemalloc.get_traced_memory()
        tracemalloc.stop()

        memory_usages.append(peak)

    # Compute ratios
    ratio1 = memory_usages[1] / memory_usages[0]
    ratio2 = memory_usages[2] / memory_usages[1]
    ratio3 = memory_usages[3] / memory_usages[2]

    print(f"Memory usage ratios: {ratio1:.2f}, {ratio2:.2f}, {ratio3:.2f}")

    # Linear growth check (not exact doubling)
    assert ratio1 > 1.5
    assert ratio2 > 1.5
    assert ratio3 > 1.5

def test_dfs_time_scaling_linear_graph():
    input_sizes = [1000, 2000, 4000, 8000]
    times = []

    for V in input_sizes:
        g = Graph()
        for i in range(V - 1):
            g.add_edge(str(i), str(i + 1))

        runs = 5
        total_time = 0.0

        for _ in range(runs):
            start = time.perf_counter()
            g.dfs_recursive("0")
            total_time += time.perf_counter() - start

        times.append(total_time / runs)

    ratio1 = times[1] / times[0]
    ratio2 = times[2] / times[1]
    ratio3 = times[3] / times[2]

    print(f"Time ratios: {ratio1:.2f}, {ratio2:.2f}, {ratio3:.2f}")

    # Linear growth check (not exact doubling)
    assert ratio1 > 1.5
    assert ratio2 > 1.5
    assert ratio3 > 1.5

def test_edge_classification_integrity():
    g = Graph()
    g.add_edge("A", "B")
    g.add_edge("B", "C")
    g.add_edge("C", "A")  # cycle
    g.add_edge("B", "D")

    g.dfs_recursive("A")

    visited_nodes = set(g.visited_order)  # all nodes seen in DFS

    for edge, edge_type in g.edge_classification.items():
        u, v = edge
        assert edge_type in {"tree", "back", "parent", "forward", "cross"}
        assert u in g.graph
        # v must either have been visited or it's a back edge
        assert v in visited_nodes or edge_type == "back"
