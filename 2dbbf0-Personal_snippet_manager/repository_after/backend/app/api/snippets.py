from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.schemas.snippet import SnippetCreate, SnippetRead
from app.crud.snippet import create_snippet, list_snippets

router = APIRouter(prefix="/snippets", tags=["snippets"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("", response_model=list[SnippetRead])
def get_snippets(db: Session = Depends(get_db)):
    return list_snippets(db)


@router.post("", response_model=SnippetRead, status_code=201)
def post_snippet(payload: SnippetCreate, db: Session = Depends(get_db)):
    try:
        return create_snippet(db, payload)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to create snippet") from e
