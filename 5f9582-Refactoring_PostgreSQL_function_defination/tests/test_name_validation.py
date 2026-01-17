import psycopg2
import pytest

def setup_schema(conn, sql_path):
    with conn.cursor() as cur:
        cur.execute("DROP TABLE IF EXISTS students")
        cur.execute("""
            CREATE TABLE students (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL
            )
        """)
        cur.execute(open(sql_path).read())

@pytest.mark.correctness
def test_unicode_names_work(conn, repo_sql):
    setup_schema(conn, repo_sql)
    with conn.cursor() as cur:
        cur.execute(
            "INSERT INTO students (name) VALUES (%s) RETURNING name",
            ("  jóse   álvarez  ",)
        )
        assert cur.fetchone()[0] == "Jóse Álvarez"

@pytest.mark.correctness
def test_reject_empty_name(conn, repo_sql):
    setup_schema(conn, repo_sql)
    with conn.cursor() as cur:
        with pytest.raises(psycopg2.errors.NullValueNotAllowed):
            cur.execute("INSERT INTO students (name) VALUES ('   ')")

@pytest.mark.correctness
def test_whitespace_normalization(conn, repo_sql):
    setup_schema(conn, repo_sql)
    with conn.cursor() as cur:
        cur.execute(
            "INSERT INTO students (name) VALUES (%s) RETURNING name",
            ("Anna     Maria",)
        )
        assert cur.fetchone()[0] == "Anna Maria"

@pytest.mark.correctness
def test_max_name_parts(conn, repo_sql):
    setup_schema(conn, repo_sql)
    with conn.cursor() as cur:
        cur.execute(
            "INSERT INTO students (name) VALUES (%s) RETURNING name",
            ("Juan Carlos De La Vega",)
        )
        assert cur.fetchone()[0] == "Juan Carlos"
