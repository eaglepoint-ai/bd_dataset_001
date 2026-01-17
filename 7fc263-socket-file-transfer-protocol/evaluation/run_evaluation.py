#!/usr/bin/env python3
"""
Evaluation Runner Script
Simple script to run different types of evaluations with command-line options.
"""

import sys
import argparse
from datetime import datetime


def run_quick_evaluation():
    """Run quick evaluation"""
    print("Running Quick Evaluation...")
    print("=" * 50)
    
    try:
        from quick_eval import QuickEvaluator
        evaluator = QuickEvaluator()
        success = evaluator.run()
        return 0 if success else 1
    except Exception as e:
        print(f"Quick evaluation failed: {e}")
        return 1


def run_comprehensive_evaluation():
    """Run comprehensive evaluation"""
    print("Running Comprehensive Evaluation...")
    print("=" * 50)
    
    try:
        from evaluation import main
        return main()
    except Exception as e:
        print(f"Comprehensive evaluation failed: {e}")
        return 1


def run_custom_evaluation(tests):
    """Run custom evaluation with specific tests"""
    print(f"Running Custom Evaluation: {', '.join(tests)}")
    print("=" * 50)
    
    try:
        from evaluation import FileTransferEvaluator
        
        evaluator = FileTransferEvaluator()
        evaluator.setup_evaluation_environment()
        
        total_score = 0
        test_count = 0
        
        if 'requirements' in tests:
            score = evaluator.evaluate_requirements_compliance()
            total_score += score
            test_count += 1
        
        if 'functionality' in tests:
            score = evaluator.evaluate_functionality()
            total_score += score
            test_count += 1
        
        if 'performance' in tests:
            score = evaluator.evaluate_performance()
            total_score += score
            test_count += 1
        
        if 'reliability' in tests:
            score = evaluator.evaluate_reliability()
            total_score += score
            test_count += 1
        
        if 'comparison' in tests:
            score = evaluator.compare_implementations()
            total_score += score
            test_count += 1
        
        if test_count > 0:
            evaluator.results['overall_score'] = total_score / test_count
            evaluator.generate_recommendations()
            evaluator.save_report()
            evaluator.print_summary()
        
        evaluator.cleanup()
        
        return 0 if test_count > 0 else 1
        
    except Exception as e:
        print(f"Custom evaluation failed: {e}")
        return 1


def main():
    """Main function with command-line argument parsing"""
    parser = argparse.ArgumentParser(
        description='File Transfer System Evaluation Runner',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python run_evaluation.py --quick
  python run_evaluation.py --comprehensive
  python run_evaluation.py --custom requirements functionality
  python run_evaluation.py --custom performance
        """
    )
    
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument(
        '--quick', '-q',
        action='store_true',
        help='Run quick evaluation (2-3 minutes)'
    )
    group.add_argument(
        '--comprehensive', '-c',
        action='store_true',
        help='Run comprehensive evaluation (10-15 minutes)'
    )
    group.add_argument(
        '--custom',
        nargs='+',
        choices=['requirements', 'functionality', 'performance', 'reliability', 'comparison'],
        help='Run custom evaluation with specific test categories'
    )
    
    parser.add_argument(
        '--verbose', '-v',
        action='store_true',
        help='Enable verbose output'
    )
    
    args = parser.parse_args()
    
    # Print header
    print("File Transfer System - Evaluation Runner")
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    # Run appropriate evaluation
    if args.quick:
        return run_quick_evaluation()
    elif args.comprehensive:
        return run_comprehensive_evaluation()
    elif args.custom:
        return run_custom_evaluation(args.custom)
    
    return 1


if __name__ == "__main__":
    sys.exit(main())