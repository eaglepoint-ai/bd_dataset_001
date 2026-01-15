#!/usr/bin/env python3
"""
Markdown Blog SPA evaluator (standardized report schema).

The platform runs:
  python3 /app/evaluation/evaluation.py

This script:
- runs the pytest suite against repository_before and repository_after
- writes mandatory artifacts under evaluation/reports/:
  - report.json
  - report_content
  - log_summary
- also writes evaluation/reports/latest.json (alias)
- and a timestamped copy under evaluation/reports/YYYY-MM-DD/HH-MM-SS/

Report schema mirrors the standardized evaluator contract used by the JS sample.
"""

from __future__ import annotations

import json
import os
import platform
import subprocess
import sys
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
REPORTS_DIR = Path(__file__).resolve().parent / "reports"


def _truncate(s: str, *, limit: int) -> str:
    if len(s) <= limit:
        return s
    return s[:limit]


def _iso_z(dt: datetime) -> str:
    # Emit a UTC-ish ISO string with trailing Z (like the JS evaluator).
    return dt.replace(microsecond=0).isoformat() + "Z"


def _get_git_info() -> dict[str, str]:
    info = {"git_commit": "unknown", "git_branch": "unknown"}
    try:
        result = subprocess.run(
            ["git", "rev-parse", "HEAD"],
            capture_output=True,
            text=True,
            timeout=5,
            cwd=str(ROOT),
        )
        if result.returncode == 0:
            info["git_commit"] = result.stdout.strip()[:8]
    except Exception:
        pass

    try:
        result = subprocess.run(
            ["git", "rev-parse", "--abbrev-ref", "HEAD"],
            capture_output=True,
            text=True,
            timeout=5,
            cwd=str(ROOT),
        )
        if result.returncode == 0:
            info["git_branch"] = result.stdout.strip()
    except Exception:
        pass

    return info


def get_environment_info() -> dict[str, str]:
    git = _get_git_info()
    return {
        "python_version": platform.python_version(),
        "platform": f"{platform.system()}-{platform.machine()}",
        "git_commit": git["git_commit"],
        "git_branch": git["git_branch"],
    }


def run_tests(repo_name: str) -> dict[str, Any]:
    env = os.environ.copy()
    env["TEST_REPO"] = str(ROOT / repo_name)

    try:
        proc = subprocess.run(
            [sys.executable, "-m", "pytest", "-q", "tests"],
            cwd=str(ROOT),
            env=env,
            capture_output=True,
            text=True,
            timeout=300,
        )
        out = (proc.stdout or "") + (proc.stderr or "")
        return {
            "passed": proc.returncode == 0,
            "return_code": proc.returncode,
            "output": _truncate(out, limit=8000),
        }
    except subprocess.TimeoutExpired as e:
        out = ""
        if getattr(e, "stdout", None):
            out += e.stdout  # type: ignore[operator]
        if getattr(e, "stderr", None):
            out += e.stderr  # type: ignore[operator]
        return {
            "passed": False,
            "return_code": 124,
            "output": _truncate(out or "Test execution timed out", limit=8000),
        }


def run_metrics(repo_name: str) -> dict[str, Any]:
    """
    Optional task metrics (numbers/booleans only).
    """
    repo = ROOT / repo_name
    src_dir = repo / "src"
    content_dir = repo / "content"
    dist_bundle = repo / "dist" / "app.js"

    ts_files = list(src_dir.rglob("*.ts")) if src_dir.exists() else []
    post_files = list((content_dir / "blogs").glob("*.md")) if (content_dir / "blogs").exists() else []

    return {
        "ts_file_count": len(ts_files),
        "blog_post_count": len(post_files),
        "has_author_md": (content_dir / "author.md").exists(),
        "has_dist_bundle": dist_bundle.exists(),
        "dist_bundle_bytes": dist_bundle.stat().st_size if dist_bundle.exists() else 0,
    }


def _write_json(path: Path, data: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")


def _write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def run_evaluation() -> dict[str, Any]:
    run_id = str(uuid.uuid4())
    started_at = datetime.utcnow()
    start_mono = datetime.utcnow()

    before = {
        "tests": run_tests("repository_before"),
        "metrics": run_metrics("repository_before"),
    }

    after = {
        "tests": run_tests("repository_after"),
        "metrics": run_metrics("repository_after"),
    }

    finished_at = datetime.utcnow()
    duration_seconds = (finished_at - start_mono).total_seconds()

    passed_gate = after["tests"]["passed"] is True

    return {
        "run_id": run_id,
        "started_at": _iso_z(started_at),
        "finished_at": _iso_z(finished_at),
        "duration_seconds": duration_seconds,
        "environment": get_environment_info(),
        "before": before,
        "after": after,
        "comparison": {
            "passed_gate": passed_gate,
            "improvement_summary": (
                "After implementation passed correctness checks."
                if passed_gate
                else "Implementation failed correctness."
            ),
        },
        "success": passed_gate,
        "error": None,
    }


def _build_report_content(report: dict[str, Any]) -> str:
    before = report.get("before", {}) or {}
    after = report.get("after", {}) or {}
    comparison = report.get("comparison", {}) or {}
    return (
        "## Summary\n"
        f"- **success**: `{report.get('success')}`\n"
        f"- **passed_gate**: `{comparison.get('passed_gate')}`\n"
        f"- **improvement_summary**: {comparison.get('improvement_summary')}\n\n"
        "## Before (`repository_before`)\n"
        f"- **passed**: `{before.get('tests', {}).get('passed')}`\n"
        f"- **return_code**: `{before.get('tests', {}).get('return_code')}`\n"
        "### Output (truncated)\n"
        "```\n"
        f"{before.get('tests', {}).get('output', '')}\n"
        "```\n\n"
        "## After (`repository_after`)\n"
        f"- **passed**: `{after.get('tests', {}).get('passed')}`\n"
        f"- **return_code**: `{after.get('tests', {}).get('return_code')}`\n"
        "### Output (truncated)\n"
        "```\n"
        f"{after.get('tests', {}).get('output', '')}\n"
        "```\n"
    )


def _build_log_summary(report: dict[str, Any]) -> str:
    comparison = report.get("comparison", {}) or {}
    before = report.get("before", {}) or {}
    after = report.get("after", {}) or {}
    return (
        "MARKDOWN BLOG SPA EVALUATION\n\n"
        f"success: {report.get('success')}\n"
        f"passed_gate: {comparison.get('passed_gate')}\n"
        f"before.passed: {before.get('tests', {}).get('passed')}\n"
        f"after.passed: {after.get('tests', {}).get('passed')}\n"
    )


def main() -> int:
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)

    now = datetime.utcnow()
    ts_dir = REPORTS_DIR / now.strftime("%Y-%m-%d") / now.strftime("%H-%M-%S")

    try:
        report = run_evaluation()
    except Exception as e:  # noqa: BLE001
        report = {
            "run_id": str(uuid.uuid4()),
            "started_at": _iso_z(datetime.utcnow()),
            "finished_at": _iso_z(datetime.utcnow()),
            "duration_seconds": 0.0,
            "environment": get_environment_info(),
            "before": None,
            "after": None,
            "comparison": {"passed_gate": False, "improvement_summary": "Evaluator crashed."},
            "success": False,
            "error": f"{type(e).__name__}: {e}",
        }

    # Mandatory artifacts (non-timestamped)
    _write_json(REPORTS_DIR / "report.json", report)
    _write_json(REPORTS_DIR / "latest.json", report)
    _write_text(REPORTS_DIR / "report_content", _build_report_content(report))
    _write_text(REPORTS_DIR / "log_summary", _build_log_summary(report))

    # Timestamped copy
    _write_json(ts_dir / "report.json", report)
    _write_text(ts_dir / "report_content", _build_report_content(report))
    _write_text(ts_dir / "log_summary", _build_log_summary(report))

    print(f"Report written to {REPORTS_DIR / 'latest.json'}")
    return 0 if report.get("success") else 1


if __name__ == "__main__":
    sys.exit(main())

