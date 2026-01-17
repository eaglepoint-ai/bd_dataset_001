#!/usr/bin/env python3
import os
import sys
import json
import uuid
import platform
import subprocess
import signal
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional


# Configuration
STARTUP_TIMEOUT = 30
TEST_TIMEOUT = 300


def generate_run_id():
    """Generate a short unique run ID."""
    return uuid.uuid4().hex[:8]


def get_git_info():
    """Get git commit and branch information."""
    git_info = {"git_commit": "unknown", "git_branch": "unknown"}
    try:
        result = subprocess.run(
            ["git", "rev-parse", "HEAD"],
            capture_output=True,
            text=True,
            timeout=5
        )
        if result.returncode == 0:
            git_info["git_commit"] = result.stdout.strip()[:8]
    except Exception:
        pass

    try:
        result = subprocess.run(
            ["git", "rev-parse", "--abbrev-ref", "HEAD"],
            capture_output=True,
            text=True,
            timeout=5
        )
        if result.returncode == 0:
            git_info["git_branch"] = result.stdout.strip()
    except Exception:
        pass

    return git_info


def get_environment_info():
    """Collect environment information for the report."""
    git_info = get_git_info()
    
    rust_version = "unknown"
    try:
        result = subprocess.run(
            ["rustc", "--version"],
            capture_output=True,
            text=True,
            timeout=5
        )
        if result.returncode == 0:
            rust_version = result.stdout.strip()
    except Exception:
        pass

    return {
        "python_version": platform.python_version(),
        "platform": platform.platform(),
        "os": platform.system(),
        "os_release": platform.release(),
        "architecture": platform.machine(),
        "hostname": platform.node(),
        "git_commit": git_info["git_commit"],
        "git_branch": git_info["git_branch"],
        "rust_version": rust_version
    }


def build_and_start_server(repo_path: Path):
    """
    Build and start the Rust server from the given repository path.
    Returns (process, build_info)
    """
    backend_path = repo_path / "bookstore_backend"
    
    if not backend_path.exists():
        return None, {"success": False, "output": f"Backend path not found: {backend_path}"}
    
    # Build
    print(f"Building Rust project in {backend_path}...")
    try:
        build_result = subprocess.run(
            ["cargo", "build", "--release"],
            cwd=str(backend_path),
            capture_output=True,
            text=True,
            timeout=180
        )
        
        if build_result.returncode != 0:
            return None, {
                "success": False, 
                "output": f"Build failed: {build_result.stderr[:2000]}"
            }
            
    except Exception as e:
        return None, {"success": False, "output": f"Build error: {str(e)}"}
        
    # Start
    print("Starting server...")
    try:
        if sys.platform == "win32":
            process = subprocess.Popen(
                ["cargo", "run", "--release"],
                cwd=str(backend_path),
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                creationflags=subprocess.CREATE_NEW_PROCESS_GROUP
            )
        else:
            process = subprocess.Popen(
                ["cargo", "run", "--release"],
                cwd=str(backend_path),
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                preexec_fn=os.setsid
            )
            
        # Wait for server ready
        ready = False
        import socket
        start = time.time()
        while time.time() - start < STARTUP_TIMEOUT:
            try:
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.settimeout(1)
                result = sock.connect_ex(('127.0.0.1', 8080))
                sock.close()
                if result == 0:
                    ready = True
                    break
            except Exception:
                pass
            time.sleep(0.5)
            
        if not ready:
            stop_server(process)
            return None, {"success": False, "output": "Server failed to respond to connection check"}
            
        return process, {"success": True, "output": "Build and start successful"}
        
    except Exception as e:
        return None, {"success": False, "output": f"Start error: {str(e)}"}


def stop_server(process):
    """Stop the server process."""
    if process:
        try:
            if sys.platform == "win32":
                process.terminate()
            else:
                os.killpg(os.getpgid(process.pid), signal.SIGTERM)
            process.wait(timeout=5)
        except Exception:
            try:
                process.kill()
            except Exception:
                pass


def run_pytest_with_pythonpath(repo_path, tests_dir, label):
    """
    Run pytest on the tests/ folder with the server running from repo_path.
    """
    print(f"\n{'=' * 60}")
    print(f"RUNNING TESTS: {label.upper()}")
    print(f"{'=' * 60}")
    
    server_process = None
    build_info = {"success": False, "output": "Not attempted"}
    
    # Try to start server (will fail for empty 'before' repo)
    server_process, build_info = build_and_start_server(Path(repo_path))
    
    if not server_process:
        print(f"Server start failed: {build_info.get('output')}")
        # Return expected failure if this is the 'before' run
        return {
            "success": False,
            "exit_code": -1,
            "tests": [],
            "summary": {"error": "Server failed to start"},
            "stdout": "",
            "stderr": build_info.get("output", ""),
        }

    try:
        # Build pytest command - passing the repo path as environment var so tests know context if needed
        cmd = [
            sys.executable, "-m", "pytest",
            str(tests_dir),
            "-v",
            "--tb=short",
        ]

        env = os.environ.copy()
        env["REPO_PATH"] = str(repo_path.name) # repository_before or repository_after

        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            cwd=str(Path(tests_dir).parent),
            env=env,
            timeout=TEST_TIMEOUT
        )

        stdout = result.stdout
        stderr = result.stderr

        # Parse verbose output
        tests = parse_pytest_verbose_output(stdout)

        # Count results
        passed = sum(1 for t in tests if t.get("outcome") == "passed")
        failed = sum(1 for t in tests if t.get("outcome") == "failed")
        errors = sum(1 for t in tests if t.get("outcome") == "error")
        skipped = sum(1 for t in tests if t.get("outcome") == "skipped")
        total = len(tests)

        print(f"\nResults: {passed} passed, {failed} failed, {errors} errors, {skipped} skipped (total: {total})")

        return {
            "success": result.returncode == 0,
            "exit_code": result.returncode,
            "tests": tests,
            "summary": {
                "total": total,
                "passed": passed,
                "failed": failed,
                "errors": errors,
                "skipped": skipped,
            },
            "stdout": stdout,
            "stderr": stderr,
        }

    except Exception as e:
        print(f"ERROR running tests: {e}")
        return {
            "success": False,
            "exit_code": -1,
            "tests": [],
            "summary": {"error": str(e)},
            "stdout": "",
            "stderr": "",
        }
    finally:
        stop_server(server_process)


def parse_pytest_verbose_output(output):
    """Parse pytest verbose output to extract test results."""
    tests = []
    lines = output.split('\n')

    for line in lines:
        line_stripped = line.strip()
        if '::' in line_stripped:
            outcome = None
            if ' PASSED' in line_stripped:
                outcome = "passed"
            elif ' FAILED' in line_stripped:
                outcome = "failed"
            elif ' ERROR' in line_stripped:
                outcome = "error"
            elif ' SKIPPED' in line_stripped:
                outcome = "skipped"

            if outcome:
                for status_word in [' PASSED', ' FAILED', ' ERROR', ' SKIPPED']:
                    if status_word in line_stripped:
                        nodeid = line_stripped.split(status_word)[0].strip()
                        break
                
                tests.append({
                    "nodeid": nodeid,
                    "name": nodeid.split("::")[-1] if "::" in nodeid else nodeid,
                    "outcome": outcome,
                })

    return tests


def run_evaluation():
    """Run complete evaluation."""
    print(f"\n{'=' * 60}")
    print("BOOKSTORE SERVICE EVALUATION")
    print(f"{'=' * 60}")

    project_root = Path(__file__).parent.parent
    tests_dir = project_root / "tests"

    # Run tests with AFTER implementation
    after_results = run_pytest_with_pythonpath(
        project_root / "repository_after",
        tests_dir,
        "after (repository_after)"
    )

    # Build comparison
    comparison = {
        "after_total": after_results.get("summary", {}).get("total", 0),
        "after_passed": after_results.get("summary", {}).get("passed", 0),
        "after_failed": after_results.get("summary", {}).get("failed", 0),
    }

    print(f"\n{'=' * 60}")
    print("EVALUATION SUMMARY")
    print(f"{'=' * 60}")
    
    print(f"\nAfter Implementation:")
    print(f"  Overall: {'PASSED' if after_results.get('success') else 'FAILED'}")
    print(f"  Tests: {comparison['after_passed']}/{comparison['after_total']} passed")

    return {
        "after": after_results,
        "comparison": comparison,
    }


def generate_output_path():
    """Generate output path in format: evaluation/reports/YYYY-MM-DD/HH-MM-SS/report.json"""
    now = datetime.now()
    date_str = now.strftime("%Y-%m-%d")
    time_str = now.strftime("%H-%M-%S")

    project_root = Path(__file__).parent.parent
    output_dir = project_root / "evaluation" / "reports" / date_str / time_str
    output_dir.mkdir(parents=True, exist_ok=True)

    return output_dir / "report.json"


def main():
    """Main entry point."""
    import argparse
    
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=str, default=None)
    args = parser.parse_args()

    run_id = generate_run_id()
    started_at = datetime.now()

    print(f"Run ID: {run_id}")
    print(f"Started at: {started_at.isoformat()}")

    results = run_evaluation()
    
    # Success if after passes (before is expected to fail)
    success = results["after"].get("success", False)
    
    finished_at = datetime.now()
    duration = (finished_at - started_at).total_seconds()

    report = {
        "run_id": run_id,
        "started_at": started_at.isoformat(),
        "finished_at": finished_at.isoformat(),
        "duration_seconds": round(duration, 6),
        "success": success,
        "environment": get_environment_info(),
        "results": results,
    }

    if args.output:
        output_path = Path(args.output)
    else:
        output_path = generate_output_path()

    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, "w") as f:
        json.dump(report, f, indent=2)
    
    # also save to latest.json for convenience
    latest_path = output_path.parent.parent.parent / "latest.json" 
    with open(latest_path, "w") as f:
        json.dump(report, f, indent=2)
        
    print(f"\nReport saved to: {output_path}")
    print(f"Latest report: {latest_path}")

    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())
