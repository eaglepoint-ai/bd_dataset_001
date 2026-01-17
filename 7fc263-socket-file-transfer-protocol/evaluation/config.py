#!/usr/bin/env python3
"""
Evaluation Configuration
Configuration settings and constants for the file transfer system evaluation.
"""

# Evaluation scoring weights
SCORING_WEIGHTS = {
    'requirements_compliance': 0.30,  # 30% - Must meet all specified requirements
    'functionality': 0.25,           # 25% - Core functionality tests
    'performance': 0.20,             # 20% - Performance benchmarks
    'reliability': 0.15,             # 15% - Reliability and consistency
    'implementation_quality': 0.10   # 10% - Code quality improvements
}

# Performance benchmarks
PERFORMANCE_BENCHMARKS = {
    'min_transfer_speed_mbps': 1.0,      # Minimum acceptable transfer speed
    'max_concurrent_clients': 10,        # Target concurrent client support
    'max_transfer_time_1mb': 10.0,       # Max time for 1MB transfer (seconds)
    'max_transfer_time_5mb': 30.0,       # Max time for 5MB transfer (seconds)
    'consistency_threshold': 0.5,        # Max std dev as fraction of mean time
}

# Test file configurations
TEST_FILES = {
    'tiny': {
        'name': 'tiny.txt',
        'size': 5,  # bytes
        'type': 'text',
        'content': 'Hello'
    },
    'small': {
        'name': 'small.txt', 
        'size': 1024,  # 1KB
        'type': 'text',
        'content': 'A' * 1024
    },
    'medium': {
        'name': 'medium.txt',
        'size': 50 * 1024,  # 50KB
        'type': 'text',
        'content': 'B' * (50 * 1024)
    },
    'large_1mb': {
        'name': 'large_1mb.bin',
        'size': 1024 * 1024,  # 1MB
        'type': 'binary',
        'content': None  # Will be random data
    },
    'large_5mb': {
        'name': 'large_5mb.bin',
        'size': 5 * 1024 * 1024,  # 5MB
        'type': 'binary',
        'content': None  # Will be random data
    },
    'empty': {
        'name': 'empty.txt',
        'size': 0,
        'type': 'text',
        'content': ''
    },
    'json': {
        'name': 'data.json',
        'size': None,  # Variable
        'type': 'json',
        'content': {
            'test': True,
            'data': list(range(100)),
            'nested': {'key': 'value', 'array': [1, 2, 3]}
        }
    }
}

# Requirements to evaluate
REQUIREMENTS = {
    'concurrent_clients': {
        'description': 'Handle multiple concurrent clients',
        'test_method': 'test_concurrent_clients',
        'weight': 0.25
    },
    'progress_tracking': {
        'description': 'Tracks transfer progress',
        'test_method': 'test_progress_tracking',
        'weight': 0.20
    },
    'configurable_ports': {
        'description': 'Configurable ports',
        'test_method': 'test_configurable_ports',
        'weight': 0.15
    },
    'tcp_sockets': {
        'description': 'Must use TCP sockets',
        'test_method': 'test_tcp_sockets',
        'weight': 0.20
    },
    'logging': {
        'description': 'Log all operations to files',
        'test_method': 'test_logging',
        'weight': 0.20
    }
}

# Functionality tests
FUNCTIONALITY_TESTS = {
    'text_transfer': {
        'description': 'Transfer text files',
        'files': ['tiny.txt', 'small.txt', 'medium.txt'],
        'weight': 0.20
    },
    'binary_transfer': {
        'description': 'Transfer binary files',
        'files': ['large_1mb.bin'],
        'weight': 0.25
    },
    'json_transfer': {
        'description': 'Transfer JSON files',
        'files': ['data.json'],
        'weight': 0.15
    },
    'empty_transfer': {
        'description': 'Transfer empty files',
        'files': ['empty.txt'],
        'weight': 0.10
    },
    'error_handling': {
        'description': 'Handle error conditions',
        'files': ['nonexistent.txt'],
        'weight': 0.15
    },
    'file_integrity': {
        'description': 'Verify file integrity',
        'files': ['large_1mb.bin'],
        'weight': 0.15
    }
}

# Performance test configurations
PERFORMANCE_TESTS = {
    'transfer_speed': {
        'description': 'Measure transfer speeds',
        'files': ['small.txt', 'large_1mb.bin', 'large_5mb.bin'],
        'weight': 0.40
    },
    'concurrent_performance': {
        'description': 'Concurrent client performance',
        'concurrent_clients': 3,
        'files': ['tiny.txt', 'small.txt', 'medium.txt'],
        'weight': 0.35
    },
    'scalability': {
        'description': 'System scalability',
        'client_counts': [1, 3, 5],
        'files': ['tiny.txt'],
        'weight': 0.25
    }
}

# Reliability test configurations
RELIABILITY_TESTS = {
    'consistency': {
        'description': 'Transfer consistency',
        'iterations': 5,
        'file': 'small.txt',
        'weight': 0.40
    },
    'error_recovery': {
        'description': 'Error recovery capability',
        'weight': 0.30
    },
    'resource_cleanup': {
        'description': 'Resource cleanup',
        'iterations': 3,
        'file': 'tiny.txt',
        'weight': 0.30
    }
}

# Implementation comparison features
IMPLEMENTATION_FEATURES = {
    'threading': {
        'description': 'Multi-threading support',
        'keywords': ['threading', 'Thread', 'concurrent'],
        'weight': 0.20
    },
    'progress_tracking': {
        'description': 'Progress tracking',
        'keywords': ['progress', 'Progress', '%'],
        'weight': 0.15
    },
    'retry_logic': {
        'description': 'Retry logic with exponential backoff',
        'keywords': ['retry', 'backoff', 'exponential'],
        'weight': 0.20
    },
    'checksum_verification': {
        'description': 'Checksum verification',
        'keywords': ['md5', 'checksum', 'hash', 'integrity'],
        'weight': 0.15
    },
    'logging': {
        'description': 'Comprehensive logging',
        'keywords': ['logging', 'logger', 'log'],
        'weight': 0.15
    },
    'error_handling': {
        'description': 'Error handling',
        'keywords': ['except', 'try:', 'Exception', 'error'],
        'weight': 0.15
    }
}

# Evaluation ports (to avoid conflicts)
EVALUATION_PORTS = {
    'main': 18999,
    'concurrent': 18998,
    'performance': 18997,
    'reliability': 18996,
    'comparison': 18995
}

# Timeout configurations
TIMEOUTS = {
    'server_start': 2.0,      # Time to wait for server to start
    'client_connect': 10.0,   # Client connection timeout
    'transfer': 60.0,         # Maximum transfer time
    'thread_join': 30.0       # Thread join timeout
}

# Scoring thresholds
SCORE_THRESHOLDS = {
    'excellent': 90,  # 90%+ = Excellent
    'good': 80,       # 80-89% = Good
    'fair': 70,       # 70-79% = Fair
    'poor': 0         # <70% = Needs work
}

# Report configuration
REPORT_CONFIG = {
    'include_detailed_logs': True,
    'include_performance_charts': False,  # Would require matplotlib
    'include_comparison_analysis': True,
    'save_raw_data': True,
    'compress_reports': False
}

# File paths
PATHS = {
    'repository_before': '../repository_before',
    'repository_after': '../repository_after',
    'tests': '../tests',
    'reports': './reports'
}

# System requirements
SYSTEM_REQUIREMENTS = {
    'python_version': '3.6+',
    'required_modules': [
        'socket', 'threading', 'os', 'sys', 'json', 'time',
        'hashlib', 'struct', 'signal', 'logging', 'pathlib'
    ],
    'optional_modules': ['psutil'],  # For memory monitoring
    'disk_space_mb': 100,  # Minimum disk space for evaluation
    'memory_mb': 256       # Minimum memory for evaluation
}

# Export all configurations
__all__ = [
    'SCORING_WEIGHTS',
    'PERFORMANCE_BENCHMARKS', 
    'TEST_FILES',
    'REQUIREMENTS',
    'FUNCTIONALITY_TESTS',
    'PERFORMANCE_TESTS',
    'RELIABILITY_TESTS',
    'IMPLEMENTATION_FEATURES',
    'EVALUATION_PORTS',
    'TIMEOUTS',
    'SCORE_THRESHOLDS',
    'REPORT_CONFIG',
    'PATHS',
    'SYSTEM_REQUIREMENTS'
]