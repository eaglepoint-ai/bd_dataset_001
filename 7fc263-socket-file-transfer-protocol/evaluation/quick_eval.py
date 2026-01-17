#!/usr/bin/env python3
"""
Quick Evaluation Script
Performs a rapid evaluation of the file transfer system for basic validation.
"""

import os
import sys
import json
import time
import tempfile
import shutil
import argparse
from datetime import datetime

# Add paths for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'repository_after'))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'repository_before'))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'tests'))

from test_config import TestEnvironment


class QuickEvaluator:
    """Quick evaluator for basic validation"""
    
    def __init__(self, implementation='after'):
        self.implementation = implementation
        self.results = {
            'timestamp': datetime.now().isoformat(),
            'evaluation_type': 'quick',
            'implementation': implementation,
            'tests': {},
            'overall_status': 'unknown',
            'score': 0
        }
        self.test_env = None
    
    def setup(self):
        """Setup quick evaluation environment"""
        print(f"Setting up quick evaluation for {self.implementation} implementation...")
        
        # Use different ports for different implementations
        port = 18998 if self.implementation == 'before' else 18999
        self.test_env = TestEnvironment().setup(port=port)
        
        # Create basic test files
        self.test_env.create_test_file('test.txt', content='Hello, World!')
        self.test_env.create_test_file('binary.bin', size_bytes=1024)
        
        print(f"Quick evaluation environment ready for {self.implementation}")
    
    def get_implementation_path(self):
        """Get the path to the implementation"""
        return f'repository_{self.implementation}'
    
    def test_basic_functionality(self):
        """Test basic file transfer functionality"""
        print("Testing basic functionality...")
        
        try:
            # Import the correct implementation
            impl_path = os.path.join(os.path.dirname(__file__), '..', self.get_implementation_path())
            sys.path.insert(0, impl_path)
            
            server = self.test_env.start_server(implementation=self.implementation)
            time.sleep(2)  # Give server more time to start
            
            client = self.test_env.get_client(implementation=self.implementation)
            try:
                # Test text file transfer
                success = client.download('test.txt')
                
                if success:
                    # Verify file exists
                    downloaded_file = os.path.join(self.test_env.client_downloads_dir, 'test.txt')
                    file_exists = os.path.exists(downloaded_file)
                    
                    # Verify content
                    content_correct = False
                    if file_exists:
                        with open(downloaded_file, 'r') as f:
                            content = f.read()
                            content_correct = 'Hello, World!' in content
                    
                    self.results['tests']['basic_functionality'] = {
                        'passed': success and file_exists and content_correct,
                        'download_success': success,
                        'file_exists': file_exists,
                        'content_correct': content_correct
                    }
                else:
                    self.results['tests']['basic_functionality'] = {
                        'passed': False,
                        'download_success': False,
                        'error': 'Download failed'
                    }
                
            finally:
                self.test_env.restore_client_dirs(client)
                
        except Exception as e:
            self.results['tests']['basic_functionality'] = {
                'passed': False,
                'error': str(e)
            }
    
    def test_binary_transfer(self):
        """Test binary file transfer"""
        print("Testing binary file transfer...")
        
        try:
            client = self.test_env.get_client(implementation=self.implementation)
            try:
                success = client.download('binary.bin')
                
                if success:
                    downloaded_file = os.path.join(self.test_env.client_downloads_dir, 'binary.bin')
                    original_file = os.path.join(self.test_env.server_files_dir, 'binary.bin')
                    
                    file_exists = os.path.exists(downloaded_file)
                    size_correct = False
                    
                    if file_exists:
                        original_size = os.path.getsize(original_file)
                        downloaded_size = os.path.getsize(downloaded_file)
                        size_correct = original_size == downloaded_size
                    
                    self.results['tests']['binary_transfer'] = {
                        'passed': success and file_exists and size_correct,
                        'download_success': success,
                        'file_exists': file_exists,
                        'size_correct': size_correct
                    }
                else:
                    self.results['tests']['binary_transfer'] = {
                        'passed': False,
                        'download_success': False
                    }
                
            finally:
                self.test_env.restore_client_dirs(client)
                
        except Exception as e:
            self.results['tests']['binary_transfer'] = {
                'passed': False,
                'error': str(e)
            }
    
    def test_error_handling(self):
        """Test error handling"""
        print("Testing error handling...")
        
        try:
            client = self.test_env.get_client(implementation=self.implementation)
            try:
                # Try to download non-existent file
                success = client.download('nonexistent.txt')
                
                # Should fail gracefully
                self.results['tests']['error_handling'] = {
                    'passed': not success,  # Should return False
                    'graceful_failure': not success
                }
                
            finally:
                self.test_env.restore_client_dirs(client)
                
        except Exception as e:
            # If exception is thrown, it's not graceful failure
            self.results['tests']['error_handling'] = {
                'passed': False,
                'error': str(e),
                'graceful_failure': False
            }
    
    def test_logging(self):
        """Test logging functionality"""
        print("Testing logging...")
        
        try:
            # Check if log files are created
            log_files = list(self.test_env.logs_dir.glob('*.log')) if hasattr(self.test_env.logs_dir, 'glob') else []
            
            # Alternative check using os.listdir
            if not log_files:
                try:
                    all_files = os.listdir(self.test_env.logs_dir)
                    log_files = [f for f in all_files if f.endswith('.log')]
                except:
                    log_files = []
            
            has_logs = len(log_files) > 0
            
            self.results['tests']['logging'] = {
                'passed': has_logs,
                'log_files_found': len(log_files),
                'log_files': log_files
            }
            
        except Exception as e:
            self.results['tests']['logging'] = {
                'passed': False,
                'error': str(e)
            }
    
    def calculate_score(self):
        """Calculate overall score"""
        total_tests = len(self.results['tests'])
        if total_tests == 0:
            self.results['score'] = 0
            return
        
        passed_tests = sum(1 for test in self.results['tests'].values() if test.get('passed', False))
        self.results['score'] = (passed_tests / total_tests) * 100
        
        # Determine overall status
        if self.results['score'] >= 90:
            self.results['overall_status'] = 'excellent'
        elif self.results['score'] >= 75:
            self.results['overall_status'] = 'good'
        elif self.results['score'] >= 50:
            self.results['overall_status'] = 'fair'
        else:
            self.results['overall_status'] = 'poor'
    
    def print_results(self):
        """Print evaluation results"""
        print("\n" + "="*60)
        print(f"QUICK EVALUATION RESULTS - {self.implementation.upper()} IMPLEMENTATION")
        print("="*60)
        
        for test_name, result in self.results['tests'].items():
            status = "✅ PASS" if result.get('passed', False) else "❌ FAIL"
            print(f"{test_name}: {status}")
            
            if not result.get('passed', False) and 'error' in result:
                print(f"  Error: {result['error']}")
        
        print(f"\nOverall Score: {self.results['score']:.1f}%")
        print(f"Status: {self.results['overall_status'].upper()}")
        
        if self.results['overall_status'] == 'excellent':
            print("🎉 System is working excellently!")
        elif self.results['overall_status'] == 'good':
            print("✅ System is working well with minor issues")
        elif self.results['overall_status'] == 'fair':
            print("⚠️  System has some issues that need attention")
        else:
            print("❌ System has significant issues that need to be fixed")
        
        print("="*60)
    
    def save_results(self):
        """Save results to file"""
        timestamp = datetime.now().strftime('%Y-%m-%d_%H-%M-%S')
        report_dir = os.path.join(os.path.dirname(__file__), 'reports', timestamp[:10], timestamp[11:])
        os.makedirs(report_dir, exist_ok=True)
        
        report_file = os.path.join(report_dir, 'report.json')
        
        with open(report_file, 'w') as f:
            json.dump(self.results, f, indent=2, default=str)
        
        print(f"\nQuick evaluation report saved to: {report_file}")
        return report_file
    
    def cleanup(self):
        """Clean up evaluation environment"""
        if self.test_env:
            self.test_env.cleanup()
    
    def run(self):
        """Run quick evaluation"""
        try:
            self.setup()
            
            self.test_basic_functionality()
            self.test_binary_transfer()
            self.test_error_handling()
            self.test_logging()
            
            self.calculate_score()
            self.print_results()
            self.save_results()
            
            return self.results['score'] >= 75  # Return True if score is good
            
        except Exception as e:
            print(f"Quick evaluation failed: {e}")
            return False
        
        finally:
            self.cleanup()


def main():
    """Main function"""
    parser = argparse.ArgumentParser(description='Quick File Transfer System Evaluation')
    parser.add_argument('--implementation', choices=['before', 'after'], default='after',
                       help='Implementation to test (before or after)')
    
    args = parser.parse_args()
    
    print(f"File Transfer System - Quick Evaluation ({args.implementation.upper()} Implementation)")
    print("=" * 80)
    print("Performing rapid validation of core functionality...")
    
    evaluator = QuickEvaluator(implementation=args.implementation)
    success = evaluator.run()
    
    if success:
        print(f"\n✅ Quick evaluation passed! {args.implementation.upper()} implementation is working correctly.")
        if args.implementation == 'before':
            print("This is the basic implementation. For full features, test the 'after' implementation.")
        else:
            print("For comprehensive evaluation, run: docker-compose up test-report")
        return 0
    else:
        print(f"\n❌ Quick evaluation failed! {args.implementation.upper()} implementation has issues.")
        print("Check the detailed report for more information.")
        return 1


if __name__ == "__main__":
    sys.exit(main())