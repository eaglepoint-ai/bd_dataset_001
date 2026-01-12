from typing import List, Optional
from fastapi import HTTPException, status
from app.models.schemas import TodoCreate, TodoUpdate, TodoPatch
from app.storage import memory
from app.storage.memory import TodoRecord


def list_todos(offset: int = 0, limit: int = 100) -> List[TodoRecord]:
    return memory.list_todos(offset=offset, limit=limit)


def get_todo_or_404(todo_id: str) -> TodoRecord:
    rec = memory.get_todo(todo_id)
    if rec is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Todo with id '{todo_id}' not found",
        )
    return rec


def create_todo(data: TodoCreate) -> TodoRecord:
    # Title is already trimmed and validated via Pydantic
    return memory.create_todo(title=data.title)


def replace_todo(todo_id: str, data: TodoUpdate) -> TodoRecord:
    rec = memory.replace_todo(todo_id, title=data.title, completed=data.completed)
    if rec is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Todo with id '{todo_id}' not found",
        )
    return rec


def patch_todo(todo_id: str, data: TodoPatch) -> TodoRecord:
    if data.title is None and data.completed is None:
        # Empty PATCH body - nothing to update
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one field ('title' or 'completed') must be provided",
        )
    rec = memory.patch_todo(todo_id, title=data.title, completed=data.completed)
    if rec is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Todo with id '{todo_id}' not found",
        )
    return rec


def delete_todo(todo_id: str) -> None:
    ok = memory.delete_todo(todo_id)
    if not ok:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Todo with id '{todo_id}' not found",
        )
