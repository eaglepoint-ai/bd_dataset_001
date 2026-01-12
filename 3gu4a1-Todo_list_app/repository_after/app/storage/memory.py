# ============================================
# High-performance in-memory storage optimized for 100k+ todos.
#
# Design:
# - _STORE: Dict[str, TodoRecord] provides O(1) access by ID
# - _ORDER: List[Optional[str]] maintains insertion order of IDs (None for deleted slots)
# - _POS: Dict[str, int] maps ID to its index in _ORDER for O(1) deletions (marking as None)
# - Thread safety via a re-entrant lock
#
# Performance notes:
# - Create: O(1)
# - Get: O(1)
# - Replace/Patch: O(1)
# - Delete: O(1) (lazy via tombstone; leaves holes in _ORDER)
# - List: O(k + n) worst-case; iterates skipping tombstones. For high delete rates,
#         you can implement periodic compaction (vacuum) if needed.
#
# Migration path:
# - Storage functions expose a minimal interface.
#   Replace implementations with SQLAlchemy/DB calls keeping same function signatures.
# ============================================

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
import threading
import uuid
from typing import Dict, Iterable, Iterator, List, Optional, Tuple


@dataclass
class TodoRecord:
    id: str
    title: str
    completed: bool = False
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


# Internal state
_STORE: Dict[str, TodoRecord] = {}
_ORDER: List[
    Optional[str]
] = []  # list of IDs in insertion order; None indicates a deleted/tombstoned slot
_POS: Dict[str, int] = {}  # map from id to index in _ORDER
_LOCK = threading.RLock()


def create_todo(title: str) -> TodoRecord:
    # Generate UUID4 as a string
    rec = TodoRecord(id=str(uuid.uuid4()), title=title, completed=False)
    with _LOCK:
        _STORE[rec.id] = rec
        _ORDER.append(rec.id)
        _POS[rec.id] = len(_ORDER) - 1
    return rec


def get_todo(todo_id: str) -> Optional[TodoRecord]:
    with _LOCK:
        return _STORE.get(todo_id)


def replace_todo(todo_id: str, *, title: str, completed: bool) -> Optional[TodoRecord]:
    # Full update
    with _LOCK:
        rec = _STORE.get(todo_id)
        if rec is None:
            return None
        rec.title = title
        rec.completed = completed
        return rec


def patch_todo(
    todo_id: str, *, title: Optional[str] = None, completed: Optional[bool] = None
) -> Optional[TodoRecord]:
    # Partial update
    with _LOCK:
        rec = _STORE.get(todo_id)
        if rec is None:
            return None
        if title is not None:
            rec.title = title
        if completed is not None:
            rec.completed = completed
        return rec


def delete_todo(todo_id: str) -> bool:
    # Lazy O(1) deletion: mark order slot as tombstone (None) and drop from store and position map
    with _LOCK:
        rec = _STORE.pop(todo_id, None)
        if rec is None:
            return False
        idx = _POS.pop(todo_id, None)
        if idx is not None and 0 <= idx < len(_ORDER):
            _ORDER[idx] = None
        return True


def list_todos(offset: int = 0, limit: int = 100) -> List[TodoRecord]:
    # Return todos in insertion order, skipping deleted/tombstone entries
    result: List[TodoRecord] = []
    if limit <= 0:
        return result

    with _LOCK:
        # Efficiently skip until we reach the 'offset' live item, then collect 'limit' live items
        seen = 0
        for todo_id in _ORDER:
            if todo_id is None:
                continue
            if seen < offset:
                seen += 1
                continue
            # We are past offset; collect
            rec = _STORE.get(todo_id)
            if rec is None:
                continue  # Shouldn't happen, but be defensive
            result.append(rec)
            if len(result) >= limit:
                break
    return result


def count_todos() -> int:
    with _LOCK:
        return len(_STORE)


def clear_storage() -> None:
    # Dev-only helper to reset state
    with _LOCK:
        _STORE.clear()
        _ORDER.clear()
        _POS.clear()
