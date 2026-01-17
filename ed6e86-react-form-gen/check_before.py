#!/usr/bin/env python3
"""Simple script to check repository_before files exist"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
REPO_BEFORE = ROOT / "repository_before"

required_files = [
    "Resources/html/form.html",
    "Resources/html/formdisplay.html",
    "Resources/js/formgenerator.js",
    "Resources/js/formdisplay.js"
]

if not REPO_BEFORE.exists():
    print(f"ERROR: repository_before directory not found at {REPO_BEFORE}", file=sys.stderr)
    sys.exit(1)

missing_files = []
for file_path in required_files:
    full_path = REPO_BEFORE / file_path
    if not full_path.exists():
        missing_files.append(file_path)
        print(f"MISSING: {file_path}", file=sys.stderr)

if missing_files:
    print(f"ERROR: Missing {len(missing_files)} required file(s)", file=sys.stderr)
    sys.exit(1)

print("SUCCESS: All required files present in repository_before")
sys.exit(0)
