from typing import Optional, Callable, TypeVar, Iterator, Dict
from dataclasses import dataclass

T = TypeVar('T')

@dataclass
class NodeMetadata:
    """Minimal metadata - only what's needed for duplicates"""
    duplicate_count: int = 1

class BSTNode:
    """Streamlined node - only essential fields"""
    __slots__ = ('key', 'value', 'left', 'right', 'height', 'metadata')
    
    def __init__(self, key, value=None):
        self.key = key
        self.value = value if value is not None else key
        self.left: Optional['BSTNode'] = None
        self.right: Optional['BSTNode'] = None
        self.height: int = 1
        self.metadata: NodeMetadata = NodeMetadata()
    
    def update_height(self) -> int:
        """Update height and return balance factor"""
        left_h = self.left.height if self.left else 0
        right_h = self.right.height if self.right else 0
        self.height = 1 + max(left_h, right_h)
        return right_h - left_h
    
    def clone(self) -> 'BSTNode':
        """Deep clone for snapshots"""
        new_node = BSTNode(self.key, self.value)
        new_node.height = self.height
        new_node.metadata.duplicate_count = self.metadata.duplicate_count
        
        if self.left:
            new_node.left = self.left.clone()
        if self.right:
            new_node.right = self.right.clone()
        
        return new_node

class BST:
    """
    Production BST with AVL balancing, duplicate counting, and snapshots.
    Optimized for high-frequency trading order book management.
    
    Features:
    - O(log n) insert/search with AVL self-balancing
    - Duplicate counting strategy for repeated keys
    - Snapshot/rollback system for audit compliance
    - Deterministic behavior (no timestamps or random state)
    """
    
    def __init__(self, comparator: Optional[Callable[[any, any], int]] = None):
        self.root: Optional[BSTNode] = None
        self._size: int = 0
        self._comparator = comparator or (lambda a, b: (a > b) - (a < b))
        self._snapshots: Dict[int, BSTNode] = {}
        self._snapshot_sizes: Dict[int, int] = {}
        self._version_counter: int = 0
    
    def insert(self, key, value=None) -> BSTNode:
        """
        Insert key with AVL balancing and duplicate counting.
        
        Args:
            key: Key to insert
            value: Optional value (defaults to key if None)
        
        Returns:
            The inserted or updated node
        """
        if self.root is None:
            self.root = BSTNode(key, value)
            self._size += 1
            return self.root
        
        # Check for duplicate first
        existing = self._find_exact(self.root, key)
        if existing:
            existing.metadata.duplicate_count += 1
            if value is not None:
                existing.value = value
            self._size += 1
            return existing
        
        # Insert and collect path for rebalancing
        self.root = self._insert_and_balance(self.root, key, value)
        self._size += 1
        return self.root
    
    def _find_exact(self, node: Optional[BSTNode], key) -> Optional[BSTNode]:
        """Find exact match without bias"""
        while node:
            cmp = self._comparator(key, node.key)
            if cmp == 0:
                return node
            node = node.left if cmp < 0 else node.right
        return None
    
    def _insert_and_balance(self, node: Optional[BSTNode], key, value) -> BSTNode:
        """Recursive insert with AVL balancing on the way up"""
        if node is None:
            return BSTNode(key, value)
        
        cmp = self._comparator(key, node.key)
        
        if cmp < 0:
            node.left = self._insert_and_balance(node.left, key, value)
        else:
            node.right = self._insert_and_balance(node.right, key, value)
        
        # Update height and get balance factor
        balance = node.update_height()
        
        # Rebalance if needed
        if balance > 1:  # Right-heavy
            if node.right:
                right_balance = (node.right.right.height if node.right.right else 0) - \
                               (node.right.left.height if node.right.left else 0)
                if right_balance < 0:  # Right-Left case
                    node.right = self._rotate_right(node.right)
            return self._rotate_left(node)
        
        if balance < -1:  # Left-heavy
            if node.left:
                left_balance = (node.left.right.height if node.left.right else 0) - \
                              (node.left.left.height if node.left.left else 0)
                if left_balance > 0:  # Left-Right case
                    node.left = self._rotate_left(node.left)
            return self._rotate_right(node)
        
        return node
    
    def _rotate_left(self, z: BSTNode) -> BSTNode:
        """Left rotation for AVL balancing"""
        y = z.right
        if y is None:
            return z
        
        z.right = y.left
        y.left = z
        
        z.update_height()
        y.update_height()
        
        return y
    
    def _rotate_right(self, z: BSTNode) -> BSTNode:
        """Right rotation for AVL balancing"""
        y = z.left
        if y is None:
            return z
        
        z.left = y.right
        y.right = z
        
        z.update_height()
        y.update_height()
        
        return y
    
    def search(self, key) -> Optional[BSTNode]:
        """
        Search for a key in the tree.
        
        Args:
            key: Key to search for
        
        Returns:
            Node containing the key, or None if not found
        """
        return self._find_exact(self.root, key)
    
    def inorder_traversal(self) -> Iterator:
        """
        Perform inorder traversal yielding keys in sorted order.
        Duplicates are yielded duplicate_count times.
        
        Yields:
            Keys in sorted order
        """
        yield from self._inorder(self.root)
    
    def _inorder(self, node: Optional[BSTNode]) -> Iterator:
        """Recursive inorder with duplicate expansion"""
        if node is None:
            return
        
        yield from self._inorder(node.left)
        
        for _ in range(node.metadata.duplicate_count):
            yield node.key
        
        yield from self._inorder(node.right)
    
    def create_snapshot(self) -> int:
        """
        Capture current tree state for rollback.
        
        Returns:
            Version ID for this snapshot
        """
        version = self._version_counter
        self._version_counter += 1
        
        if self.root:
            self._snapshots[version] = self.root.clone()
            self._snapshot_sizes[version] = self._size
        else:
            self._snapshots[version] = None
            self._snapshot_sizes[version] = 0
        
        return version
    
    def rollback(self, version: int) -> bool:
        """
        Restore tree to a previous snapshot state.
        
        Args:
            version: Snapshot version ID to restore
        
        Returns:
            True if rollback successful, False if version not found
        """
        if version not in self._snapshots:
            return False
        
        snapshot = self._snapshots[version]
        self.root = snapshot.clone() if snapshot else None
        self._size = self._snapshot_sizes[version]
        
        return True
    
    def get_height(self) -> int:
        """
        Get current tree height for performance verification.
        
        Returns:
            Height of the tree (0 for empty tree)
        """
        return self.root.height if self.root else 0
    
    def __len__(self) -> int:
        """Return total element count including duplicates"""
        return self._size
    
    def __contains__(self, key) -> bool:
        """Check if key exists in tree"""
        return self.search(key) is not None
    
    def __iter__(self) -> Iterator:
        """Iterate over keys in sorted order"""
        return self.inorder_traversal()