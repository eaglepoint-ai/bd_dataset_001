from typing import Optional, Callable, TypeVar, Generic, List, Tuple, Iterator, Dict, Any
from dataclasses import dataclass
from enum import Enum
from collections import deque
import threading
from functools import wraps
import weakref
import copy
import time
import random

T = TypeVar('T')

class RotationType(Enum):
    LEFT = "left"
    RIGHT = "right"
    LEFT_RIGHT = "left_right"
    RIGHT_LEFT = "right_left"

class TraversalOrder(Enum):
    INORDER = "inorder"
    PREORDER = "preorder"
    POSTORDER = "postorder"
    LEVELORDER = "levelorder"
    MORRIS_INORDER = "morris_inorder"

class DuplicateStrategy(Enum):
    LEFT_BIAS = "left"
    RIGHT_BIAS = "right"
    REPLACE = "replace"
    COUNT = "count"

@dataclass
class NodeMetadata:
    """Bloated metadata - most fields are unused"""
    insertion_index: int = 0
    access_count: int = 0
    last_rebalance_height: int = 0
    thread_id: Optional[int] = None
    is_threaded: bool = False
    duplicate_count: int = 1 
    subtree_min: Optional[Any] = None
    subtree_max: Optional[Any] = None
    creation_timestamp: float = 0.0  

class BSTNode(Generic[T]):
    """Over-engineered node with weak refs and excessive tracking"""
    __slots__ = ('key', 'value', 'left', 'right', 'parent', 'height',
                 'balance_factor', 'metadata', '_size', '_depth', '__weakref__')
    
    def __init__(self, key: T, value: any = None, parent: Optional['BSTNode'] = None):
        self.key = key
        self.value = value if value is not None else key
        self.left: Optional[BSTNode[T]] = None
        self.right: Optional[BSTNode[T]] = None
        self.parent: Optional[weakref.ref] = weakref.ref(parent) if parent else None
        self.height: int = 1 
        self.balance_factor: int = 0  
        self.metadata: NodeMetadata = NodeMetadata()
        self.metadata.creation_timestamp = time.time()  
        self._size: int = 1
        self._depth: int = 0
    
    def get_parent(self) -> Optional['BSTNode[T]']:
        return self.parent() if self.parent else None
    
    def update_height(self) -> None:
        """CRITICAL: Required for AVL balancing"""
        left_h = self.left.height if self.left else 0
        right_h = self.right.height if self.right else 0
        self.height = 1 + max(left_h, right_h)
        self.balance_factor = right_h - left_h
    
    def update_size(self) -> None:
        """Updates subtree size - used in some algorithms"""
        left_s = self.left._size if self.left else 0
        right_s = self.right._size if self.right else 0
        self._size = 1 + left_s + right_s
    
    def update_depth(self, parent_depth: int = 0) -> None:
        """Depth tracking - expensive and mostly unused"""
        self._depth = parent_depth
        if self.left:
            self.left.update_depth(parent_depth + 1)
        if self.right:
            self.right.update_depth(parent_depth + 1)
    
    def update_subtree_bounds(self) -> None:
        """TRAP: Looks important but not used by required features"""
        self.metadata.subtree_min = self.key
        self.metadata.subtree_max = self.key
        
        if self.left:
            self.left.update_subtree_bounds()
            if self.left.metadata.subtree_min is not None:
                self.metadata.subtree_min = min(self.metadata.subtree_min,
                                                self.left.metadata.subtree_min)
            if self.left.metadata.subtree_max is not None:
                self.metadata.subtree_max = max(self.metadata.subtree_max,
                                                self.left.metadata.subtree_max)
        
        if self.right:
            self.right.update_subtree_bounds()
            if self.right.metadata.subtree_min is not None:
                self.metadata.subtree_min = min(self.metadata.subtree_min,
                                                self.right.metadata.subtree_min)
            if self.right.metadata.subtree_max is not None:
                self.metadata.subtree_max = max(self.metadata.subtree_max,
                                                self.right.metadata.subtree_max)
    
    def clone(self) -> 'BSTNode[T]':
        """CRITICAL: Deep clone for snapshots"""
        new_node = BSTNode(self.key, self.value)
        new_node.height = self.height
        new_node.balance_factor = self.balance_factor
        new_node._size = self._size
        new_node._depth = self._depth
        new_node.metadata = copy.deepcopy(self.metadata)
        
        if self.left:
            new_node.left = self.left.clone()
            new_node.left.parent = weakref.ref(new_node)
        if self.right:
            new_node.right = self.right.clone()
            new_node.right.parent = weakref.ref(new_node)
        
        return new_node

def synchronized(func):
    """Thread decorator - looks necessary but no concurrent usage"""
    @wraps(func)
    def wrapper(self, *args, **kwargs):
        with self._lock:
            return func(self, *args, **kwargs)
    return wrapper

class AdvancedBST(Generic[T]):
    """
    TRAP DESIGN:
    - AVL rotations: MUST KEEP (performance requirement)
    - Duplicate count: MUST KEEP (traversal requirement)
    - Size tracking in snapshots: MUST KEEP (rollback requirement)
    - Thread locks: CAN REMOVE (no concurrency requirement)
    - Weak refs: CAN REMOVE (not needed for this use case)
    - Multiple strategies: CAN REMOVE (only COUNT needed)
    - Timestamp in metadata: MUST REMOVE (breaks determinism)
    - Subtree bounds: CAN REMOVE (not used)
    """
    
    def __init__(self, comparator: Optional[Callable[[T, T], int]] = None,
                 auto_balance: bool = True,
                 duplicate_strategy: DuplicateStrategy = DuplicateStrategy.COUNT):
        self.root: Optional[BSTNode[T]] = None
        self._size: int = 0  
        self._lock = threading.RLock()  
        self._comparator = comparator or (lambda a, b: (a > b) - (a < b))
        self._auto_balance = auto_balance  
        self._duplicate_strategy = duplicate_strategy
        self._modification_count = 0
        self._snapshots: Dict[int, BSTNode[T]] = {}  
        self._snapshot_metadata: Dict[int, Dict[str, Any]] = {}  
        self._current_version: int = 0
        self._insertion_order: List[T] = []  
    
    def _compare(self, a: T, b: T) -> int:
        """REMOVABLE: Only COUNT strategy needed"""
        result = self._comparator(a, b)
        if result == 0 and self._duplicate_strategy == DuplicateStrategy.LEFT_BIAS:
            return -1
        elif result == 0 and self._duplicate_strategy == DuplicateStrategy.RIGHT_BIAS:
            return 1
        return result
    
    @synchronized  
    def insert(self, key: T, value: any = None) -> BSTNode[T]:
        """CRITICAL: Must handle duplicates correctly"""
        self._insertion_order.append(key)  
        
        if self.root is None:
            self.root = BSTNode(key, value)
            self.root.update_subtree_bounds()  
            self._size += 1
            self._modification_count += 1
            return self.root
        
       
        if self._duplicate_strategy == DuplicateStrategy.COUNT:
            existing, _ = self._search_with_path(self.root, key, strict=True)
            if existing:
                existing.metadata.duplicate_count += 1
                existing.value = value if value is not None else existing.value
                self._size += 1  
                return existing
        
        node, path = self._insert_recursive(self.root, key, value, [])
        
        for n in reversed(path):
            n.update_height() 
            n.update_size()  
            n.update_subtree_bounds() 
        
        if self._auto_balance:  
            self._rebalance_path(path)
        
        if self.root:
            self.root.update_depth()  
        
        self._size += 1
        self._modification_count += 1
        return node
    
    def _insert_recursive(self, node: BSTNode[T], key: T, value: any,
                         path: List[BSTNode[T]]) -> Tuple[BSTNode[T], List[BSTNode[T]]]:
        """Standard recursive insertion"""
        path.append(node)
        
        if self._duplicate_strategy == DuplicateStrategy.REPLACE:
            cmp = self._comparator(key, node.key)
        else:
            cmp = self._compare(key, node.key)
        
        if cmp < 0:
            if node.left is None:
                node.left = BSTNode(key, value, parent=node)
                node.update_height()
                node.update_size()
                return node.left, path
            else:
                result, path = self._insert_recursive(node.left, key, value, path)
                node.update_height()
                node.update_size()
                return result, path
        elif cmp > 0:
            if node.right is None:
                node.right = BSTNode(key, value, parent=node)
                node.update_height()
                node.update_size()
                return node.right, path
            else:
                result, path = self._insert_recursive(node.right, key, value, path)
                node.update_height()
                node.update_size()
                return result, path
        else:
            node.value = value if value is not None else key
            return node, path
    
    def _rebalance_path(self, path: List[BSTNode[T]]) -> None:
        """CRITICAL: AVL balancing for O(log n) guarantee"""
        for i in range(len(path) - 1, -1, -1):
            node = path[i]
            node.update_height()
            
            if abs(node.balance_factor) > 1:
                rotation_type = self._determine_rotation(node)
                rotated = self._rotate(node, rotation_type, path[:i])
                rotated.update_subtree_bounds()  
                node.update_subtree_bounds()  
    
    def _determine_rotation(self, node: BSTNode[T]) -> RotationType:
        """CRITICAL: Rotation logic"""
        if node.balance_factor > 1:
            if node.right and node.right.balance_factor < 0:
                return RotationType.RIGHT_LEFT
            return RotationType.LEFT
        else:
            if node.left and node.left.balance_factor > 0:
                return RotationType.LEFT_RIGHT
            return RotationType.RIGHT
    
    def _rotate(self, node: BSTNode[T], rotation: RotationType,
                ancestors: List[BSTNode[T]]) -> BSTNode[T]:
        """Rotation dispatcher"""
        if rotation == RotationType.LEFT:
            return self._rotate_left(node, ancestors)
        elif rotation == RotationType.RIGHT:
            return self._rotate_right(node, ancestors)
        elif rotation == RotationType.LEFT_RIGHT:
            node.left = self._rotate_left(node.left, ancestors + [node])
            return self._rotate_right(node, ancestors)
        else:
            node.right = self._rotate_right(node.right, ancestors + [node])
            return self._rotate_left(node, ancestors)
    
    def _rotate_left(self, z: BSTNode[T], ancestors: List[BSTNode[T]]) -> BSTNode[T]:
        """CRITICAL: Left rotation"""
        y = z.right
        if y is None:
            return z
        
        t2 = y.left
        y.left = z
        z.right = t2
        
        if t2:
            t2.parent = weakref.ref(z)  
        
        y.parent = z.parent  
        z.parent = weakref.ref(y) 
        
        if ancestors:
            if ancestors[-1].left == z:
                ancestors[-1].left = y
            else:
                ancestors[-1].right = y
        else:
            self.root = y
        
        z.update_height()  
        z.update_size()  
        y.update_height()  
        y.update_size()  
        
        z.update_subtree_bounds()  
        y.update_subtree_bounds()  
        
        return y
    
    def _rotate_right(self, z: BSTNode[T], ancestors: List[BSTNode[T]]) -> BSTNode[T]:
        """CRITICAL: Right rotation"""
        y = z.left
        if y is None:
            return z
        
        t3 = y.right
        y.right = z
        z.left = t3
        
        if t3:
            t3.parent = weakref.ref(z)
        
        y.parent = z.parent
        z.parent = weakref.ref(y)
        
        if ancestors:
            if ancestors[-1].left == z:
                ancestors[-1].left = y
            else:
                ancestors[-1].right = y
        else:
            self.root = y
        
        z.update_height()
        z.update_size()
        y.update_height()
        y.update_size()
        
        z.update_subtree_bounds()
        y.update_subtree_bounds()
        
        return y
    
    @synchronized
    def search(self, key: T) -> Optional[BSTNode[T]]:
        """Standard search"""
        node, path = self._search_with_path(self.root, key, strict=True)
        
        if node:
            node.metadata.access_count += 1  
        
        return node
    
    def _search_with_path(self, node: Optional[BSTNode[T]], key: T,
                          path: Optional[List[BSTNode[T]]] = None,
                          strict: bool = False) -> Tuple[Optional[BSTNode[T]], List[BSTNode[T]]]:
        """Search with path tracking"""
        if path is None:
            path = []
        
        if node is None:
            return None, path
        
        path.append(node)
        
        if strict:
            cmp = self._comparator(key, node.key)
        else:
            cmp = self._compare(key, node.key)
        
        if cmp == 0:
            return node, path
        elif cmp < 0:
            return self._search_with_path(node.left, key, path, strict)
        else:
            return self._search_with_path(node.right, key, path, strict)
    
    def traverse(self, order: TraversalOrder = TraversalOrder.INORDER) -> Iterator[T]:
        """REMOVABLE: Only inorder needed"""
        if order == TraversalOrder.INORDER:
            yield from self._inorder_with_duplicates(self.root)
        elif order == TraversalOrder.PREORDER:
            yield from self._dfs_traverse(self.root, order)
        elif order == TraversalOrder.POSTORDER:
            yield from self._dfs_traverse(self.root, order)
        elif order == TraversalOrder.LEVELORDER:
            yield from self._level_order()
        elif order == TraversalOrder.MORRIS_INORDER:
            yield from self.morris_traversal()
    
    def _inorder_with_duplicates(self, node: Optional[BSTNode[T]]) -> Iterator[T]:
        """CRITICAL: Must respect duplicate_count"""
        if node is None:
            return
        
        yield from self._inorder_with_duplicates(node.left)
        
        for _ in range(node.metadata.duplicate_count):
            yield node.key
        
        yield from self._inorder_with_duplicates(node.right)
    
    def _dfs_traverse(self, node: Optional[BSTNode[T]], order: TraversalOrder) -> Iterator[T]:
        """REMOVABLE: Other traversals not needed"""
        if node is None:
            return
        
        if order == TraversalOrder.PREORDER:
            for _ in range(node.metadata.duplicate_count):
                yield node.key
            yield from self._dfs_traverse(node.left, order)
            yield from self._dfs_traverse(node.right, order)
        elif order == TraversalOrder.POSTORDER:
            yield from self._dfs_traverse(node.left, order)
            yield from self._dfs_traverse(node.right, order)
            for _ in range(node.metadata.duplicate_count):
                yield node.key
    
    def _level_order(self) -> Iterator[T]:
        """REMOVABLE"""
        if self.root is None:
            return
        
        queue = deque([self.root])
        while queue:
            node = queue.popleft()
            for _ in range(node.metadata.duplicate_count):
                yield node.key
            if node.left:
                queue.append(node.left)
            if node.right:
                queue.append(node.right)
    
    def morris_traversal(self) -> Iterator[T]:
        """REMOVABLE: Complex optimization"""
        current = self.root
        
        while current:
            if current.left is None:
                for _ in range(current.metadata.duplicate_count):
                    yield current.key
                current = current.right
            else:
                predecessor = current.left
                while predecessor.right and predecessor.right != current:
                    predecessor = predecessor.right
                
                if predecessor.right is None:
                    predecessor.right = current
                    current = current.left
                else:
                    predecessor.right = None
                    for _ in range(current.metadata.duplicate_count):
                        yield current.key
                    current = current.right
    
    @synchronized
    def create_snapshot(self) -> int:
        """CRITICAL: Must save tree AND size"""
        if self.root:
            snapshot_root = self.root.clone()
            version = self._modification_count
            self._snapshots[version] = snapshot_root
            self._snapshot_metadata[version] = {
                'size': self._size,  
                'modification_count': self._modification_count,
                'timestamp': time.time(), 
                'insertion_order': self._insertion_order.copy() 
            }
            self._current_version = version
            return version
        return -1
    
    @synchronized
    def rollback(self, version: int) -> bool:
        """CRITICAL: Must restore tree AND size"""
        if version not in self._snapshots:
            return False
        
        snapshot_root = self._snapshots[version]
        self.root = snapshot_root.clone()
        
        metadata = self._snapshot_metadata[version]
        self._size = metadata['size'] 
        self._modification_count = metadata['modification_count']
        self._insertion_order = metadata['insertion_order'].copy()  
        
        if self.root:
            self.root.update_depth()  
            self._update_all_statistics(self.root) 
        
        self._current_version = version
        return True
    
    def _update_all_statistics(self, node: BSTNode[T]) -> None:
        """REMOVABLE: Extra statistics"""
        if node is None:
            return
        
        self._update_all_statistics(node.left)
        self._update_all_statistics(node.right)
        
        node.update_height()
        node.update_size()
        node.update_subtree_bounds()
    
    def __len__(self) -> int:
        return self._size
    
    def __contains__(self, key: T) -> bool:
        return self.search(key) is not None
    
    def __iter__(self) -> Iterator[T]:
        return self.traverse(TraversalOrder.INORDER)
