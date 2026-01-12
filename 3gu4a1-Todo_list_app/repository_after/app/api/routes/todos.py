from typing import List

from fastapi import APIRouter, Query, status
from app.models.schemas import TodoCreate, TodoUpdate, TodoPatch, TodoOut
from app.services import todos_services as svc

router = APIRouter(prefix="/todos", tags=["todos"])


@router.get("", response_model=List[TodoOut])
def list_todos(
    offset: int = Query(
        0, ge=0, description="Number of items to skip in ordered results"
    ),
    limit: int = Query(
        100, ge=1, le=1000, description="Maximum number of items to return"
    ),
):
    # Returns items in insertion order
    records = svc.list_todos(offset=offset, limit=limit)
    # Convert dataclass records to Pydantic models
    return [TodoOut.model_validate(r) for r in records]


@router.get("/{todo_id}", response_model=TodoOut)
def get_todo(todo_id: str):
    rec = svc.get_todo_or_404(todo_id)
    return TodoOut.model_validate(rec)


@router.post("", response_model=TodoOut, status_code=status.HTTP_201_CREATED)
def create_todo(data: TodoCreate):
    rec = svc.create_todo(data)
    return TodoOut.model_validate(rec)


@router.put("/{todo_id}", response_model=TodoOut)
def replace_todo(todo_id: str, data: TodoUpdate):
    rec = svc.replace_todo(todo_id, data)
    return TodoOut.model_validate(rec)


@router.patch("/{todo_id}", response_model=TodoOut)
def patch_todo(todo_id: str, data: TodoPatch):
    rec = svc.patch_todo(todo_id, data)
    return TodoOut.model_validate(rec)


@router.delete("/{todo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_todo(todo_id: str):
    svc.delete_todo(todo_id)
    # 204 No Content
    return None
