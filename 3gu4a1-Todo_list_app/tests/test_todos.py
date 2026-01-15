import sys
import os
import pytest
from fastapi.testclient import TestClient


@pytest.fixture(params=["repository_before", "repository_after"])
def client(request):
    """Fixture that provides a TestClient for both repositories."""
    repo_name = request.param
    repo_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), repo_name)

    # Add repository path to sys.path so 'app' module can be found
    if repo_path not in sys.path:
        sys.path.insert(0, repo_path)

    try:
        if repo_name == "repository_before":
            from repository_before.main import app
        else:
            from repository_after.main import app
        return TestClient(app)
    except (ImportError, ModuleNotFoundError) as e:
        pytest.skip(f"Skipping {repo_name} - module not found or not implemented: {e}")


def test_health_check(client):
    """Test the health endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_create_todo(client):
    """Test creating a new todo."""
    response = client.post("/todos", json={"title": "Test Todo"})
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Test Todo"
    assert data["completed"] is False
    assert "id" in data
    assert "created_at" in data


def test_create_todo_empty_title(client):
    """Test that creating a todo with empty title fails."""
    response = client.post("/todos", json={"title": "   "})
    assert response.status_code == 422


def test_list_todos(client):
    """Test listing todos."""
    # Create a few todos first
    client.post("/todos", json={"title": "Todo 1"})
    client.post("/todos", json={"title": "Todo 2"})

    response = client.get("/todos")
    assert response.status_code == 200
    todos = response.json()
    assert isinstance(todos, list)
    assert len(todos) >= 2


def test_get_todo(client):
    """Test getting a specific todo."""
    # Create a todo
    create_response = client.post("/todos", json={"title": "Get Me"})
    todo_id = create_response.json()["id"]

    # Get it
    response = client.get(f"/todos/{todo_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == todo_id
    assert data["title"] == "Get Me"


def test_get_nonexistent_todo(client):
    """Test getting a todo that doesn't exist."""
    response = client.get("/todos/nonexistent-id")
    assert response.status_code == 404


def test_update_todo(client):
    """Test updating a todo with PUT."""
    # Create a todo
    create_response = client.post("/todos", json={"title": "Original"})
    todo_id = create_response.json()["id"]

    # Update it
    response = client.put(
        f"/todos/{todo_id}", json={"title": "Updated", "completed": True}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Updated"
    assert data["completed"] is True


def test_patch_todo(client):
    """Test partially updating a todo with PATCH."""
    # Create a todo
    create_response = client.post("/todos", json={"title": "Original"})
    todo_id = create_response.json()["id"]

    # Patch only completed
    response = client.patch(f"/todos/{todo_id}", json={"completed": True})
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Original"
    assert data["completed"] is True

    # Patch only title
    response = client.patch(f"/todos/{todo_id}", json={"title": "Patched Title"})
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Patched Title"
    assert data["completed"] is True


def test_patch_empty_body(client):
    """Test that PATCH with empty body fails."""
    create_response = client.post("/todos", json={"title": "Test"})
    todo_id = create_response.json()["id"]

    response = client.patch(f"/todos/{todo_id}", json={})
    assert response.status_code == 400


def test_delete_todo(client):
    """Test deleting a todo."""
    # Create a todo
    create_response = client.post("/todos", json={"title": "Delete Me"})
    todo_id = create_response.json()["id"]

    # Delete it
    response = client.delete(f"/todos/{todo_id}")
    assert response.status_code == 204

    # Verify it's gone
    get_response = client.get(f"/todos/{todo_id}")
    assert get_response.status_code == 404


def test_delete_nonexistent_todo(client):
    """Test deleting a todo that doesn't exist."""
    response = client.delete("/todos/nonexistent-id")
    assert response.status_code == 404


def test_list_todos_pagination(client):
    """Test pagination parameters."""
    # Create multiple todos
    for i in range(5):
        client.post("/todos", json={"title": f"Todo {i}"})

    # Test offset and limit
    response = client.get("/todos?offset=2&limit=2")
    assert response.status_code == 200
    todos = response.json()
    assert len(todos) <= 2


def test_title_trimming(client):
    """Test that titles are trimmed."""
    response = client.post("/todos", json={"title": "  Trimmed Title  "})
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Trimmed Title"
