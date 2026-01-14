import pytest
import json
import re
import os
from playwright.sync_api import Page, expect


BASE_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

MOCK_SNIPPETS = [
    {
        "id": "1",
        "title": "React Hook Example",
        "content": "const [state, setState] = useState(0);",
        "created_at": "2023-10-01T12:00:00Z"
    },
    {
        "id": "2",
        "title": "Python Print",
        "content": "print('Hello World')",
        "created_at": "2023-10-02T13:00:00Z"
    }
]

@pytest.fixture(autouse=True)
def setup_logging(page: Page):
    """Capture console logs and network events from the browser"""
    page.on("console", lambda msg: print(f"BROWSER CONSOLE: {msg.type}: {msg.text}"))
    page.on("pageerror", lambda exc: print(f"BROWSER ERROR: {exc}"))
    page.on("request", lambda req: print(f"BROWSER REQ: {req.method} {req.url}"))
    yield

@pytest.fixture(autouse=True)
def mock_api(page: Page):
    """Global mock for API calls to ensure tests are self-contained"""
    def handle_route(route):
        # We only print here if it's NOT a POST (to avoid double logs in specific tests)
        if route.request.method == "GET" and "/snippets" in route.request.url:
            print(f"GLOBAL MOCK GET: {route.request.url}")
            route.fulfill(
                status=200,
                content_type="application/json",
                body=json.dumps(MOCK_SNIPPETS)
            )
        else:
            route.continue_()

    page.route(re.compile(r".*/snippets$"), handle_route)



def test_initial_load_and_list(page: Page):
    """Verify Req 10, 11, 17: Loading and listing snippets"""
    page.goto(BASE_URL)
    
    # Wait for the specific snippet card title to appear
    expect(page.get_by_text("React Hook Example")).to_be_visible(timeout=15000)
    expect(page.get_by_text("Python Print")).to_be_visible()
    
    # Verify content fields (Req 11)
    expect(page.get_by_text("const [state, setState]")).to_be_visible()

def test_empty_state(page: Page):
    """Verify Req 18: Empty state when no snippets found"""
    def handle_empty(route):
        print(f"EMPTY MOCK GET: {route.request.url}")
        route.fulfill(
            status=200,
            content_type="application/json",
            body=json.dumps([])
        )

    # Register BEFORE navigation
    page.route(re.compile(r".*/snippets$"), handle_empty)
    
    page.goto(BASE_URL)
    expect(page.get_by_text("No snippets found")).to_be_visible(timeout=15000)

def test_search_functionality(page: Page):
    """Verify Req 13, 14, 15, 16: Client-side search logic"""
    page.goto(BASE_URL)
    expect(page.get_by_text("Python Print")).to_be_visible(timeout=15000)
    
    search_input = page.get_by_placeholder("Search by title or content...")
    
    # Search by title (Case-insensitive) (Req 14, 15)
    search_input.fill("PYTHON")
    expect(page.get_by_text("Python Print")).to_be_visible()
    expect(page.get_by_text("React Hook Example")).not_to_be_visible()
    
    # Search by content (Req 14)
    search_input.fill("setState")
    expect(page.get_by_text("React Hook Example")).to_be_visible()
    expect(page.get_by_text("Python Print")).not_to_be_visible()

def test_truncation(page: Page):
    """Verify Req 11: Content is truncated at 160 chars"""
    long_content = "TruncateMe " * 50
    mock_long = [
        {"id": "long", "title": "Long One", "content": long_content, "created_at": "2023-10-01T00:00:00Z"}
    ]
    page.route(re.compile(r".*/snippets$"), lambda route: route.fulfill(
        status=200, content_type="application/json", body=json.dumps(mock_long)
    ))
    page.goto(BASE_URL)
    
    expect(page.get_by_text("TruncateMe TruncateMe")).to_be_visible(timeout=15000)
    
    text = page.locator("p", has_text="TruncateMe").inner_text()
    assert "…" in text
    assert len(text) <= 170

def test_error_handling(page: Page):
    """Verify Req 19: Error messages on failed API requests"""
    page.route(re.compile(r".*/snippets$"), lambda route: route.fulfill(
        status=500,
        content_type="application/json",
        body=json.dumps({"detail": "Server Offline Error"})
    ))
    page.goto(BASE_URL)
    expect(page.get_by_text("Server Offline Error")).to_be_visible(timeout=15000)

if __name__ == "__main__":
    pytest.main([__file__])
