import unittest
import time
from tests.test_ultra_bst import TestBSTConstraints, TestBSTIntegration


def run_tests():
    """Run all tests, measure execution time, and print a detailed summary"""
    print("=" * 70)
    print("BST COMPREHENSIVE TEST SUITE")
    print("=" * 70)
    print()

    start_time = time.time()

    loader = unittest.TestLoader()
    suite = unittest.TestSuite()

    suite.addTests(loader.loadTestsFromTestCase(TestBSTConstraints))
    suite.addTests(loader.loadTestsFromTestCase(TestBSTIntegration))

    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)

    elapsed_time = time.time() - start_time

    print()
    print("=" * 70)
    print("TEST SUMMARY")
    print("=" * 70)
    print(f"Total Execution Time: {elapsed_time:.2f} seconds")
    print(f"Tests Run: {result.testsRun}")
    print(f"Successes: {result.testsRun - len(result.failures) - len(result.errors)}")
    print(f"Failures: {len(result.failures)}")
    if result.failures:
        print("\nFailed Tests:")
        for test, traceback in result.failures:
            print(f"- {test}")
    print(f"Errors: {len(result.errors)}")
    if result.errors:
        print("\nTests with Errors:")
        for test, traceback in result.errors:
            print(f"- {test}")
    print("=" * 70)

    with open("evaluation_report.txt", "w") as f:
        f.write(f"Total Execution Time: {elapsed_time:.2f} seconds\n")
        f.write(f"Tests Run: {result.testsRun}\n")
        f.write(f"Successes: {result.testsRun - len(result.failures) - len(result.errors)}\n")
        f.write(f"Failures: {len(result.failures)}\n")
        f.write(f"Errors: {len(result.errors)}\n")

    return result.wasSuccessful()


if __name__ == "__main__":
    success = run_tests()
    exit(0 if success else 1)