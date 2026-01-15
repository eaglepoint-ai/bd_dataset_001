from __future__ import annotations
import sys
import heapq
from collections import Counter


class Letter:
    def __init__(self, letter: str, freq: int):
        self.letter: str = letter
        self.freq: int = freq
        self.bitstring: str = ""

    def __repr__(self) -> str:
        return f"{self.letter}:{self.freq}"

    def __lt__(self, other: Letter) -> bool:
        return self.freq < other.freq


class TreeNode:
    def __init__(self, freq: int, left: Letter | TreeNode, right: Letter | TreeNode):
        self.freq: int = freq
        self.left: Letter | TreeNode = left
        self.right: Letter | TreeNode = right

    def __lt__(self, other: TreeNode) -> bool:
        return self.freq < other.freq