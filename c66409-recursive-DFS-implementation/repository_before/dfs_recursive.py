from typing import Set, Optional, Callable, Dict, List, Any
from datetime import datetime
import time

class Graph:
    def __init__(self):
        self.graph: Dict[str, List[str]] = {}
        self.visited_order: List[str] = []
        self.discovery_time: Dict[str, float] = {}
        self.finish_time: Dict[str, float] = {}
        self.edge_classification: Dict[tuple, str] = {}
        self._timestamp_counter: float = 0.0
    
    def add_edge(self, u: str, v: str):
        if u not in self.graph:
            self.graph[u] = []
        self.graph[u].append(v)
    
    def _get_timestamp(self) -> float:
        """Monotonic timestamp generator for traversal ordering"""
        self._timestamp_counter += 0.001
        return self._timestamp_counter
    
    def dfs_recursive(
        self,
        node: str,
        visited: Optional[Set[str]] = None,
        parent: Optional[str] = None,
        callback: Optional[Callable[[str, str, Optional[str], Dict[str, Any]], None]] = None,
        recursion_depth: int = 0
    ) -> Set[str]:
        """
        Advanced DFS with enterprise features:
        - Pre-order, in-order, and post-order callbacks with metadata
        - Parent tracking for path reconstruction
        - Edge classification (tree/back/forward/cross)
        - Discovery and finish timestamps
        - Recursion depth tracking for stack analysis
        - Metadata propagation through callback context
        """
        if visited is None:
            visited = set()
        
        # Discovery phase: Pre-order processing
        discovery_ts = self._get_timestamp()
        self.discovery_time[node] = discovery_ts
        
        if callback:
            context = {
                'phase': 'discovery',
                'depth': recursion_depth,
                'discovery_time': discovery_ts,
                'visited_count': len(visited)
            }
            callback('pre', node, parent, context)
        
        visited.add(node)
        self.visited_order.append(node)
        
        # Exploration phase: Process neighbors with edge classification
        if node in self.graph:
            neighbors = self.graph[node]
            for idx, neighbor in enumerate(neighbors):
                edge = (node, neighbor)
                
                if neighbor not in visited:
                    # Tree edge: First discovery
                    self.edge_classification[edge] = 'tree'
                    
                    if callback:
                        context = {
                            'phase': 'exploration',
                            'edge_type': 'tree',
                            'depth': recursion_depth,
                            'neighbor_index': idx,
                            'total_neighbors': len(neighbors)
                        }
                        callback('in', node, neighbor, context)
                    
                    # Recursive descent
                    self.dfs_recursive(neighbor, visited, node, callback, recursion_depth + 1)
                    
                elif neighbor in visited and neighbor != parent:
                    # Back edge: Cycle detected
                    if self.discovery_time[neighbor] < self.discovery_time[node]:
                        self.edge_classification[edge] = 'back'
                        
                        if callback:
                            context = {
                                'phase': 'cycle_detection',
                                'edge_type': 'back',
                                'cycle_root': neighbor,
                                'depth': recursion_depth,
                                'discovery_time_diff': self.discovery_time[node] - self.discovery_time[neighbor]
                            }
                            callback('cycle', node, neighbor, context)
                
                elif neighbor == parent:
                    # Parent edge: Skip (undirected graph handling)
                    self.edge_classification[edge] = 'parent'
        
        # Completion phase: Post-order processing
        finish_ts = self._get_timestamp()
        self.finish_time[node] = finish_ts
        
        if callback:
            context = {
                'phase': 'completion',
                'depth': recursion_depth,
                'discovery_time': discovery_ts,
                'finish_time': finish_ts,
                'processing_duration': finish_ts - discovery_ts
            }
            callback('post', node, parent, context)
        
        return visited
