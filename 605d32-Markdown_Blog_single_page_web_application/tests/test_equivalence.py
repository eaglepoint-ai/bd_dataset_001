"""
Equivalence / contract tests to ensure repository_before/ and repository_after/
expose a compatible "task interface" (folders + entrypoints).

These tests are designed to PASS on both evaluation runs (before and after),
while still allowing repository_before to be incomplete and fail requirement tests.
"""

from __future__ import annotations

from pathlib import Path


def test_before_and_after_packages_importable():
    """Both repos should be present as importable packages (have __init__.py)."""
    import repository_before  # noqa: F401
    import repository_after  # noqa: F401


def test_repository_after_has_required_entrypoints_and_assets():
    """After repo must contain the SPA entrypoints and markdown content."""
    root = Path(__file__).parent.parent
    after = root / "repository_after"

    assert (after / "__init__.py").exists()
    assert (after / "index.html").exists()
    assert (after / "server.py").exists()

    # TypeScript source must exist
    assert (after / "src").exists()
    assert any((after / "src").rglob("*.ts")), "Expected TypeScript source under repository_after/src/"

    # Markdown content must exist
    assert (after / "content" / "author.md").exists()
    assert any((after / "content" / "blogs").glob("*.md")), "Expected markdown posts under content/blogs/"

    # Prebuilt bundle must exist for evaluation environments
    assert (after / "dist" / "app.js").exists(), "Expected repository_after/dist/app.js to exist"


def test_repository_before_is_baseline_incomplete():
    """Before repo is expected to be incomplete (baseline)."""
    root = Path(__file__).parent.parent
    before = root / "repository_before"

    assert (before / "__init__.py").exists()

    # Baseline should not look like the solved app; it should be missing at least one of these.
    has_src = (before / "src").exists()
    has_author = (before / "content" / "author.md").exists()
    has_bundle = (before / "dist" / "app.js").exists()

    assert not (has_src and has_author and has_bundle), "repository_before should not look like repository_after"

