from app.db.database import engine
from app.db.base import Base

# Import models so SQLAlchemy registers them
from app.models.snippet import Snippet  # noqa: F401


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
