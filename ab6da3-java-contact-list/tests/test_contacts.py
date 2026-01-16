import os
import re
import subprocess
import tempfile
from pathlib import Path


def _repo_path() -> Path:
    repo = os.environ.get("TEST_REPO_PATH")
    assert repo, "TEST_REPO_PATH env var must be set to /app/repository_before or /app/repository_after"
    p = Path(repo)
    assert p.exists(), f"TEST_REPO_PATH does not exist: {p}"
    return p


def _compile_contacts(repo: Path) -> Path:
    src = repo / "Contacts.java"
    assert src.exists(), f"Missing Contacts.java in {repo}"

    out_dir = Path(tempfile.mkdtemp(prefix="contacts-classes-"))
    proc = subprocess.run(
        ["javac", "-d", str(out_dir), str(src)],
        cwd=str(repo),
        capture_output=True,
        text=True,
    )
    assert proc.returncode == 0, f"javac failed:\nSTDOUT:\n{proc.stdout}\nSTDERR:\n{proc.stderr}"
    return out_dir


def _run_contacts(repo: Path, stdin: str) -> subprocess.CompletedProcess[str]:
    out_dir = _compile_contacts(repo)
    return subprocess.run(
        ["java", "-cp", str(out_dir), "Contacts"],
        input=stdin,
        cwd=str(repo),
        capture_output=True,
        text=True,
    )


def test_hackerrank_sample_case() -> None:
    repo = _repo_path()
    # Canonical sample for trie contacts.
    stdin = "\n".join(
        [
            "4",
            "add hack",
            "add hackerrank",
            "find hac",
            "find hak",
            "",
        ]
    )
    proc = _run_contacts(repo, stdin)
    assert proc.returncode == 0, f"Program crashed:\nSTDOUT:\n{proc.stdout}\nSTDERR:\n{proc.stderr}"
    assert proc.stdout == "2\n0\n"


def test_repeated_inserts_and_prefix_counts() -> None:
    repo = _repo_path()
    stdin = "\n".join(
        [
            "6",
            "add a",
            "add a",
            "add ab",
            "find a",
            "find ab",
            "find b",
            "",
        ]
    )
    proc = _run_contacts(repo, stdin)
    assert proc.returncode == 0, f"Program crashed:\nSTDOUT:\n{proc.stdout}\nSTDERR:\n{proc.stderr}"
    assert proc.stdout == "3\n1\n0\n"


def test_accepts_tokenized_input_format() -> None:
    repo = _repo_path()
    # Verifies parsing is token-based (Scanner.next / nextInt) and respects n commands.
    stdin = "3 add hi find h find hi"
    proc = _run_contacts(repo, stdin)
    assert proc.returncode == 0, f"Program crashed:\nSTDOUT:\n{proc.stdout}\nSTDERR:\n{proc.stderr}"
    # After adding "hi": "h" matches 1, "hi" matches 1
    assert proc.stdout == "1\n1\n"

