import json
import os
import platform
import re
import subprocess
import sys
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parent.parent
REPO_BEFORE = REPO_ROOT / "repository_before"
REPO_AFTER = REPO_ROOT / "repository_after"
TESTS_DIR = REPO_ROOT / "tests"


def _run(cmd: list[str], *, cwd: Path, env: dict[str, str] | None = None) -> tuple[int, str]:
    proc = subprocess.run(
        cmd,
        cwd=str(cwd),
        env=env,
        capture_output=True,
        text=True,
    )
    out = (proc.stdout or "") + (proc.stderr or "")
    return proc.returncode, out


def _parse_pytest_counts(output: str) -> dict:
    """
    Parse pytest summary lines like:
      - "3 passed in 0.12s"
      - "1 failed, 2 passed in 0.12s"
    Falls back to zeros if not found.
    """
    passed = 0
    failed = 0
    skipped = 0

    m = re.search(r"(?:(\d+)\s+failed,\s+)?(?:(\d+)\s+passed,\s+)?(?:(\d+)\s+skipped,\s+)?in\s+[\d.]+s", output)
    if m:
        if m.group(1):
            failed = int(m.group(1))
        if m.group(2):
            passed = int(m.group(2))
        if m.group(3):
            skipped = int(m.group(3))

    # If we only matched "X passed in ..."
    m2 = re.search(r"(\d+)\s+passed\s+in\s+[\d.]+s", output)
    if m2 and passed == 0:
        passed = int(m2.group(1))

    total = passed + failed + skipped
    return {"passed": passed, "failed": failed, "skipped": skipped, "total": total}


def run_tests(repo_path: Path, repo_name: str) -> dict:
    print("\n" + "=" * 60)
    print(f"Running tests on {repo_name}")
    print("=" * 60)

    env = os.environ.copy()
    env["TEST_REPO_PATH"] = str(repo_path)

    rc, out = _run([sys.executable, "-m", "pytest", "-q", str(TESTS_DIR)], cwd=REPO_ROOT, env=env)
    print(out)

    counts = _parse_pytest_counts(out)
    return {
        "return_code": rc,
        "output": out,
        **counts,
        "success": rc == 0 and counts["failed"] == 0 and counts["passed"] > 0,
    }


def analyze_repo(repo_path: Path) -> dict:
    metrics = {
        "exists": repo_path.exists(),
        "contacts_java_exists": (repo_path / "Contacts.java").exists(),
        "java_file_count": 0,
        "contacts_java_lines": 0,
    }

    if not repo_path.exists():
        return metrics

    java_files = list(repo_path.rglob("*.java"))
    metrics["java_file_count"] = len(java_files)

    contacts = repo_path / "Contacts.java"
    if contacts.exists():
        metrics["contacts_java_lines"] = len(contacts.read_text(encoding="utf-8", errors="replace").splitlines())

    return metrics


def _java_version() -> str:
    rc, out = _run(["java", "-version"], cwd=REPO_ROOT)
    # java -version writes to stderr; _run merges stdout+stderr
    return out.strip() if rc == 0 else "unknown"


def write_report(report: dict) -> Path:
    now = datetime.now(timezone.utc)
    date_str = now.strftime("%Y-%m-%d")
    time_str = now.strftime("%H-%M-%S")

    report_dir = REPO_ROOT / "evaluation" / "reports" / date_str / time_str
    report_dir.mkdir(parents=True, exist_ok=True)

    report_path = report_dir / "report.json"
    report_path.write_text(json.dumps(report, indent=2, sort_keys=True), encoding="utf-8")

    latest_path = REPO_ROOT / "evaluation" / "reports" / "latest.json"
    latest_path.parent.mkdir(parents=True, exist_ok=True)
    latest_path.write_text(json.dumps(report, indent=2, sort_keys=True), encoding="utf-8")

    return report_path


def main() -> None:
    start = time.time()
    started_at = datetime.now(timezone.utc).isoformat()

    print("=" * 60)
    print("Java Trie Contacts Manager Evaluation")
    print("=" * 60)

    before_metrics = analyze_repo(REPO_BEFORE)
    after_metrics = analyze_repo(REPO_AFTER)

    print("\n[1/4] Running tests on repository_before (expected to FAIL)...")
    before_results = run_tests(REPO_BEFORE, "repository_before")

    print("\n[2/4] Running tests on repository_after (expected to PASS)...")
    after_results = run_tests(REPO_AFTER, "repository_after")

    finished_at = datetime.now(timezone.utc).isoformat()
    duration = time.time() - start

    success = (not before_results["success"]) and after_results["success"]

    report = {
        "run_id": str(uuid.uuid4()),
        "started_at": started_at,
        "finished_at": finished_at,
        "duration_seconds": duration,
        "environment": {
            "python_version": platform.python_version(),
            "platform": f"{platform.system()}-{platform.machine()}",
            "java_version": _java_version(),
        },
        "before": {"metrics": before_metrics, "tests": before_results},
        "after": {"metrics": after_metrics, "tests": after_results},
        "comparison": {
            "passed_gate": success,
            "improvement_summary": "After implementation passed correctness checks." if success else "Gate failed.",
        },
        "success": success,
        "error": None,
    }

    print("\n[3/4] Writing report...")
    report_path = write_report(report)

    print("\n" + "=" * 60)
    print("Evaluation Complete")
    print("=" * 60)
    print(f"Overall Success: {success}")
    print(f"Report saved to: {report_path}")

    print("\n[4/4] Exiting...")
    raise SystemExit(0 if success else 1)


if __name__ == "__main__":
    main()
