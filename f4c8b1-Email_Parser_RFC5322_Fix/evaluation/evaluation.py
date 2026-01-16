"""
Evaluation script to compare repository_before vs repository_after
Runs pytest on both implementations and generates a comparison report
"""
import json
import sys
import subprocess
from datetime import datetime
from pathlib import Path


def run_pytest_json(test_path: str, pythonpath: str = None) -> dict:
    """Run pytest and capture results in JSON format"""
    try:
        import os
        env = os.environ.copy()
        if pythonpath:
            env['PYTHONPATH'] = pythonpath
        
        result = subprocess.run(
            ['pytest', test_path, '-v', '--tb=short'],
            capture_output=True,
            text=True,
            timeout=60,
            env=env
        )
        
        return {
            'return_code': result.returncode,
            'passed': result.returncode == 0,
            'stdout': result.stdout,
            'stderr': result.stderr
        }
    except subprocess.TimeoutExpired:
        return {
            'return_code': -1,
            'passed': False,
            'stdout': '',
            'stderr': 'Test execution timed out'
        }
    except Exception as e:
        return {
            'return_code': -1,
            'passed': False,
            'stdout': '',
            'stderr': str(e)
        }


def parse_pytest_output(output: str) -> dict:
    """Parse pytest output to extract test statistics"""
    stats = {
        'total': 0,
        'passed': 0,
        'failed': 0,
        'errors': 0,
        'skipped': 0
    }
    
    # Look for summary line like: "5 passed, 2 failed in 1.23s"
    import re
    
    # Count passed
    passed_match = re.search(r'(\d+) passed', output)
    if passed_match:
        stats['passed'] = int(passed_match.group(1))
    
    # Count failed
    failed_match = re.search(r'(\d+) failed', output)
    if failed_match:
        stats['failed'] = int(failed_match.group(1))
    
    # Count errors
    error_match = re.search(r'(\d+) error', output)
    if error_match:
        stats['errors'] = int(error_match.group(1))
    
    # Count skipped
    skipped_match = re.search(r'(\d+) skipped', output)
    if skipped_match:
        stats['skipped'] = int(skipped_match.group(1))
    
    stats['total'] = stats['passed'] + stats['failed'] + stats['errors'] + stats['skipped']
    
    return stats


def truncate_output(text: str, max_length: int = 10000) -> dict:
    """Truncate long output for report"""
    if len(text) <= max_length:
        return {
            'text': text,
            'truncated': False,
            'original_length': len(text)
        }
    return {
        'text': text[:max_length] + '\n\n... [truncated] ...',
        'truncated': True,
        'original_length': len(text)
    }


def main():
    print("[Evaluation] Email Parser RFC 5322 Fix")
    print("=" * 60)
    
    # Get absolute paths
    repo_root = Path(__file__).parent.parent
    before_path = str(repo_root / 'repository_before')
    after_path = str(repo_root / 'repository_after')
    
    # Run tests
    print("\n[1/2] Running tests on repository_before...")
    before_all = run_pytest_json('tests/', pythonpath=before_path)
    
    print("\n[2/2] Running tests on repository_after...")
    after_result = run_pytest_json('tests/test_email_parser.py', pythonpath=after_path)
    
    # Parse statistics
    before_stats = parse_pytest_output(before_all['stdout'])
    after_stats = parse_pytest_output(after_result['stdout'])
    
    print("\n" + "=" * 60)
    print("RESULTS SUMMARY")
    print("=" * 60)
    
    print(f"\nRepository Before:")
    print(f"  Total tests: {before_stats['total']}")
    print(f"  Passed: {before_stats['passed']}")
    print(f"  Failed: {before_stats['failed']}")
    print(f"  Errors: {before_stats['errors']}")
    
    print(f"\nRepository After:")
    print(f"  Total tests: {after_stats['total']}")
    print(f"  Passed: {after_stats['passed']}")
    print(f"  Failed: {after_stats['failed']}")
    print(f"  Errors: {after_stats['errors']}")
    
    # Determine improvement
    improvement = after_stats['passed'] > before_stats['passed']
    all_passed = after_result['passed']
    
    print(f"\nImprovement: {'YES ✓' if improvement else 'NO ✗'}")
    print(f"All After Tests Passed: {'YES ✓' if all_passed else 'NO ✗'}")
    
    # Generate report
    now = datetime.now()
    report = {
        'timestamp': now.isoformat(),
        'run_date': now.strftime('%Y-%m-%d %H:%M:%S'),
        'before': {
            'tests': before_stats,
            'return_code': before_all['return_code'],
            'passed': before_all['passed'],
            'output': truncate_output(before_all['stdout'], 8000),
            'errors': truncate_output(before_all['stderr'], 2000)
        },
        'after': {
            'tests': after_stats,
            'return_code': after_result['return_code'],
            'passed': after_result['passed'],
            'output': truncate_output(after_result['stdout'], 8000),
            'errors': truncate_output(after_result['stderr'], 2000)
        },
        'comparison': {
            'improvement': improvement,
            'tests_fixed': after_stats['passed'] - before_stats['passed'],
            'all_tests_pass': all_passed,
            'summary': (
                f"After implementation: {after_stats['passed']}/{after_stats['total']} tests passed. "
                f"Improvement: {after_stats['passed'] - before_stats['passed']} additional tests passing."
            )
        },
        'success': all_passed
    }
    
    # Save report to reports/YYYY-MM-DD/HH-MM-SS/report.json
    reports_dir = Path('evaluation/reports')
    date_dir = reports_dir / now.strftime('%Y-%m-%d')
    time_dir = date_dir / now.strftime('%H-%M-%S')
    time_dir.mkdir(parents=True, exist_ok=True)
    
    report_path = time_dir / 'report.json'
    with open(report_path, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
    
    # Also save as latest.json for easy access
    latest_path = reports_dir / 'latest.json'
    with open(latest_path, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
    
    print(f"\n{'=' * 60}")
    print(f"Report saved to: {report_path}")
    print(f"Also available at: {latest_path}")
    print(f"{'=' * 60}\n")
    
    # Exit with appropriate code
    sys.exit(0 if report['success'] else 1)


if __name__ == '__main__':
    main()
