#!/usr/bin/env python3
"""
Evaluation Utilities
Helper functions and utilities for the file transfer system evaluation.
"""

import os
import sys
import json
import time
import hashlib
import statistics
import platform
from datetime import datetime
from pathlib import Path


class EvaluationLogger:
    """Logger for evaluation process"""
    
    def __init__(self, log_file=None, verbose=True):
        self.verbose = verbose
        self.log_file = log_file
        self.start_time = time.time()
        
        if self.log_file:
            # Ensure log directory exists
            os.makedirs(os.path.dirname(self.log_file), exist_ok=True)
    
    def log(self, message, level='INFO'):
        """Log a message"""
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        elapsed = time.time() - self.start_time
        log_entry = f"[{timestamp}] [{level}] [{elapsed:.2f}s] {message}"
        
        if self.verbose:
            print(log_entry)
        
        if self.log_file:
            with open(self.log_file, 'a') as f:
                f.write(log_entry + '\n')
    
    def info(self, message):
        """Log info message"""
        self.log(message, 'INFO')
    
    def warning(self, message):
        """Log warning message"""
        self.log(message, 'WARNING')
    
    def error(self, message):
        """Log error message"""
        self.log(message, 'ERROR')
    
    def success(self, message):
        """Log success message"""
        self.log(message, 'SUCCESS')


class SystemInfo:
    """System information collector"""
    
    @staticmethod
    def get_system_info():
        """Get comprehensive system information"""
        info = {
            'platform': platform.platform(),
            'system': platform.system(),
            'release': platform.release(),
            'version': platform.version(),
            'machine': platform.machine(),
            'processor': platform.processor(),
            'python_version': platform.python_version(),
            'python_implementation': platform.python_implementation(),
            'architecture': platform.architecture(),
            'hostname': platform.node(),
            'timestamp': datetime.now().isoformat()
        }
        
        # Add memory info if available
        try:
            import psutil
            memory = psutil.virtual_memory()
            info['memory'] = {
                'total_gb': round(memory.total / (1024**3), 2),
                'available_gb': round(memory.available / (1024**3), 2),
                'percent_used': memory.percent
            }
            
            # Add CPU info
            info['cpu'] = {
                'count': psutil.cpu_count(),
                'count_logical': psutil.cpu_count(logical=True),
                'frequency_mhz': psutil.cpu_freq().current if psutil.cpu_freq() else None
            }
            
        except ImportError:
            info['memory'] = 'psutil not available'
            info['cpu'] = 'psutil not available'
        
        return info
    
    @staticmethod
    def check_requirements():
        """Check if system meets evaluation requirements"""
        issues = []
        
        # Check Python version
        python_version = tuple(map(int, platform.python_version().split('.')))
        if python_version < (3, 6):
            issues.append(f"Python 3.6+ required, found {platform.python_version()}")
        
        # Check required modules
        required_modules = [
            'socket', 'threading', 'os', 'sys', 'json', 'time',
            'hashlib', 'struct', 'signal', 'logging', 'pathlib'
        ]
        
        for module in required_modules:
            try:
                __import__(module)
            except ImportError:
                issues.append(f"Required module not available: {module}")
        
        # Check disk space (simplified check)
        try:
            import shutil
            free_space = shutil.disk_usage('.').free
            if free_space < 100 * 1024 * 1024:  # 100MB
                issues.append("Insufficient disk space (need at least 100MB)")
        except:
            issues.append("Could not check disk space")
        
        return issues


class FileUtils:
    """File utility functions"""
    
    @staticmethod
    def calculate_checksum(filepath, algorithm='md5'):
        """Calculate file checksum"""
        if algorithm == 'md5':
            hash_obj = hashlib.md5()
        elif algorithm == 'sha256':
            hash_obj = hashlib.sha256()
        else:
            raise ValueError(f"Unsupported algorithm: {algorithm}")
        
        try:
            with open(filepath, 'rb') as f:
                for chunk in iter(lambda: f.read(4096), b''):
                    hash_obj.update(chunk)
            return hash_obj.hexdigest()
        except Exception as e:
            raise Exception(f"Error calculating checksum: {e}")
    
    @staticmethod
    def compare_files(file1, file2):
        """Compare two files for equality"""
        if not os.path.exists(file1):
            return False, f"File1 does not exist: {file1}"
        
        if not os.path.exists(file2):
            return False, f"File2 does not exist: {file2}"
        
        # Compare sizes first
        size1 = os.path.getsize(file1)
        size2 = os.path.getsize(file2)
        
        if size1 != size2:
            return False, f"Size mismatch: {size1} vs {size2}"
        
        # Compare checksums
        try:
            checksum1 = FileUtils.calculate_checksum(file1)
            checksum2 = FileUtils.calculate_checksum(file2)
            
            if checksum1 != checksum2:
                return False, f"Checksum mismatch: {checksum1} vs {checksum2}"
            
            return True, "Files are identical"
            
        except Exception as e:
            return False, f"Error comparing files: {e}"
    
    @staticmethod
    def create_test_file(filepath, size_bytes=None, content=None):
        """Create a test file with specified size or content"""
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        
        if content is not None:
            # Create file with specific content
            if isinstance(content, str):
                with open(filepath, 'w') as f:
                    f.write(content)
            else:
                with open(filepath, 'wb') as f:
                    f.write(content)
        elif size_bytes is not None:
            # Create file with specific size (random data)
            with open(filepath, 'wb') as f:
                remaining = size_bytes
                chunk_size = 8192
                
                while remaining > 0:
                    chunk_size_to_write = min(chunk_size, remaining)
                    f.write(os.urandom(chunk_size_to_write))
                    remaining -= chunk_size_to_write
        else:
            # Create empty file
            Path(filepath).touch()
        
        return filepath
    
    @staticmethod
    def get_file_info(filepath):
        """Get comprehensive file information"""
        if not os.path.exists(filepath):
            return None
        
        stat = os.stat(filepath)
        
        return {
            'path': filepath,
            'size': stat.st_size,
            'size_mb': round(stat.st_size / (1024*1024), 3),
            'created': datetime.fromtimestamp(stat.st_ctime).isoformat(),
            'modified': datetime.fromtimestamp(stat.st_mtime).isoformat(),
            'checksum': FileUtils.calculate_checksum(filepath),
            'is_binary': FileUtils.is_binary_file(filepath)
        }
    
    @staticmethod
    def is_binary_file(filepath):
        """Check if file is binary"""
        try:
            with open(filepath, 'rb') as f:
                chunk = f.read(1024)
                return b'\0' in chunk
        except:
            return False


class StatisticsUtils:
    """Statistics utility functions"""
    
    @staticmethod
    def calculate_stats(values):
        """Calculate comprehensive statistics for a list of values"""
        if not values:
            return None
        
        values = [v for v in values if v is not None]
        if not values:
            return None
        
        stats = {
            'count': len(values),
            'min': min(values),
            'max': max(values),
            'mean': statistics.mean(values),
            'median': statistics.median(values)
        }
        
        if len(values) > 1:
            stats['stdev'] = statistics.stdev(values)
            stats['variance'] = statistics.variance(values)
            stats['coefficient_of_variation'] = stats['stdev'] / stats['mean'] if stats['mean'] != 0 else 0
        else:
            stats['stdev'] = 0
            stats['variance'] = 0
            stats['coefficient_of_variation'] = 0
        
        return stats
    
    @staticmethod
    def is_consistent(values, threshold=0.5):
        """Check if values are consistent (low coefficient of variation)"""
        stats = StatisticsUtils.calculate_stats(values)
        if not stats:
            return False
        
        return stats['coefficient_of_variation'] < threshold
    
    @staticmethod
    def calculate_percentiles(values, percentiles=[25, 50, 75, 90, 95]):
        """Calculate percentiles for values"""
        if not values:
            return {}
        
        import statistics
        result = {}
        
        for p in percentiles:
            try:
                result[f'p{p}'] = statistics.quantiles(values, n=100)[p-1]
            except:
                result[f'p{p}'] = None
        
        return result


class PerformanceMonitor:
    """Performance monitoring utilities"""
    
    def __init__(self):
        self.start_time = None
        self.end_time = None
        self.checkpoints = []
    
    def start(self):
        """Start performance monitoring"""
        self.start_time = time.time()
        self.checkpoints = []
        return self.start_time
    
    def checkpoint(self, name):
        """Add a checkpoint"""
        if self.start_time is None:
            self.start()
        
        current_time = time.time()
        elapsed = current_time - self.start_time
        
        self.checkpoints.append({
            'name': name,
            'timestamp': current_time,
            'elapsed': elapsed
        })
        
        return elapsed
    
    def stop(self):
        """Stop performance monitoring"""
        self.end_time = time.time()
        return self.get_total_time()
    
    def get_total_time(self):
        """Get total elapsed time"""
        if self.start_time is None:
            return 0
        
        end = self.end_time or time.time()
        return end - self.start_time
    
    def get_checkpoint_times(self):
        """Get times between checkpoints"""
        if len(self.checkpoints) < 2:
            return []
        
        times = []
        for i in range(1, len(self.checkpoints)):
            prev_time = self.checkpoints[i-1]['elapsed']
            curr_time = self.checkpoints[i]['elapsed']
            times.append({
                'from': self.checkpoints[i-1]['name'],
                'to': self.checkpoints[i]['name'],
                'duration': curr_time - prev_time
            })
        
        return times
    
    def get_summary(self):
        """Get performance summary"""
        return {
            'total_time': self.get_total_time(),
            'checkpoints': self.checkpoints,
            'checkpoint_times': self.get_checkpoint_times(),
            'start_time': self.start_time,
            'end_time': self.end_time
        }


class ReportGenerator:
    """Report generation utilities"""
    
    @staticmethod
    def generate_html_report(results, output_file):
        """Generate HTML report (basic implementation)"""
        html_template = """
        <!DOCTYPE html>
        <html>
        <head>
            <title>File Transfer System Evaluation Report</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 40px; }
                .header { background: #f0f0f0; padding: 20px; border-radius: 5px; }
                .section { margin: 20px 0; }
                .score { font-size: 24px; font-weight: bold; }
                .pass { color: green; }
                .fail { color: red; }
                table { border-collapse: collapse; width: 100%; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>File Transfer System Evaluation Report</h1>
                <p>Generated: {timestamp}</p>
                <p class="score">Overall Score: {score:.1f}%</p>
            </div>
            
            <div class="section">
                <h2>System Information</h2>
                <p>Platform: {platform}</p>
                <p>Python Version: {python_version}</p>
            </div>
            
            <div class="section">
                <h2>Requirements Compliance</h2>
                <table>
                    <tr><th>Requirement</th><th>Status</th><th>Details</th></tr>
                    {requirements_rows}
                </table>
            </div>
            
            <div class="section">
                <h2>Recommendations</h2>
                <ul>
                    {recommendations}
                </ul>
            </div>
        </body>
        </html>
        """
        
        # Generate requirements rows
        requirements_rows = ""
        if 'requirements_compliance' in results:
            for req, result in results['requirements_compliance'].items():
                status = "PASS" if result['passed'] else "FAIL"
                status_class = "pass" if result['passed'] else "fail"
                details = str(result.get('details', ''))
                requirements_rows += f'<tr><td>{req}</td><td class="{status_class}">{status}</td><td>{details}</td></tr>'
        
        # Generate recommendations
        recommendations = ""
        if 'recommendations' in results:
            for rec in results['recommendations']:
                recommendations += f"<li>{rec}</li>"
        
        # Fill template
        html_content = html_template.format(
            timestamp=results.get('timestamp', 'Unknown'),
            score=results.get('overall_score', 0),
            platform=results.get('system_info', {}).get('platform', 'Unknown'),
            python_version=results.get('system_info', {}).get('python_version', 'Unknown'),
            requirements_rows=requirements_rows,
            recommendations=recommendations
        )
        
        with open(output_file, 'w') as f:
            f.write(html_content)
        
        return output_file
    
    @staticmethod
    def generate_csv_summary(results, output_file):
        """Generate CSV summary of results"""
        import csv
        
        with open(output_file, 'w', newline='') as f:
            writer = csv.writer(f)
            
            # Header
            writer.writerow(['Category', 'Test', 'Status', 'Score', 'Details'])
            
            # Requirements compliance
            if 'requirements_compliance' in results:
                for req, result in results['requirements_compliance'].items():
                    writer.writerow([
                        'Requirements',
                        req,
                        'PASS' if result['passed'] else 'FAIL',
                        100 if result['passed'] else 0,
                        str(result.get('details', ''))
                    ])
            
            # Functionality tests
            if 'functionality_tests' in results:
                for test, result in results['functionality_tests'].items():
                    writer.writerow([
                        'Functionality',
                        test,
                        'PASS' if result['passed'] else 'FAIL',
                        100 if result['passed'] else 0,
                        str(result.get('details', ''))
                    ])
            
            # Overall score
            writer.writerow([
                'Overall',
                'Total Score',
                'N/A',
                results.get('overall_score', 0),
                f"Generated at {results.get('timestamp', 'Unknown')}"
            ])
        
        return output_file


class ValidationUtils:
    """Validation utility functions"""
    
    @staticmethod
    def validate_port(port):
        """Validate port number"""
        try:
            port = int(port)
            return 1 <= port <= 65535
        except:
            return False
    
    @staticmethod
    def validate_file_path(filepath):
        """Validate file path"""
        try:
            # Check if path is valid and not trying to escape
            normalized = os.path.normpath(filepath)
            return not normalized.startswith('..') and not os.path.isabs(normalized)
        except:
            return False
    
    @staticmethod
    def validate_test_results(results):
        """Validate test results structure"""
        required_fields = ['timestamp', 'overall_score']
        
        for field in required_fields:
            if field not in results:
                return False, f"Missing required field: {field}"
        
        # Validate score range
        score = results.get('overall_score', 0)
        if not isinstance(score, (int, float)) or not 0 <= score <= 100:
            return False, f"Invalid overall_score: {score}"
        
        return True, "Valid"


# Export utility classes and functions
__all__ = [
    'EvaluationLogger',
    'SystemInfo',
    'FileUtils',
    'StatisticsUtils',
    'PerformanceMonitor',
    'ReportGenerator',
    'ValidationUtils'
]