#!/usr/bin/env python3
"""
Meta test for AdjacentSumTest.java test suite.

This script validates that the test suite meets the following requirements:
1. Tests for empty and single-element arrays
2. Tests for arrays containing both positive and negative integers
3. Tests for arrays containing zero values in various positions
4. Tests for integer overflow and underflow behavior
5. Tests for boundary and extreme input values

Usage: python3 meta_test.py <repository_path>
Example: python3 meta_test.py repository_before
         python3 meta_test.py repository_after
"""

import os
import re
import subprocess
import sys


def parse_test_file(test_file_path):
    """Parse the Java test file and extract test method names and their contents."""
    with open(test_file_path, 'r') as f:
        content = f.read()

    # Find all test methods with their bodies (handle nested braces)
    test_methods = {}

    # Pattern to find @Test annotations followed by method declarations
    pattern = r'@Test\s+public\s+void\s+(\w+)\s*\(\s*\)\s*\{'

    for match in re.finditer(pattern, content):
        method_name = match.group(1)
        start_pos = match.end()

        # Find matching closing brace
        brace_count = 1
        pos = start_pos
        while brace_count > 0 and pos < len(content):
            if content[pos] == '{':
                brace_count += 1
            elif content[pos] == '}':
                brace_count -= 1
            pos += 1

        method_body = content[start_pos:pos-1]
        test_methods[method_name] = method_body

    return test_methods


def check_requirement_1(tests):
    """
    Requirement 1: The test suite shall verify correct behavior of AdjacentSum 
    when given empty and single-element arrays.

    Needs BOTH:
    - Test for empty array: int[] arr = {}
    - Test for single element array: int[] arr = {n} (single element)
    """
    has_empty_array_test = False
    has_single_element_test = False

    for name, body in tests.items():
        name_lower = name.lower()

        # Check for empty array test - explicit empty array {}
        if 'empty' in name_lower:
            has_empty_array_test = True
        elif re.search(r'int\s*\[\s*\]\s*\w+\s*=\s*\{\s*\}', body):
            has_empty_array_test = True

        # Check for single element array test
        if 'single' in name_lower:
            has_single_element_test = True
        # Pattern for single element: {number} where number has no comma after
        elif re.search(r'int\s*\[\s*\]\s*\w+\s*=\s*\{\s*-?\d+\s*\}', body):
            # Make sure it's not followed by comma (truly single element)
            if not re.search(r'int\s*\[\s*\]\s*\w+\s*=\s*\{\s*-?\d+\s*,', body):
                has_single_element_test = True

    return has_empty_array_test and has_single_element_test


def check_requirement_2(tests):
    """
    Requirement 2: The test suite shall validate AdjacentSum results for arrays 
    containing both positive and negative integers.

    Needs tests that have arrays with BOTH positive AND negative numbers in same array.
    """
    has_mixed_positive_negative_test = False

    for name, body in tests.items():
        name_lower = name.lower()

        # Direct indicator in name
        if 'mixed' in name_lower and ('positive' in name_lower or 'negative' in name_lower):
            has_mixed_positive_negative_test = True
            break

        # Find arrays and check if they contain both positive and negative
        array_matches = re.findall(r'\{([^}]+)\}', body)
        for arr_content in array_matches:
            # Check for presence of negative numbers
            has_negative = bool(re.search(r'-\d+', arr_content))
            # Check for presence of positive numbers (not part of negative)
            # Remove negative numbers first, then check for remaining digits
            without_negative = re.sub(r'-\d+', '', arr_content)
            has_positive = bool(re.search(r'\d+', without_negative))

            if has_negative and has_positive:
                has_mixed_positive_negative_test = True
                break

        if has_mixed_positive_negative_test:
            break

    return has_mixed_positive_negative_test


def check_requirement_3(tests):
    """
    Requirement 3: The test suite shall confirm correct handling of arrays
    containing zero values in various positions.

    Needs explicit test for arrays containing 0 values.
    """
    has_zero_test = False

    for name, body in tests.items():
        name_lower = name.lower()

        # Check if test name indicates zero testing
        if 'zero' in name_lower:
            has_zero_test = True
            break

        # Check for arrays containing 0 (as a standalone number, not part of larger number like 10)
        # Pattern: {0, or , 0, or , 0} - zero as array element
        if re.search(r'\{\s*0\s*,', body) or re.search(r',\s*0\s*,', body) or re.search(r',\s*0\s*\}', body):
            has_zero_test = True
            break

    return has_zero_test


def check_requirement_4(tests):
    """
    Requirement 4: The test suite shall include tests that exercise integer 
    overflow and underflow behavior based on Java int arithmetic.

    Needs BOTH:
    - Overflow test: Integer.MAX_VALUE + positive number
    - Underflow test: Integer.MIN_VALUE + negative number
    """
    has_overflow_test = False
    has_underflow_test = False

    for name, body in tests.items():
        name_lower = name.lower()

        # Check for overflow test
        if 'overflow' in name_lower:
            has_overflow_test = True
        # Integer.MAX_VALUE with a positive addend causes overflow
        if 'Integer.MAX_VALUE' in body:
            # Check if paired with positive number that would cause overflow
            if re.search(r'Integer\.MAX_VALUE\s*,\s*[1-9]', body) or re.search(r'[1-9]\s*,\s*Integer\.MAX_VALUE', body):
                has_overflow_test = True

        # Check for underflow test
        if 'underflow' in name_lower:
            has_underflow_test = True
        # Integer.MIN_VALUE with a negative addend causes underflow
        if 'Integer.MIN_VALUE' in body:
            # Check if paired with negative number that would cause underflow
            if re.search(r'Integer\.MIN_VALUE\s*,\s*-[1-9]', body) or re.search(r'-[1-9]\s*,\s*Integer\.MIN_VALUE', body):
                has_underflow_test = True

    return has_overflow_test and has_underflow_test


def check_requirement_5(tests):
    """
    Requirement 5: The test suite shall ensure consistent and well-defined behavior 
    for boundary and extreme input values to prevent future regressions.

    Needs tests for boundary values:
    - Integer.MAX_VALUE boundary test
    - Integer.MIN_VALUE boundary test
    """
    has_max_value_test = False
    has_min_value_test = False

    for name, body in tests.items():
        # Check for Integer.MAX_VALUE boundary test
        if 'Integer.MAX_VALUE' in body:
            has_max_value_test = True

        # Check for Integer.MIN_VALUE boundary test
        if 'Integer.MIN_VALUE' in body:
            has_min_value_test = True

    return has_max_value_test and has_min_value_test


def compile_and_run_tests(repo_path):
    """Compile Java files and run JUnit tests."""
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    full_repo_path = os.path.join(base_dir, repo_path)

    src_main = os.path.join(full_repo_path, 'src', 'main', 'java')
    src_test = os.path.join(full_repo_path, 'src', 'test')
    lib_dir = os.path.join(base_dir, 'lib')
    build_dir = os.path.join(full_repo_path, 'build')

    # Check if lib directory exists (for Docker environment)
    if not os.path.exists(lib_dir):
        print(f"Library directory not found: {lib_dir}")
        print("Skipping compilation (JUnit jars not available)")
        return None, "Compilation skipped - running in environment without JUnit jars"

    # Create build directory
    os.makedirs(build_dir, exist_ok=True)

    # Classpath separator (: for Unix, ; for Windows)
    cp_sep = ':' if os.name != 'nt' else ';'

    junit_jar = os.path.join(lib_dir, 'junit-4.13.2.jar')
    hamcrest_jar = os.path.join(lib_dir, 'hamcrest-core-1.3.jar')

    if not os.path.exists(junit_jar) or not os.path.exists(hamcrest_jar):
        print("JUnit jars not found in lib directory")
        return None, "Compilation skipped - JUnit jars not found"

    # Compile main source
    compile_main_cmd = [
        'javac', '-d', build_dir,
        os.path.join(src_main, 'AdjacentSum.java')
    ]

    result = subprocess.run(compile_main_cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Failed to compile main source: {result.stderr}")
        return False, result.stderr

    # Compile test source
    classpath = f"{build_dir}{cp_sep}{junit_jar}{cp_sep}{hamcrest_jar}"
    compile_test_cmd = [
        'javac', '-cp', classpath, '-d', build_dir,
        os.path.join(src_test, 'AdjacentSumTest.java')
    ]

    result = subprocess.run(compile_test_cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Failed to compile test source: {result.stderr}")
        return False, result.stderr

    # Run tests
    run_classpath = f"{build_dir}{cp_sep}{junit_jar}{cp_sep}{hamcrest_jar}"
    run_cmd = [
        'java', '-cp', run_classpath,
        'org.junit.runner.JUnitCore', 'AdjacentSumTest'
    ]

    result = subprocess.run(run_cmd, capture_output=True, text=True)

    # Parse test results
    output = result.stdout + result.stderr

    # Check if all tests passed
    all_passed = 'OK' in output and 'FAILURES' not in output

    return all_passed, output


def run_meta_tests(repo_path):
    """Run all meta tests on the given repository."""
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    test_file_path = os.path.join(base_dir, repo_path, 'src', 'test', 'AdjacentSumTest.java')

    if not os.path.exists(test_file_path):
        print(f"Error: Test file not found at {test_file_path}")
        return False

    print(f"Analyzing test file: {test_file_path}")
    print("=" * 60)

    tests = parse_test_file(test_file_path)

    print(f"Found {len(tests)} test methods:")
    for name in tests.keys():
        print(f"  - {name}")
    print("=" * 60)

    results = []

    # Check each requirement
    req1_passed = check_requirement_1(tests)
    results.append(('REQ-1: Empty and single-element arrays', req1_passed))

    req2_passed = check_requirement_2(tests)
    results.append(('REQ-2: Positive and negative integers', req2_passed))

    req3_passed = check_requirement_3(tests)
    results.append(('REQ-3: Arrays containing zero values', req3_passed))

    req4_passed = check_requirement_4(tests)
    results.append(('REQ-4: Integer overflow and underflow', req4_passed))

    req5_passed = check_requirement_5(tests)
    results.append(('REQ-5: Boundary and extreme values', req5_passed))

    # Print results
    print("\nRequirement Coverage Results:")
    print("-" * 60)

    passed_count = 0
    for req_name, passed in results:
        status = "PASS" if passed else "FAIL"
        print(f"  {req_name}: {status}")
        if passed:
            passed_count += 1

    print("-" * 60)
    print(f"Total: {passed_count}/{len(results)} requirements covered")
    print("=" * 60)

    # Try to compile and run the actual tests
    print("\nCompiling and running JUnit tests...")
    print("-" * 60)

    tests_passed, test_output = compile_and_run_tests(repo_path)

    if test_output:
        print("Test execution output:")
        if isinstance(test_output, list):
            for line in test_output:
                print(f"  {line}")
        else:
            for line in test_output.split('\n'):
                print(f"  {line}")

    print("-" * 60)

    if tests_passed is None:
        print("JUnit tests: SKIPPED (environment not configured)")
    elif tests_passed:
        print("JUnit tests: ALL PASSED")
    else:
        print("JUnit tests: SOME FAILED (or compilation error)")

    print("=" * 60)

    # Final verdict
    all_requirements_met = all(passed for _, passed in results)

    print("\nFinal Verdict:")
    if all_requirements_met:
        print("  SUCCESS: All requirements are covered by the test suite.")
        return True
    else:
        print("  FAILURE: Not all requirements are covered by the test suite.")
        missing = [name for name, passed in results if not passed]
        print(f"  Missing coverage for: {', '.join(missing)}")
        return False


def main():
    if len(sys.argv) != 2:
        print("Usage: python3 meta_test.py <repository_path>")
        print("Example: python3 meta_test.py repository_before")
        print("         python3 meta_test.py repository_after")
        sys.exit(1)

    repo_path = sys.argv[1]

    # Validate repository path
    if repo_path not in ['repository_before', 'repository_after']:
        print(f"Warning: Unexpected repository path '{repo_path}'")
        print("Expected 'repository_before' or 'repository_after'")

    print(f"\nRunning meta tests for: {repo_path}")
    print("=" * 60)

    success = run_meta_tests(repo_path)

    # Exit with appropriate code
    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()
