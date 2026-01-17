"""
File Transfer System Evaluation Framework

This package provides comprehensive evaluation capabilities for the file transfer system,
including requirements compliance, functionality testing, performance analysis, and
reliability assessment.

Main Components:
- evaluation.py: Comprehensive evaluation framework
- quick_eval.py: Quick validation script
- config.py: Evaluation configuration and settings
- utils.py: Utility functions and helper classes

Usage:
    # Quick evaluation
    python evaluation/quick_eval.py
    
    # Comprehensive evaluation
    python evaluation/evaluation.py
    
    # Programmatic usage
    from evaluation.evaluation import FileTransferEvaluator
    evaluator = FileTransferEvaluator()
    evaluator.setup_evaluation_environment()
    score = evaluator.evaluate_requirements_compliance()
"""

from .evaluation import FileTransferEvaluator
from .utils import (
    EvaluationLogger,
    SystemInfo,
    FileUtils,
    StatisticsUtils,
    PerformanceMonitor,
    ReportGenerator,
    ValidationUtils
)
from .config import (
    SCORING_WEIGHTS,
    PERFORMANCE_BENCHMARKS,
    TEST_FILES,
    REQUIREMENTS,
    EVALUATION_PORTS,
    SCORE_THRESHOLDS
)

__version__ = '1.0.0'
__author__ = 'File Transfer System Evaluation Team'

__all__ = [
    'FileTransferEvaluator',
    'EvaluationLogger',
    'SystemInfo',
    'FileUtils',
    'StatisticsUtils',
    'PerformanceMonitor',
    'ReportGenerator',
    'ValidationUtils',
    'SCORING_WEIGHTS',
    'PERFORMANCE_BENCHMARKS',
    'TEST_FILES',
    'REQUIREMENTS',
    'EVALUATION_PORTS',
    'SCORE_THRESHOLDS'
]