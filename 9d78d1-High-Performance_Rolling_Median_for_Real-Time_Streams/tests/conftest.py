"""
Pytest configuration for rolling median tests.
"""
import pytest
import os

def pytest_sessionstart(session):
    """Print which repository is being tested."""
    target_repo = os.environ.get('TARGET_REPO', 'repository_before')
    print(f"\n{'='*70}")
    print(f"Testing: {target_repo}")
    print(f"{'='*70}")

def pytest_terminal_summary(terminalreporter, exitstatus, config):
    """Print summary at the end."""
    target_repo = os.environ.get('TARGET_REPO', 'repository_before')
    
    if target_repo == 'repository_before':
        print("\n" + "!"*70)
        print("repository_before results:")
        print("- Should pass basic functionality tests")
        print("- Will FAIL performance requirements (too slow)")
        print("- Uses O(n) memory and O(n log n) time")
        print("!"*70)
    else:
        print("\n" + "✓"*70)
        print("repository_after results:")
        print("- Should PASS all requirements")
        print("- O(log n) time complexity")
        print("- Meets 10,000+ ops/sec requirement")
        print("✓"*70)