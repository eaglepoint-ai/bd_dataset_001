#!/usr/bin/env python3
"""
Database models and session management for webhook transactions.
"""
from contextlib import contextmanager
from sqlalchemy import create_engine, Column, String, Integer, Float, DateTime
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker
import os

Base = declarative_base()


class Transaction(Base):
    """Transaction model for storing webhook payloads."""
    __tablename__ = 'transactions'
    
    id = Column(String, primary_key=True)
    amount = Column(Float)
    currency = Column(String)
    created_at_time = Column(Integer)
    timestamp = Column(Integer)
    cause = Column(String)
    full_name = Column(String)
    account_name = Column(String)
    invoice_url = Column(String)


# Use in-memory SQLite for testing
DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///:memory:')
engine = create_engine(DATABASE_URL, echo=False)
SessionLocal = sessionmaker(bind=engine)


@contextmanager
def get_session():
    """Context manager for database sessions."""
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def init_db():
    """Initialize database tables."""
    Base.metadata.create_all(engine)
