from sqlalchemy.orm import Session
from sqlalchemy import select, desc

from app.models.snippet import Snippet
from app.schemas.snippet import SnippetCreate


def create_snippet(db: Session, data: SnippetCreate) -> Snippet:
    snippet = Snippet(title=data.title, content=data.content)
    db.add(snippet)
    db.commit()
    db.refresh(snippet)
    return snippet


def list_snippets(db: Session) -> list[Snippet]:
    stmt = select(Snippet).order_by(desc(Snippet.created_at))
    return list(db.scalars(stmt).all())
