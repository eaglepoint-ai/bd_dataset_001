#!/usr/bin/env python3
"""
Evaluation script to compare test coverage between repository_before and repository_after.
Runs tests for both implementations and generates a comprehensive report.
"""

import json
import os
import re
import sys
import subprocess
import uuid
from datetime import datetime, timedelta
from pathlib import Path


def run_tests(repository_path, project_root):
    """
    Run tests for a given repository and return the results.
    
    Args:
        repository_path: Path to the repository (repository_before or repository_after)
        project_root: Path to the project root directory
    
    Returns:
        dict: Test results with output, return_code, and passed status
    """
    # Stay in project root, tests are in root tests/ folder
    original_dir = os.getcwd()
    repo_dir = Path(repository_path).resolve()
    project_root_path = Path(project_root).resolve()
    
    try:
        # Ensure we're in project root
        os.chdir(project_root_path)
        
        # Run pytest with PYTHONPATH set to repository being tested
        env = os.environ.copy()
        env['PYTHONPATH'] = str(repo_dir)
        
        # Run tests from root tests/ folder
        result = subprocess.run(
            [sys.executable, '-m', 'pytest', 'tests/', '-v', '--tb=short'],
            capture_output=True,
            text=True,
            env=env,
            timeout=300,  # 5 minute timeout
            cwd=str(project_root_path)
        )
        
        output = result.stdout + result.stderr
        return_code = result.returncode
        passed = return_code == 0
        
        return {
            'output': output,
            'return_code': return_code,
            'passed': passed
        }
    
    except subprocess.TimeoutExpired:
        return {
            'output': 'Test execution timed out after 5 minutes',
            'return_code': 124,
            'passed': False
        }
    except Exception as e:
        return {
            'output': f'Error running tests: {str(e)}',
            'return_code': 1,
            'passed': False
        }
    finally:
        os.chdir(original_dir)


def generate_report(before_result, after_result):
    """
    Generate a JSON report comparing before and after test results.
    
    Args:
        before_result: Test results from repository_before
        after_result: Test results from repository_after
    
    Returns:
        dict: Report data structure
    """
    run_id = str(uuid.uuid4())
    started_at = datetime.utcnow()
    finished_at = datetime.utcnow()
    duration_seconds = (finished_at - started_at).total_seconds()
    
    # Parse test counts from output
    def parse_test_counts(output):
        """Extract test counts from pytest output."""
        counts = {
            'total': 0,
            'passed': 0,
            'failed': 0,
            'errors': 0
        }
        
        # Try to parse pytest output format (supports both verbose and quiet modes)
        lines = output.split('\n')
        for line in lines:
            line_lower = line.lower()
            if 'passed' in line_lower or 'failed' in line_lower or 'error' in line_lower:
                # Format: "X passed", "X passed, Y failed", "X passed in Y.YYs", etc.
                # Match patterns like "5 passed", "30 passed", "5 passed, 1 failed"
                passed_match = re.search(r'(\d+)\s+passed', line_lower)
                failed_match = re.search(r'(\d+)\s+failed', line_lower)
                error_match = re.search(r'(\d+)\s+error', line_lower)
                
                if passed_match:
                    counts['passed'] = int(passed_match.group(1))
                if failed_match:
                    counts['failed'] = int(failed_match.group(1))
                if error_match:
                    counts['errors'] = int(error_match.group(1))
                
                if passed_match or failed_match or error_match:
                    counts['total'] = counts['passed'] + counts['failed'] + counts['errors']
                    break
        
        return counts
    
    before_counts = parse_test_counts(before_result['output'])
    after_counts = parse_test_counts(after_result['output'])
    
    report = {
        'run_id': run_id,
        'started_at': started_at.isoformat() + 'Z',
        'finished_at': finished_at.isoformat() + 'Z',
        'duration_seconds': duration_seconds,
        'environment': {
            'python_version': sys.version.split()[0],
            'platform': f'{sys.platform}-{sys.maxsize > 2**32 and "64bit" or "32bit"}'
        },
        'before': {
            'tests': {
                'output': before_result['output'],
                'return_code': before_result['return_code'],
                'passed': before_result['passed']
            },
            'metrics': {
                'test_counts': before_counts
            }
        },
        'after': {
            'tests': {
                'output': after_result['output'],
                'return_code': after_result['return_code'],
                'passed': after_result['passed']
            },
            'metrics': {
                'test_counts': after_counts
            }
        },
        'comparison': {
            'passed_gate': after_result['passed'],
            'test_count_increase': after_counts['total'] - before_counts['total'],
            'improvement_summary': f"After implementation has {after_counts['total']} tests vs {before_counts['total']} in before"
        },
        'success': after_result['passed'],
        'error': None if after_result['passed'] else 'Tests failed'
    }
    
    return report


def save_report(report):
    """
    Save the report to the reports directory structure.
    
    Args:
        report: Report dictionary to save
    """
    # Create reports directory structure
    reports_dir = Path('evaluation/reports')
    now = datetime.utcnow()
    date_dir = now.strftime('%Y-%m-%d')
    time_dir = now.strftime('%H-%M-%S')
    
    report_path = reports_dir / date_dir / time_dir
    report_path.mkdir(parents=True, exist_ok=True)
    
    # Save timestamped report
    report_file = report_path / 'report.json'
    with open(report_file, 'w') as f:
        json.dump(report, f, indent=2)
    
    # Also save to simple location for easy access
    simple_report_file = Path('evaluation/report.json')
    simple_report_file.parent.mkdir(parents=True, exist_ok=True)
    with open(simple_report_file, 'w') as f:
        json.dump(report, f, indent=2)
    
    print(f"[eval] Report written to: {report_file}")
    print(f"[eval] Latest report also at: {simple_report_file}")
    
    return report_file, simple_report_file


def main():
    """Main evaluation function."""
    print("[eval] Starting evaluation...")
    
    # Get project root
    project_root = Path(__file__).parent.parent
    
    # Run tests for repository_before (tests from root tests/ folder with PYTHONPATH=repository_before)
    print("[eval] Running tests for repository_before...")
    before_result = run_tests(project_root / 'repository_before', project_root)
    
    # Run tests for repository_after (tests from root tests/ folder with PYTHONPATH=repository_after)
    print("[eval] Running tests for repository_after...")
    after_result = run_tests(project_root / 'repository_after', project_root)
    
    # Generate report
    print("[eval] Generating report...")
    report = generate_report(before_result, after_result)
    
    # Save report
    report_file, simple_report_file = save_report(report)
    
    print(f"[eval] Evaluation completed")
    print(f"[eval] Before: {report['before']['tests']['passed']} (return code: {report['before']['tests']['return_code']})")
    print(f"[eval] After: {report['after']['tests']['passed']} (return code: {report['after']['tests']['return_code']})")
    
    # Exit with appropriate code
    sys.exit(0 if report['success'] else 1)


if __name__ == '__main__':
    main()
