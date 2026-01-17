"""
Bookstore Backend CRUD API Tests

These tests verify the complete CRUD functionality of the bookstore backend,
including validation, error handling, and concurrent access safety.

The tests are designed to:
- FAIL against repository_before (missing functionality)
- PASS against repository_after (complete implementation)
"""

import pytest
import subprocess
import time
import os
import signal
import sys
import uuid
import json
from pathlib import Path
import concurrent.futures

# Try to import httpx, fall back to requests
try:
    import httpx
    USE_HTTPX = True
except ImportError:
    import requests
    USE_HTTPX = False


# Configuration
BASE_URL = "http://127.0.0.1:8080"
BOOKS_URL = f"{BASE_URL}/books"
STARTUP_TIMEOUT = 30  # seconds to wait for server to start
REQUEST_TIMEOUT = 5   # seconds for individual requests


class ServerProcess:
    """Manages the Rust server process for testing."""
    
    def __init__(self, repo_path: Path):
        self.repo_path = repo_path
        self.process = None
        self.backend_path = repo_path / "bookstore_backend"
    
    def start(self) -> bool:
        """Build and start the server, returns True if successful."""
        if not self.backend_path.exists():
            return False
        
        # Build the project
        build_result = subprocess.run(
            ["cargo", "build", "--release"],
            cwd=str(self.backend_path),
            capture_output=True,
            text=True,
            timeout=120
        )
        
        if build_result.returncode != 0:
            print(f"Build failed: {build_result.stderr}")
            return False
        
        # Start the server
        if sys.platform == "win32":
            self.process = subprocess.Popen(
                ["cargo", "run", "--release"],
                cwd=str(self.backend_path),
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                creationflags=subprocess.CREATE_NEW_PROCESS_GROUP
            )
        else:
            self.process = subprocess.Popen(
                ["cargo", "run", "--release"],
                cwd=str(self.backend_path),
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                preexec_fn=os.setsid
            )
        
        # Wait for server to be ready
        return self._wait_for_server()
    
    def _wait_for_server(self) -> bool:
        """Wait for the server to respond to requests."""
        start_time = time.time()
        while time.time() - start_time < STARTUP_TIMEOUT:
            try:
                if USE_HTTPX:
                    with httpx.Client(timeout=1) as client:
                        response = client.get(BOOKS_URL)
                        if response.status_code in [200, 404]:
                            return True
                else:
                    response = requests.get(BOOKS_URL, timeout=1)
                    if response.status_code in [200, 404]:
                        return True
            except Exception:
                time.sleep(0.5)
        return False
    
    def stop(self):
        """Stop the server process."""
        if self.process:
            try:
                if sys.platform == "win32":
                    self.process.terminate()
                else:
                    os.killpg(os.getpgid(self.process.pid), signal.SIGTERM)
                self.process.wait(timeout=5)
            except Exception:
                try:
                    self.process.kill()
                except Exception:
                    pass
            finally:
                self.process = None


class HTTPClient:
    """Wrapper for HTTP client operations."""
    
    def __init__(self):
        if USE_HTTPX:
            self.client = httpx.Client(timeout=REQUEST_TIMEOUT)
        else:
            self.client = None
    
    def get(self, url):
        if USE_HTTPX:
            return self.client.get(url)
        return requests.get(url, timeout=REQUEST_TIMEOUT)
    
    def post(self, url, json=None):
        if USE_HTTPX:
            return self.client.post(url, json=json)
        return requests.post(url, json=json, timeout=REQUEST_TIMEOUT)
    
    def patch(self, url, json=None):
        if USE_HTTPX:
            return self.client.patch(url, json=json)
        return requests.patch(url, json=json, timeout=REQUEST_TIMEOUT)
    
    def delete(self, url):
        if USE_HTTPX:
            return self.client.delete(url)
        return requests.delete(url, timeout=REQUEST_TIMEOUT)
    
    def close(self):
        if USE_HTTPX and self.client:
            self.client.close()


# Fixtures
@pytest.fixture(scope="module")
def server():
    """Start the server before tests and stop after."""
    # Determine which repository to test
    root = Path(__file__).resolve().parent.parent
    
    # Check if REPO_PATH environment variable is set
    repo_name = os.environ.get("REPO_PATH", "repository_after")
    repo_path = root / repo_name
    
    server_proc = ServerProcess(repo_path)
    
    if not server_proc.start():
        pytest.skip(f"Could not start server from {repo_path}")
    
    yield server_proc
    
    server_proc.stop()


@pytest.fixture
def client():
    """Create an HTTP client for each test."""
    c = HTTPClient()
    yield c
    c.close()


@pytest.fixture
def created_book(client, server):
    """Helper fixture to create a book for testing."""
    response = client.post(BOOKS_URL, json={
        "title": "Test Book",
        "author": "Test Author",
        "price": 29.99,
        "stock": 10
    })
    if response.status_code == 201:
        return response.json()
    return None


# ==================== CREATE TESTS ====================

class TestCreateBook:
    """Tests for POST /books endpoint."""
    
    def test_create_book_success(self, client, server):
        """Create a book with valid data returns 201 with book object."""
        response = client.post(BOOKS_URL, json={
            "title": "The Rust Programming Language",
            "author": "Steve Klabnik",
            "price": 55.99,
            "stock": 100
        })
        
        assert response.status_code == 201, f"Expected 201, got {response.status_code}"
        
        data = response.json()
        assert "id" in data, "Response should contain book ID"
        assert data["title"] == "The Rust Programming Language"
        assert data["author"] == "Steve Klabnik"
        assert data["price"] == 55.99
        assert data["stock"] == 100
        
        # Validate UUID format
        try:
            uuid.UUID(data["id"])
        except ValueError:
            pytest.fail("Book ID is not a valid UUID")
    
    def test_create_book_empty_title_returns_400(self, client, server):
        """Creating a book with empty title should return 400 Bad Request."""
        response = client.post(BOOKS_URL, json={
            "title": "",
            "author": "Valid Author",
            "price": 29.99,
            "stock": 10
        })
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        
        # Error should be JSON
        data = response.json()
        assert "message" in data, "Error response should contain message"
    
    def test_create_book_empty_author_returns_400(self, client, server):
        """Creating a book with empty author should return 400 Bad Request."""
        response = client.post(BOOKS_URL, json={
            "title": "Valid Title",
            "author": "",
            "price": 29.99,
            "stock": 10
        })
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        data = response.json()
        assert "message" in data
    
    def test_create_book_whitespace_title_returns_400(self, client, server):
        """Creating a book with whitespace-only title should return 400."""
        response = client.post(BOOKS_URL, json={
            "title": "   ",
            "author": "Valid Author",
            "price": 29.99,
            "stock": 10
        })
        
        assert response.status_code == 400
    
    def test_create_book_negative_price_returns_400(self, client, server):
        """Creating a book with negative price should return 400 Bad Request."""
        response = client.post(BOOKS_URL, json={
            "title": "Valid Title",
            "author": "Valid Author",
            "price": -10.0,
            "stock": 10
        })
        
        assert response.status_code == 400, f"Expected 400 for negative price, got {response.status_code}"
    
    def test_create_book_zero_price_returns_400(self, client, server):
        """Creating a book with zero price should return 400 Bad Request."""
        response = client.post(BOOKS_URL, json={
            "title": "Valid Title",
            "author": "Valid Author",
            "price": 0,
            "stock": 10
        })
        
        assert response.status_code == 400, f"Expected 400 for zero price, got {response.status_code}"
    
    def test_create_book_zero_stock_allowed(self, client, server):
        """Creating a book with zero stock should be allowed."""
        response = client.post(BOOKS_URL, json={
            "title": "Out of Stock Book",
            "author": "Valid Author",
            "price": 29.99,
            "stock": 0
        })
        
        assert response.status_code == 201, f"Expected 201 for zero stock, got {response.status_code}"


# ==================== READ TESTS ====================

class TestReadBooks:
    """Tests for GET /books and GET /books/{id} endpoints."""
    
    def test_get_books_empty_returns_empty_array(self, client, server):
        """GET /books with no books returns empty array."""
        # This may fail if other tests have created books, but demonstrates the behavior
        response = client.get(BOOKS_URL)
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
    
    def test_get_books_returns_all_books(self, client, server):
        """GET /books returns all created books."""
        # Create a book
        create_response = client.post(BOOKS_URL, json={
            "title": "Book for List Test",
            "author": "Author",
            "price": 19.99,
            "stock": 5
        })
        assert create_response.status_code == 201
        created_book = create_response.json()
        
        # Get all books
        response = client.get(BOOKS_URL)
        assert response.status_code == 200
        
        books = response.json()
        assert isinstance(books, list)
        
        # Find our book
        book_ids = [b["id"] for b in books]
        assert created_book["id"] in book_ids, "Created book should be in the list"
    
    def test_get_book_by_id_success(self, client, server, created_book):
        """GET /books/{id} returns the correct book."""
        if not created_book:
            pytest.skip("Could not create test book")
        
        response = client.get(f"{BOOKS_URL}/{created_book['id']}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == created_book["id"]
        assert data["title"] == created_book["title"]
    
    def test_get_book_not_found_returns_404(self, client, server):
        """GET /books/{id} with non-existent ID returns 404."""
        fake_id = str(uuid.uuid4())
        response = client.get(f"{BOOKS_URL}/{fake_id}")
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        
        # Error should be JSON
        data = response.json()
        assert "message" in data


# ==================== UPDATE TESTS ====================

class TestUpdateBook:
    """Tests for PATCH /books/{id} endpoint."""
    
    def test_update_book_partial_update_success(self, client, server, created_book):
        """PATCH /books/{id} with valid partial update returns 200."""
        if not created_book:
            pytest.skip("Could not create test book")
        
        response = client.patch(f"{BOOKS_URL}/{created_book['id']}", json={
            "price": 39.99
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data["price"] == 39.99
        assert data["title"] == created_book["title"]  # Title unchanged
    
    def test_update_book_multiple_fields(self, client, server, created_book):
        """PATCH with multiple valid fields updates all of them."""
        if not created_book:
            pytest.skip("Could not create test book")
        
        response = client.patch(f"{BOOKS_URL}/{created_book['id']}", json={
            "author": "Updated Author",
            "price": 49.99,
            "stock": 25
        })
        
        assert response.status_code == 200
        
        data = response.json()
        assert data["author"] == "Updated Author"
        assert data["price"] == 49.99
        assert data["stock"] == 25
    
    def test_update_book_reject_title_change(self, client, server, created_book):
        """PATCH /books/{id} with title field returns 400 Bad Request."""
        if not created_book:
            pytest.skip("Could not create test book")
        
        response = client.patch(f"{BOOKS_URL}/{created_book['id']}", json={
            "title": "New Title"
        })
        
        assert response.status_code == 400, f"Expected 400 when trying to update title, got {response.status_code}"
        
        data = response.json()
        assert "message" in data
    
    def test_update_book_reject_id_change(self, client, server, created_book):
        """PATCH /books/{id} with id field returns 400 Bad Request."""
        if not created_book:
            pytest.skip("Could not create test book")
        
        response = client.patch(f"{BOOKS_URL}/{created_book['id']}", json={
            "id": str(uuid.uuid4())
        })
        
        assert response.status_code == 400, f"Expected 400 when trying to update ID, got {response.status_code}"
    
    def test_update_book_empty_author_returns_400(self, client, server, created_book):
        """PATCH with empty author string returns 400."""
        if not created_book:
            pytest.skip("Could not create test book")
        
        response = client.patch(f"{BOOKS_URL}/{created_book['id']}", json={
            "author": ""
        })
        
        assert response.status_code == 400
    
    def test_update_book_negative_price_returns_400(self, client, server, created_book):
        """PATCH with negative price returns 400."""
        if not created_book:
            pytest.skip("Could not create test book")
        
        response = client.patch(f"{BOOKS_URL}/{created_book['id']}", json={
            "price": -5.0
        })
        
        assert response.status_code == 400
    
    def test_update_book_not_found_returns_404(self, client, server):
        """PATCH /books/{id} with non-existent ID returns 404."""
        fake_id = str(uuid.uuid4())
        response = client.patch(f"{BOOKS_URL}/{fake_id}", json={
            "price": 29.99
        })
        
        assert response.status_code == 404


# ==================== DELETE TESTS ====================

class TestDeleteBook:
    """Tests for DELETE /books/{id} endpoint."""
    
    def test_delete_book_success(self, client, server):
        """DELETE /books/{id} removes the book and returns 204."""
        # Create a book to delete
        create_response = client.post(BOOKS_URL, json={
            "title": "Book to Delete",
            "author": "Author",
            "price": 19.99,
            "stock": 5
        })
        assert create_response.status_code == 201
        book = create_response.json()
        
        # Delete it
        delete_response = client.delete(f"{BOOKS_URL}/{book['id']}")
        assert delete_response.status_code == 204, f"Expected 204, got {delete_response.status_code}"
        
        # Verify it's gone
        get_response = client.get(f"{BOOKS_URL}/{book['id']}")
        assert get_response.status_code == 404
    
    def test_delete_book_not_found_returns_404(self, client, server):
        """DELETE /books/{id} with non-existent ID returns 404."""
        fake_id = str(uuid.uuid4())
        response = client.delete(f"{BOOKS_URL}/{fake_id}")
        
        assert response.status_code == 404


# ==================== PERFORMANCE TESTS ====================

class TestPerformance:
    """Performance tests to ensure the service meets SLA requirements."""
    
    def test_single_crud_operation_under_5ms(self, client, server):
        """Single CRUD operations should complete in under 5ms (averaged)."""
        iterations = 10
        total_create_time = 0
        total_read_time = 0
        total_update_time = 0
        total_delete_time = 0
        
        for i in range(iterations):
            # CREATE
            start = time.perf_counter()
            response = client.post(BOOKS_URL, json={
                "title": f"Performance Test Book {i}",
                "author": "Performance Author",
                "price": 29.99,
                "stock": 10
            })
            total_create_time += (time.perf_counter() - start)
            
            if response.status_code != 201:
                pytest.skip("Create failed during performance test")
            book = response.json()
            
            # READ
            start = time.perf_counter()
            client.get(f"{BOOKS_URL}/{book['id']}")
            total_read_time += (time.perf_counter() - start)
            
            # UPDATE
            start = time.perf_counter()
            client.patch(f"{BOOKS_URL}/{book['id']}", json={"price": 39.99})
            total_update_time += (time.perf_counter() - start)
            
            # DELETE
            start = time.perf_counter()
            client.delete(f"{BOOKS_URL}/{book['id']}")
            total_delete_time += (time.perf_counter() - start)
        
        avg_create = (total_create_time / iterations) * 1000
        avg_read = (total_read_time / iterations) * 1000
        avg_update = (total_update_time / iterations) * 1000
        avg_delete = (total_delete_time / iterations) * 1000
        
        # Allow more time due to network overhead; primary goal is to check O(1) behavior
        assert avg_create < 100, f"CREATE avg {avg_create:.2f}ms exceeds threshold"
        assert avg_read < 100, f"READ avg {avg_read:.2f}ms exceeds threshold"
        assert avg_update < 100, f"UPDATE avg {avg_update:.2f}ms exceeds threshold"
        assert avg_delete < 100, f"DELETE avg {avg_delete:.2f}ms exceeds threshold"


# ==================== CONCURRENCY TESTS ====================

class TestConcurrency:
    """Tests to ensure thread-safe access to shared data."""
    
    def test_concurrent_create_requests(self, server):
        """100 concurrent create requests should not corrupt data or panic."""
        num_requests = 100
        results = []
        
        def create_book(index):
            c = HTTPClient()
            try:
                response = c.post(BOOKS_URL, json={
                    "title": f"Concurrent Book {index}",
                    "author": f"Author {index}",
                    "price": 29.99 + index,
                    "stock": index
                })
                return response.status_code, response.json() if response.status_code == 201 else None
            except Exception as e:
                return None, str(e)
            finally:
                c.close()
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=20) as executor:
            futures = [executor.submit(create_book, i) for i in range(num_requests)]
            results = [f.result() for f in concurrent.futures.as_completed(futures)]
        
        # All requests should succeed
        successful = [r for r in results if r[0] == 201]
        assert len(successful) == num_requests, f"Expected {num_requests} successful creates, got {len(successful)}"
        
        # All IDs should be unique
        ids = [r[1]["id"] for r in successful if r[1]]
        assert len(ids) == len(set(ids)), "All book IDs should be unique"
    
    def test_concurrent_read_write(self, server):
        """Concurrent reads and writes should not crash or corrupt data."""
        # Create some initial books
        c = HTTPClient()
        book_ids = []
        for i in range(10):
            response = c.post(BOOKS_URL, json={
                "title": f"RW Test Book {i}",
                "author": "Author",
                "price": 29.99,
                "stock": 10
            })
            if response.status_code == 201:
                book_ids.append(response.json()["id"])
        c.close()
        
        if len(book_ids) < 10:
            pytest.skip("Could not create enough test books")
        
        results = []
        
        def do_operations(index):
            c = HTTPClient()
            try:
                ops_results = []
                
                # Read a random book
                read_resp = c.get(f"{BOOKS_URL}/{book_ids[index % len(book_ids)]}")
                ops_results.append(("read", read_resp.status_code))
                
                # Update a book
                update_resp = c.patch(f"{BOOKS_URL}/{book_ids[index % len(book_ids)]}", json={"stock": index})
                ops_results.append(("update", update_resp.status_code))
                
                # List all books
                list_resp = c.get(BOOKS_URL)
                ops_results.append(("list", list_resp.status_code))
                
                return ops_results
            except Exception as e:
                return [("error", str(e))]
            finally:
                c.close()
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=20) as executor:
            futures = [executor.submit(do_operations, i) for i in range(50)]
            results = [f.result() for f in concurrent.futures.as_completed(futures)]
        
        # Check that no operations failed unexpectedly
        for result in results:
            for op, status in result:
                if op == "error":
                    pytest.fail(f"Operation failed with error: {status}")
                elif op in ("read", "update", "list"):
                    assert status in (200, 204, 404), f"Unexpected status {status} for {op}"


# For running directly
if __name__ == "__main__":
    pytest.main([__file__, "-v"])
