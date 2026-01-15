#!/usr/bin/env python3
"""
Markdown Blog SPA evaluator.

The platform runs:
  python3 /app/evaluation/evaluation.py

This script must:
- run the pytest suite against repository_before and repository_after
- write mandatory artifacts under evaluation/reports/:
  - report.json
  - report_content
  - log_summary

It also writes a timestamped copy under:
  evaluation/reports/YYYY-MM-DD/HH-MM-SS/
"""

from __future__ import annotations

import json
import os
import platform
import re
import subprocess
import sys
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any


@dataclass(frozen=True)
class PytestRun:
    success: bool
    return_code: int
    total: int
    passed: int
    failed: int
    skipped: int
    stdout: str
    stderr: str


def _truncate(s: str, *, limit: int) -> str:
    if len(s) <= limit:
        return s
    return s[-limit:]


def _parse_pytest_summary(output: str) -> tuple[int, int, int, int]:
    """
    Best-effort parse of pytest's final summary line.

    Pytest may print the counts in different orders, e.g.:
      - "8 passed in 1.23s"
      - "5 failed, 2 passed, 1 skipped in 18.58s"
    Returns (total, passed, failed, skipped). Unknown counts default to 0.
    """
    lines = [ln.strip() for ln in output.splitlines() if ln.strip()]
    summary_line = ""

    # Prefer the last line that looks like pytest's final summary.
    for ln in reversed(lines[-200:]):
        if " in " in ln and any(k in ln for k in (" passed", " failed", " skipped", " error")):
            summary_line = ln
            break
    if not summary_line:
        # Fallback: parse the whole output.
        summary_line = output

    def _count(keyword: str) -> int:
        m = re.search(rf"(\d+)\s+{re.escape(keyword)}", summary_line)
        return int(m.group(1)) if m else 0

    passed = _count("passed")
    failed = _count("failed")
    skipped = _count("skipped")
    errors = _count("error") + _count("errors")

    # This task's report schema has no separate "errors" field; include them in failed.
    failed += errors

    total = passed + failed + skipped
    return total, passed, failed, skipped


def run_pytest_for_repo(project_root: Path, repo_path: Path, *, timeout_seconds: int = 240) -> PytestRun:
    cmd = [sys.executable, "-m", "pytest", "-v", "tests"]
    env = os.environ.copy()
    env["TEST_REPO"] = str(repo_path)

    proc = subprocess.run(
        cmd,
        cwd=str(project_root),
        env=env,
        capture_output=True,
        text=True,
        timeout=timeout_seconds,
    )
    stdout = proc.stdout or ""
    stderr = proc.stderr or ""

    total, passed, failed, skipped = _parse_pytest_summary(stdout + "\n" + stderr)
    # If parsing failed (e.g., collection error), infer totals crudely.
    if total == 0 and proc.returncode == 0:
        # A clean run should have produced a summary; keep zeros but mark as success.
        pass

    return PytestRun(
        success=proc.returncode == 0,
        return_code=proc.returncode,
        total=total,
        passed=passed,
        failed=failed,
        skipped=skipped,
        stdout=stdout,
        stderr=stderr,
    )


def _environment_info() -> dict[str, str]:
    return {
        "python_version": sys.version.replace("\n", " "),
        "platform": platform.platform(),
        "architecture": platform.machine(),
    }


def _write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def _write_json(path: Path, data: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, sort_keys=False) + "\n", encoding="utf-8")


def _build_report_content(before: PytestRun, after: PytestRun) -> str:
    def section(label: str, run: PytestRun) -> str:
        output = _truncate(run.stdout, limit=8000)
        return (
            f"## {label}\n"
            f"- **success**: `{run.success}`\n"
            f"- **return_code**: `{run.return_code}`\n"
            f"- **tests**: passed `{run.passed}` / total `{run.total}` (failed `{run.failed}`, skipped `{run.skipped}`)\n\n"
            "### Pytest output (truncated)\n"
            "```\n"
            f"{output}\n"
            "```\n"
        )

    success = after.success
    return (
        "## Summary\n"
        f"- **success**: `{success}`\n\n"
        + section("Before (`repository_before`)", before)
        + "\n"
        + section("After (`repository_after`)", after)
    )


def _build_log_summary(before: PytestRun, after: PytestRun) -> str:
    success = after.success
    return (
        "MARKDOWN BLOG SPA EVALUATION\n\n"
        f"success: {success}\n\n"
        "before:\n"
        f"  success: {before.success}\n"
        f"  return_code: {before.return_code}\n"
        f"  passed/total: {before.passed}/{before.total}\n"
        f"  failed: {before.failed}\n"
        f"  skipped: {before.skipped}\n\n"
        "after:\n"
        f"  success: {after.success}\n"
        f"  return_code: {after.return_code}\n"
        f"  passed/total: {after.passed}/{after.total}\n"
        f"  failed: {after.failed}\n"
        f"  skipped: {after.skipped}\n"
    )


def run_evaluation() -> dict[str, Any]:
    project_root = Path(__file__).resolve().parents[1]
    before_repo = project_root / "repository_before"
    after_repo = project_root / "repository_after"

    before = run_pytest_for_repo(project_root, before_repo)
    after = run_pytest_for_repo(project_root, after_repo)

    return {
        "before": before,
        "after": after,
        "comparison": {
            "before_tests_passed": before.success,
            "after_tests_passed": after.success,
            "before_total": before.total,
            "before_passed": before.passed,
            "before_failed": before.failed,
            "after_total": after.total,
            "after_passed": after.passed,
            "after_failed": after.failed,
        },
    }


def main() -> int:
    started_at = datetime.now()
    run_id = started_at.strftime("%Y%m%d-%H%M%S")

    project_root = Path(__file__).resolve().parents[1]
    reports_root = project_root / "evaluation" / "reports"
    ts_dir = reports_root / started_at.strftime("%Y-%m-%d") / started_at.strftime("%H-%M-%S")

    try:
        results = run_evaluation()
        before: PytestRun = results["before"]
        after: PytestRun = results["after"]
        success = after.success
        error: str | None = None if success else "After implementation tests failed"
    except Exception as e:  # noqa: BLE001 - evaluator must not crash silently
        results = None
        before = after = None  # type: ignore[assignment]
        success = False
        error = f"{type(e).__name__}: {e}"

    finished_at = datetime.now()
    duration_seconds = (finished_at - started_at).total_seconds()

    report: dict[str, Any] = {
        "run_id": run_id,
        "started_at": started_at.isoformat(),
        "finished_at": finished_at.isoformat(),
        "duration_seconds": round(duration_seconds, 6),
        "environment": _environment_info(),
        "before": (
            {
                "tests": {
                    "total": before.total,
                    "passed": before.passed,
                    "failed": before.failed,
                    "skipped": before.skipped,
                },
                "success": before.success,
                "return_code": before.return_code,
            }
            if before is not None
            else None
        ),
        "after": (
            {
                "tests": {
                    "total": after.total,
                    "passed": after.passed,
                    "failed": after.failed,
                    "skipped": after.skipped,
                },
                "success": after.success,
                "return_code": after.return_code,
            }
            if after is not None
            else None
        ),
        "comparison": results["comparison"] if isinstance(results, dict) and "comparison" in results else None,
        "success": success,
        "error": error,
    }

    # Always write mandatory artifacts to evaluation/reports/ (non-timestamped).
    report_path = reports_root / "report.json"
    report_content_path = reports_root / "report_content"
    log_summary_path = reports_root / "log_summary"

    _write_json(report_path, report)
    if before is not None and after is not None:
        _write_text(report_content_path, _build_report_content(before, after))
        _write_text(log_summary_path, _build_log_summary(before, after))
    else:
        _write_text(report_content_path, f"## Summary\n- **success**: `{success}`\n\n- **error**: `{error}`\n")
        _write_text(log_summary_path, f"MARKDOWN BLOG SPA EVALUATION\n\nsuccess: {success}\nerror: {error}\n")

    # Also write a timestamped copy (handy for local history).
    _write_json(ts_dir / "report.json", report)
    if before is not None and after is not None:
        _write_text(ts_dir / "report_content", _build_report_content(before, after))
        _write_text(ts_dir / "log_summary", _build_log_summary(before, after))

    print(f"Wrote report: {report_path}")
    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())

