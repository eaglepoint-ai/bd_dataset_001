import pytest
import os
import subprocess
import time
from pathlib import Path
from shutil import which

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager

# When invoked from inside the Docker image, the working directory is /app/repository_after
# and the repository root is /app. This keeps paths stable for both local and container runs.
BASE_DIR = Path(__file__).resolve().parents[2]
REPO_AFTER = BASE_DIR / "repository_after"
REPO_BEFORE = BASE_DIR / "repository_before"

# Determine which repository to test based on environment variable
TEST_REPO = os.environ.get("TEST_REPO", str(REPO_AFTER))
CURRENT_REPO = Path(TEST_REPO) if TEST_REPO else REPO_AFTER


def check_no_hardcoded_content(repo_path: Path) -> tuple[bool, str]:
    """Check that index.html doesn't contain hardcoded blog content."""
    hardcoded_indicators = [
        "Getting Started with TypeScript",
        "Building SPAs Without Frameworks",
        "Markdown as a Content Source",
    ]

    html_file = repo_path / "index.html"
    if not html_file.exists():
        return False, "index.html not found"

    html_text = html_file.read_text()
    for indicator in hardcoded_indicators:
        if indicator in html_text:
            return False, f"Found hardcoded content '{indicator}' in index.html"

    return True, "No hardcoded content found in HTML"


def check_typescript_only(repo_path: Path) -> tuple[bool, str]:
    """Check that only TypeScript source files exist, no committed JS."""
    src_dir = repo_path / "src"
    if not src_dir.exists():
        return False, "src/ directory not found"

    ts_files = list(src_dir.rglob("*.ts"))
    if not ts_files:
        return False, "No TypeScript files found in src/"

    js_files_in_src = list(src_dir.rglob("*.js"))
    if js_files_in_src:
        return False, f"JavaScript files found in src/: {[str(f) for f in js_files_in_src]}"

    return True, "TypeScript-only check passed"


def check_no_frameworks(repo_path: Path) -> tuple[bool, str]:
    """Check that no framework libraries are used."""
    package_json = repo_path / "package.json"
    if package_json.exists():
        import json

        with open(package_json) as f:
            data = json.load(f)
            deps = data.get("dependencies", {})
            dev_deps = data.get("devDependencies", {})
            all_deps = {**deps, **dev_deps}

            framework_keywords = ["react", "vue", "angular", "svelte", "preact", "ember"]
            for dep_name in all_deps:
                if any(keyword in dep_name.lower() for keyword in framework_keywords):
                    return False, f"Framework detected in dependencies: {dep_name}"

    html_file = repo_path / "index.html"
    if html_file.exists():
        html_content = html_file.read_text().lower()
        for indicator in ["react", "vue", "angular", "svelte"]:
            if indicator in html_content:
                return False, f"Framework indicator '{indicator}' found in HTML"

    return True, "No frameworks detected"


def check_markdown_content_exists(repo_path: Path) -> tuple[bool, str]:
    """Check that Markdown content files exist."""
    author_md = repo_path / "content" / "author.md"
    blogs_dir = repo_path / "content" / "blogs"

    if not author_md.exists():
        return False, "content/author.md not found"
    if not blogs_dir.exists():
        return False, "content/blogs/ directory not found"

    blog_files = list(blogs_dir.glob("*.md"))
    if not blog_files:
        return False, "No blog post Markdown files found"

    return True, f"Markdown content found: {len(blog_files)} blog posts"


def start_server(repo_path: Path, port: int = 8000) -> subprocess.Popen:
    """Start the HTTP server."""
    os.chdir(repo_path)
    server = subprocess.Popen(
        ["python3", "server.py"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        cwd=repo_path,
    )
    time.sleep(2)
    return server


def get_driver():
    """Get Selenium WebDriver."""
    options = Options()
    options.add_argument("--headless")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")

    # Prefer system chromedriver/chromium inside Docker (deterministic, no downloads).
    chromedriver_path = which("chromedriver")
    if chromedriver_path:
        chrome_bin = os.environ.get("CHROME_BIN")
        if chrome_bin:
            options.binary_location = chrome_bin
        service = Service(chromedriver_path)
        return webdriver.Chrome(service=service, options=options)

    # Fallback for local runs: webdriver_manager may download a driver.
    service = Service(ChromeDriverManager().install())
    return webdriver.Chrome(service=service, options=options)


def test_no_hardcoded_content():
    passed, message = check_no_hardcoded_content(CURRENT_REPO)
    assert passed, message


def test_typescript_only():
    passed, message = check_typescript_only(CURRENT_REPO)
    assert passed, message


def test_no_frameworks():
    passed, message = check_no_frameworks(CURRENT_REPO)
    assert passed, message


def test_markdown_content():
    passed, message = check_markdown_content_exists(CURRENT_REPO)
    assert passed, message


def test_spa_behavior():
    server = None
    driver = None
    try:
        server = start_server(CURRENT_REPO)

        driver = get_driver()
        driver.get("http://localhost:8000")

        wait = WebDriverWait(driver, 10)
        initial_url = driver.current_url

        blog_link = wait.until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "a[data-route='post'], article a"))
        )
        blog_link.click()
        time.sleep(1)

        final_url = driver.current_url
        assert initial_url != final_url or "#post" in final_url, "URL should change on navigation"

        page_source = driver.page_source
        assert "blog-post" in page_source or "content" in page_source.lower(), "Blog post should render"
    finally:
        if driver:
            driver.quit()
        if server:
            server.terminate()
            server.wait()


def test_dynamic_content():
    server = None
    driver = None
    try:
        server = start_server(CURRENT_REPO)

        driver = get_driver()
        driver.get("http://localhost:8000")

        wait = WebDriverWait(driver, 10)
        author_name = wait.until(EC.presence_of_element_located((By.TAG_NAME, "h1")))
        assert author_name.text, "Author name should be rendered"

        html_content = (CURRENT_REPO / "index.html").read_text()
        assert author_name.text not in html_content, "Author name must not be hardcoded in HTML"
    finally:
        if driver:
            driver.quit()
        if server:
            server.terminate()
            server.wait()


def test_metadata_rendering():
    server = None
    driver = None
    try:
        server = start_server(CURRENT_REPO)

        driver = get_driver()
        driver.get("http://localhost:8000")

        wait = WebDriverWait(driver, 10)
        blog_links = wait.until(
            EC.presence_of_all_elements_located((By.CSS_SELECTOR, "article a, .blog-preview a"))
        )

        if blog_links:
            blog_links[0].click()
            time.sleep(1)

            title = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "h1, .blog-post h1")))
            assert title.text, "Blog post title should be rendered"

            metadata = driver.find_elements(By.CSS_SELECTOR, "time, .metadata")
            assert len(metadata) > 0, "Blog post metadata should be rendered"
    finally:
        if driver:
            driver.quit()
        if server:
            server.terminate()
            server.wait()


def test_repository_before_fails_requirements():
    """Sanity check: baseline should fail at least one requirement."""
    hardcoded_ok, _ = check_no_hardcoded_content(REPO_BEFORE)
    ts_ok, _ = check_typescript_only(REPO_BEFORE)
    md_ok, _ = check_markdown_content_exists(REPO_BEFORE)

    # We expect repository_before to be incomplete and fail at least one check.
    assert (not hardcoded_ok) or (not ts_ok) or (not md_ok), (
        "repository_before unexpectedly passed all baseline checks"
    )

