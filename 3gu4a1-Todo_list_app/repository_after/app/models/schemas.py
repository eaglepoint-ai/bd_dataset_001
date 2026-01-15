from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


class TodoCreate(BaseModel):
    title: str = Field(..., description="Title of the todo item")

    # Trim and validate title (non-empty after trimming)
    @field_validator("title", mode="before")
    @classmethod
    def trim_and_validate_title(cls, v: str) -> str:
        if v is None:
            raise ValueError("title is required")
        if not isinstance(v, str):
            raise TypeError("title must be a string")
        t = v.strip()
        if not t:
            raise ValueError("title cannot be empty")
        return t


class TodoUpdate(BaseModel):
    title: str = Field(..., description="New title of the todo item")
    completed: bool = Field(..., description="Completion status")

    @field_validator("title", mode="before")
    @classmethod
    def trim_and_validate_title(cls, v: str) -> str:
        if v is None:
            raise ValueError("title is required")
        if not isinstance(v, str):
            raise TypeError("title must be a string")
        t = v.strip()
        if not t:
            raise ValueError("title cannot be empty")
        return t


class TodoPatch(BaseModel):
    title: Optional[str] = Field(None, description="New title of the todo item")
    completed: Optional[bool] = Field(None, description="Completion status")

    @field_validator("title", mode="before")
    @classmethod
    def trim_and_validate_title_optional(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        if not isinstance(v, str):
            raise TypeError("title must be a string")
        t = v.strip()
        if not t:
            raise ValueError("title cannot be empty")
        return t


class TodoOut(BaseModel):
    # Using UUID4 string ID
    id: str
    title: str
    completed: bool = False
    created_at: datetime

    # Allow validating directly from dataclasses via attribute access
    model_config = ConfigDict(from_attributes=True)
