import os
import pytest
import psycopg2
from pathlib import Path

@pytest.fixture(scope="function")
def conn():
    """
    PostgreSQL connection for tests, driven by DATABASE_URL.
    """
    dsn = os.environ["DATABASE_URL"]
    conn = psycopg2.connect(dsn)
    conn.autocommit = True

    try:
        yield conn
    finally:
        conn.close()


@pytest.fixture
def repo_sql():
    repo = os.environ["REPO_UNDER_TEST"]
    return str(Path(repo) / "name_validation.sql")
