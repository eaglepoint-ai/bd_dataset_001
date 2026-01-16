from typing import Set, Optional, Callable, Dict, List, Any

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
        self._timestamp_counter += 0.001
        return self._timestamp_counter
    
    def dfs_recursive(
        self,
        start_node: str,
        visited: Optional[Set[str]] = None,
        parent: Optional[str] = None,
        callback: Optional[Callable[[str, str, Optional[str], Dict[str, Any]], None]] = None,
        recursion_depth: int = 0
    ) -> Set[str]:
        if visited is None:
            visited = set()
        
        stack = [(start_node, parent, 0, 'discovery', None)]
        while stack:
            node, parent_node, depth, phase, neighbor_idx = stack.pop()
            
            if phase == 'discovery':
                if node not in visited:
                    discovery_ts = self._get_timestamp()
                    self.discovery_time[node] = discovery_ts
                    
                    if callback:
                        context = {
                            'phase': 'discovery',
                            'depth': depth,
                            'discovery_time': discovery_ts,
                            'visited_count': len(visited)
                        }
                        callback('pre', node, parent_node, context)
                    
                    visited.add(node)
                    self.visited_order.append(node)
                
                # Push completion phase onto stack
                stack.append((node, parent_node, depth, 'completion', None))
                
                # Push neighbors for exploration (last neighbor first for correct order)
                if node in self.graph:
                    neighbors = self.graph[node]
                    for idx in reversed(range(len(neighbors))):
                        neighbor = neighbors[idx]
                        edge = (node, neighbor)
                        
                        if neighbor not in visited:
                            self.edge_classification[edge] = 'tree'
                            if callback:
                                context = {
                                    'phase': 'exploration',
                                    'edge_type': 'tree',
                                    'depth': depth,
                                    'neighbor_index': idx,
                                    'total_neighbors': len(neighbors)
                                }
                                callback('in', node, neighbor, context)
                            stack.append((neighbor, node, depth + 1, 'discovery', None))
                        
                        elif neighbor in visited and neighbor != parent_node:
                            if self.discovery_time[neighbor] < self.discovery_time[node]:
                                self.edge_classification[edge] = 'back'
                                if callback:
                                    context = {
                                        'phase': 'cycle_detection',
                                        'edge_type': 'back',
                                        'cycle_root': neighbor,
                                        'depth': depth,
                                        'discovery_time_diff': self.discovery_time[node] - self.discovery_time[neighbor]
                                    }
                                    callback('cycle', node, neighbor, context)
                        
                        elif neighbor == parent_node:
                            self.edge_classification[edge] = 'parent'
            
            elif phase == 'completion':
                finish_ts = self._get_timestamp()
                self.finish_time[node] = finish_ts
                if callback:
                    context = {
                        'phase': 'completion',
                        'depth': depth,
                        'discovery_time': self.discovery_time[node],
                        'finish_time': finish_ts,
                        'processing_duration': finish_ts - self.discovery_time[node]
                    }
                    callback('post', node, parent_node, context)
        
        return visited
