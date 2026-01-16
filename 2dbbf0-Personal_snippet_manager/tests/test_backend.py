import os
import sys
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Set up environment variables before importing backend modules
os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["CORS_ORIGINS"] = "http://localhost:5173"

# Add backend to python path
BACKEND_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'repository_after', 'backend'))
sys.path.insert(0, BACKEND_PATH)

from app.main import app
from app.db.base import Base
from app.api.snippets import get_db



# Use an in-memory SQLite database with StaticPool for sharing across threads
engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client



def test_health_check(client):
    """Verify health endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_create_snippet_success(client):
    """Verify Req 6: Create snippet with title and content"""
    payload = {"title": "Test Title", "content": "Test Content"}
    response = client.post("/snippets", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Test Title"
    assert data["content"] == "Test Content"
    assert "id" in data
    assert "created_at" in data

def test_create_snippet_validation_error(client):
    """Verify Req 19: Error messages on failed requests (missing fields)"""
    # Missing content
    response = client.post("/snippets", json={"title": "No Content"})
    assert response.status_code == 422
    
    # Missing title
    response = client.post("/snippets", json={"content": "No Title"})
    assert response.status_code == 422

def test_list_snippets(client):
    """Verify Req 10 & 11: List snippets with correct fields"""
    # Create a snippet first
    client.post("/snippets", json={"title": "List Test", "content": "Snippet Content"})
    
    response = client.get("/snippets")
    assert response.status_code == 200
    snippets = response.json()
    assert len(snippets) > 0
    snippet = snippets[0]
    assert "title" in snippet
    assert "content" in snippet
    assert "created_at" in snippet

def test_persistence(client):
    """Verify Req 7 & 12: Snippets persist across requests"""
    snippet_data = {"title": "Persistent Snippet", "content": "This should be saved"}
    client.post("/snippets", json=snippet_data)
    
    # Fetch list and verify it is there
    response = client.get("/snippets")
    titles = [s["title"] for s in response.json()]
    assert "Persistent Snippet" in titles

def test_no_auth_required(client):
    """Verify Req 22: No authentication required"""
    response = client.get("/snippets")
    assert response.status_code == 200



def test_list_snippets_empty(client):
    """Verify empty state (Requirement 11 context)"""
    response = client.get("/snippets")
    assert response.status_code == 200
    assert response.json() == []

def test_create_snippet_unicode(client):
    """Verify Unicode support (Adversarial/Robustness)"""
    payload = {"title": "🚀 Unicode Test", "content": "你好 world! 🔥"}
    response = client.post("/snippets", json=payload)
    assert response.status_code == 201
    assert response.json()["title"] == "🚀 Unicode Test"

def test_create_snippet_max_lengths(client):
    """Verify boundary checks for title and content (Req 6)"""
    # Title max 200, Content max 50,000
    payload = {
        "title": "A" * 200,
        "content": "B" * 50000
    }
    response = client.post("/snippets", json=payload)
    assert response.status_code == 201
    
    # Exceed title length
    payload["title"] = "A" * 201
    response = client.post("/snippets", json=payload)
    assert response.status_code == 422

def test_create_snippet_empty_fields_validation(client):
    """Verify empty strings are rejected if required (Req 6 & 19)"""
    # Empty title
    response = client.post("/snippets", json={"title": "", "content": "valid content"})
    assert response.status_code == 422
    
    # Empty content
    response = client.post("/snippets", json={"title": "valid title", "content": ""})
    assert response.status_code == 422

if __name__ == "__main__":
    pytest.main([__file__])
