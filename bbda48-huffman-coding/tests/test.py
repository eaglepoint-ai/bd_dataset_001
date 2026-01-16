import os
import sys
import tempfile
import subprocess

REPO_PATH = os.environ.get("REPO_PATH", os.path.join(os.path.dirname(__file__), "..", "repository_after"))
SCRIPT_PATH = os.path.join(REPO_PATH, "huffman.py")

def run_huffman(args):
    return subprocess.run(
        [sys.executable, SCRIPT_PATH] + args,
        capture_output=True,
        text=True
    )


def test_no_arguments():
    result = run_huffman([])
    assert result.returncode == 1
    assert "Usage" in result.stdout


def test_file_not_found():
    result = run_huffman(["nonexistent.txt"])
    assert result.returncode == 1
    assert "Error reading file" in result.stdout


def test_empty_file():
    with tempfile.NamedTemporaryFile(mode="w", delete=False) as f:
        filename = f.name

    result = run_huffman([filename])
    os.unlink(filename)

    assert result.returncode == 1
    assert "File is empty" in result.stdout


def test_single_character_file():
    with tempfile.NamedTemporaryFile(mode="w", delete=False) as f:
        f.write("aaaaaa")
        filename = f.name

    result = run_huffman([filename])
    os.unlink(filename)

    assert result.returncode == 0
    assert "a" in result.stdout
    assert "0" in result.stdout
    assert "Original bits" in result.stdout
    assert "Encoded bits" in result.stdout
    assert "Compression ratio" in result.stdout


def test_multiple_characters_file():
    with tempfile.NamedTemporaryFile(mode="w", delete=False) as f:
        f.write("hello world")
        filename = f.name

    result = run_huffman([filename])
    os.unlink(filename)

    assert result.returncode == 0
    assert "Character | Frequency | Huffman Code" in result.stdout
    assert "Original bits" in result.stdout
    assert "Encoded bits" in result.stdout
    assert "Compression ratio" in result.stdout


def test_compression_ratio_less_than_original():
    with tempfile.NamedTemporaryFile(mode="w", delete=False) as f:
        f.write("aaaaabbbbcccdde")
        filename = f.name

    result = run_huffman([filename])
    os.unlink(filename)

    assert result.returncode == 0

    for line in result.stdout.splitlines():
        if line.startswith("Compression ratio"):
            ratio = float(line.split(":")[1].strip())
            assert ratio > 1
            break
    else:
        assert False, "Compression ratio not found in output"
