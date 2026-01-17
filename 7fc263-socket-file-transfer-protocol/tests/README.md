# File Transfer System - Test Suite

Comprehensive test suite for the robust file transfer system with multiple test categories and detailed reporting.

## Test Structure

```
tests/
├── __init__.py                 # Test package initialization
├── README.md                   # This file
├── run_all_tests.py           # Main test runner with reporting
├── test_config.py             # Test utilities and configuration
├── test_file_transfer.py      # Core functionality tests
├── test_performance.py        # Performance and load tests
└── test_error_handling.py     # Error condition tests
```

## Test Categories

### 1. Core Functionality Tests (`test_file_transfer.py`)
Tests the basic file transfer functionality:
- Server initialization and configuration
- Client initialization and configuration
- Small file transfers
- Medium file transfers
- Large binary file transfers
- JSON file transfers
- Empty file transfers
- Non-existent file handling
- Concurrent transfers (multiple clients)
- Checksum calculation and verification
- Connection retry logic
- File integrity verification

### 2. Performance Tests (`test_performance.py`)
Tests system performance and scalability:
- Transfer speed measurements (1MB, 5MB, 10MB files)
- Concurrent connection handling (10+ clients)
- Repeated transfer consistency
- Memory usage monitoring
- Resource utilization tracking

**Note:** Performance tests require `psutil` package for memory monitoring.

### 3. Error Handling Tests (`test_error_handling.py`)
Tests error conditions and recovery:
- File not found scenarios
- Connection refused handling
- Invalid hostname handling
- Port out of range handling
- Server socket errors
- Client timeout handling
- Interrupted transfer simulation
- Corrupted data handling
- Disk space issues
- Malformed filename handling
- Retry logic timing verification

## Running Tests

### Run All Tests
```bash
# From project root
python tests/run_all_tests.py

# Or using Python module syntax
python -m tests.run_all_tests
```

### Run Specific Test Modules
```bash
# Core functionality tests
python -m unittest tests.test_file_transfer

# Performance tests
python -m unittest tests.test_performance

# Error handling tests
python -m unittest tests.test_error_handling
```

### Run Specific Test Classes
```bash
# File transfer system tests
python -m unittest tests.test_file_transfer.TestFileTransferSystem

# Protocol component tests
python -m unittest tests.test_file_transfer.TestProtocolComponents

# Performance tests
python -m unittest tests.test_performance.TestPerformance

# Error handling tests
python -m unittest tests.test_error_handling.TestErrorHandling

# Retry logic tests
python -m unittest tests.test_error_handling.TestRetryLogic
```

### Run Specific Test Methods
```bash
# Test small file transfer
python -m unittest tests.test_file_transfer.TestFileTransferSystem.test_small_file_transfer

# Test concurrent transfers
python -m unittest tests.test_file_transfer.TestFileTransferSystem.test_concurrent_transfers

# Test transfer speed
python -m unittest tests.test_performance.TestPerformance.test_transfer_speed_1mb

# Test file not found
python -m unittest tests.test_error_handling.TestErrorHandling.test_file_not_found
```

## Test Configuration

### Environment Setup
Tests automatically create isolated test environments:
- Temporary directories for server files and client downloads
- Separate log directories
- Unique test ports to avoid conflicts
- Automatic cleanup after tests

### Test Ports
- Core functionality tests: 19999
- Performance tests: 19998  
- Error handling tests: 19997

### Test Files
Tests automatically generate various file types:
- Small text files (< 1KB)
- Medium text files (~50KB)
- Large binary files (1MB, 5MB, 10MB)
- JSON data files
- Empty files

## Test Output

### Summary Report
The test runner provides a comprehensive summary:
```
TEST SUMMARY REPORT
================================================================================

Overall Results:
  Total Tests:    45
  Passed:         43
  Failed:         1
  Errors:         1
  Skipped:        0
  Success Rate:   95.6%
  Total Duration: 12.34s

Per-Suite Results:
Suite                     Tests    Pass     Fail     Error    Skip     Rate     Time    
------------------------- -------- -------- -------- -------- -------- -------- --------
Core Functionality Tests  15       15       0        0        0        100.0%   3.45s   
Performance Tests         10       9        1        0        0        90.0%    8.12s   
Error Handling Tests      20       19       0        1        0        95.0%    0.77s   
```

### Detailed Failure Reports
Failed tests include full tracebacks and error details for debugging.

### Performance Metrics
Performance tests report:
- Transfer speeds (MB/s)
- Concurrent connection handling
- Memory usage statistics
- Timing consistency measurements

## Dependencies

### Required (Standard Library)
- `unittest` - Test framework
- `threading` - Concurrent testing
- `socket` - Network testing
- `tempfile` - Temporary test environments
- `hashlib` - Checksum verification
- `time` - Performance timing
- `os`, `sys`, `pathlib` - File system operations

### Optional
- `psutil` - Memory usage monitoring (for performance tests)

Install optional dependencies:
```bash
pip install psutil
```

## Test Utilities

### TestEnvironment Class
Manages test environment setup and cleanup:
```python
from tests.test_config import TestEnvironment

env = TestEnvironment()
env.setup(port=19999)
env.create_test_file('test.txt', content='Hello World')
server = env.start_server()
client = env.get_client()
# ... run tests ...
env.cleanup()
```

### TestFileGenerator Class
Generates various types of test files:
```python
from tests.test_config import TestFileGenerator

TestFileGenerator.create_text_file('test.txt', lines=100)
TestFileGenerator.create_binary_file('data.bin', size_bytes=1024*1024)
TestFileGenerator.create_json_file('data.json', {'key': 'value'})
TestFileGenerator.create_empty_file('empty.txt')
```

### TestAssertions Class
Custom assertions for file transfer testing:
```python
from tests.test_config import TestAssertions

TestAssertions.assert_file_exists('downloaded.txt')
TestAssertions.assert_file_size('downloaded.txt', 1024)
TestAssertions.assert_file_checksum('downloaded.txt', 'abc123...')
TestAssertions.assert_files_identical('original.txt', 'downloaded.txt')
```

## Continuous Integration

### GitHub Actions Example
```yaml
name: Test File Transfer System

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        python-version: [3.6, 3.7, 3.8, 3.9, '3.10']
    
    steps:
    - uses: actions/checkout@v2
    - name: Set up Python ${{ matrix.python-version }}
      uses: actions/setup-python@v2
      with:
        python-version: ${{ matrix.python-version }}
    
    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip
        pip install psutil  # For performance tests
    
    - name: Run tests
      run: |
        python tests/run_all_tests.py
```

## Troubleshooting

### Common Issues

**Port Already in Use**
```
OSError: [Errno 98] Address already in use
```
- Solution: Change test ports in test configuration
- Or wait for ports to be released

**Permission Denied**
```
PermissionError: [Errno 13] Permission denied
```
- Solution: Ensure write permissions in test directory
- Run tests with appropriate user permissions

**Import Errors**
```
ModuleNotFoundError: No module named 'server'
```
- Solution: Ensure repository_after directory contains server.py and client.py
- Check Python path configuration

**Test Timeouts**
```
Test timed out after 30 seconds
```
- Solution: Increase timeout values in test configuration
- Check system performance and network connectivity

### Debug Mode

Enable verbose output:
```bash
python -m unittest tests.test_file_transfer -v
```

Check test logs:
```bash
# Test logs are created in temporary directories
# Check console output for log directory paths
ls /tmp/file_transfer_test_*/logs/
```

### Performance Issues

If performance tests fail:
1. Check system resources (CPU, memory, disk)
2. Adjust performance thresholds in test configuration
3. Run tests on a less loaded system
4. Consider network latency factors

## Contributing

### Adding New Tests

1. Create test methods following naming convention: `test_*`
2. Use appropriate test class (functionality, performance, error handling)
3. Include docstrings describing test purpose
4. Use test utilities for environment setup
5. Clean up resources in tearDown methods

### Test Guidelines

- **Isolation**: Each test should be independent
- **Cleanup**: Always clean up resources
- **Assertions**: Use descriptive assertion messages
- **Documentation**: Include clear docstrings
- **Performance**: Keep tests reasonably fast
- **Reliability**: Tests should be deterministic

### Example Test Method
```python
def test_new_feature(self):
    """Test description of what this test verifies"""
    # Setup
    env = TestEnvironment().setup()
    env.create_test_file('test.txt', content='test data')
    server = env.start_server()
    client = env.get_client()
    
    try:
        # Test execution
        result = client.download('test.txt')
        
        # Assertions
        self.assertTrue(result, "Download should succeed")
        TestAssertions.assert_file_exists(
            os.path.join(env.client_downloads_dir, 'test.txt')
        )
        
    finally:
        # Cleanup
        env.cleanup()
```

## Test Coverage

The test suite covers:
- ✅ Server initialization and configuration
- ✅ Client initialization and configuration  
- ✅ File transfer protocol implementation
- ✅ Multi-threading and concurrency
- ✅ Progress tracking and logging
- ✅ Checksum calculation and verification
- ✅ Error handling and recovery
- ✅ Retry logic with exponential backoff
- ✅ Network timeout handling
- ✅ File integrity verification
- ✅ Performance characteristics
- ✅ Resource usage monitoring
- ✅ Edge cases and error conditions

## License

This test suite is part of the File Transfer System project and follows the same MIT license.