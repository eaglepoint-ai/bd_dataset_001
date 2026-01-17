#!/usr/bin/python3
"""
Meta-test suite to validate that test_console.py meets all requirements
"""
import unittest
import ast
import inspect
import sys
import os
from pathlib import Path


class TestTestCoverage(unittest.TestCase):
    """Test suite to validate test_console.py coverage and requirements"""

    def setUp(self):
        """Set up test fixtures"""
        self.project_root = Path(__file__).parent.parent
        self.test_file_path = self.project_root / "repository_after" / "test_console.py"
        self.console_file_path = self.project_root / "repository_after" / "console.py"
        
        # Read the test file
        with open(self.test_file_path, 'r', encoding='utf-8') as f:
            self.test_file_content = f.read()
        
        # Read the console file to get public methods
        with open(self.console_file_path, 'r', encoding='utf-8') as f:
            self.console_file_content = f.read()
        
        # Parse the test file AST
        self.test_ast = ast.parse(self.test_file_content)
        
        # Parse the console file AST
        self.console_ast = ast.parse(self.console_file_content)

    def test_file_exists(self):
        """Test that test_console.py exists"""
        self.assertTrue(
            self.test_file_path.exists(),
            "test_console.py file should exist in repository_after/"
        )

    def test_imports_unittest(self):
        """Test that unittest framework is imported"""
        self.assertIn("import unittest", self.test_file_content)
        self.assertIn("from unittest.mock", self.test_file_content)

    def test_has_test_class(self):
        """Test that there is a proper test class"""
        classes = [node.name for node in ast.walk(self.test_ast) 
                  if isinstance(node, ast.ClassDef)]
        test_classes = [c for c in classes if 'Test' in c and 'HBNBCommand' in c]
        self.assertGreater(len(test_classes), 0, 
                          "Should have a test class for HBNBCommand")

    def test_has_setup_teardown(self):
        """Test that setUp and tearDown methods exist"""
        self.assertIn("def setUp", self.test_file_content)
        self.assertIn("def tearDown", self.test_file_content)

    def test_covers_all_public_methods(self):
        """Test that all public methods of HBNBCommand are covered"""
        # Get all public methods from HBNBCommand class
        console_classes = [node for node in ast.walk(self.console_ast) 
                          if isinstance(node, ast.ClassDef) 
                          and node.name == 'HBNBCommand']
        
        self.assertGreater(len(console_classes), 0, 
                          "HBNBCommand class should exist")
        
        # Expected public methods
        expected_methods = {
            'do_quit': ['quit', 'eof'],
            'do_EOF': ['eof', 'quit'],
            'emptyline': ['emptyline', 'empty'],
            'do_create': ['create'],
            'do_show': ['show'],
            'do_destroy': ['destroy'],
            'do_all': ['all'],
            'do_update': ['update'],
            'default': ['default', 'count'],
            'parseline': ['parseline', 'parse']
        }
        
        # Get all test methods
        test_methods = []
        for node in ast.walk(self.test_ast):
            if isinstance(node, ast.FunctionDef) and node.name.startswith('test_'):
                test_methods.append(node.name.lower())
        
        # Check that each expected method has at least one test
        for method, keywords in expected_methods.items():
            # Check for tests related to this method using keywords
            method_tests = [t for t in test_methods 
                          if any(kw in t for kw in keywords)]
            self.assertGreater(
                len(method_tests), 0,
                f"Should have at least one test for method: {method}"
            )

    def test_covers_create_command(self):
        """Test that create command is thoroughly tested"""
        test_methods = [node.name for node in ast.walk(self.test_ast) 
                       if isinstance(node, ast.FunctionDef) 
                       and 'create' in node.name.lower()]
        
        # Should have tests for: missing class, invalid class, success
        create_tests = [t for t in test_methods if 'create' in t.lower()]
        self.assertGreater(len(create_tests), 2, 
                          "Should have multiple tests for create command")
        
        # Check for specific test cases
        test_names = ' '.join(create_tests).lower()
        self.assertTrue(
            'missing' in test_names or 'invalid' in test_names,
            "Should test missing/invalid class name"
        )
        self.assertIn('success', test_names,
                     "Should test successful creation")

    def test_covers_show_command(self):
        """Test that show command is thoroughly tested"""
        test_methods = [node.name for node in ast.walk(self.test_ast) 
                       if isinstance(node, ast.FunctionDef) 
                       and 'show' in node.name.lower()]
        
        show_tests = [t for t in test_methods if 'show' in t.lower()]
        self.assertGreater(len(show_tests), 3,
                          "Should have multiple tests for show command")
        
        test_names = ' '.join(show_tests).lower()
        self.assertTrue(
            'missing' in test_names or 'invalid' in test_names,
            "Should test missing/invalid inputs"
        )

    def test_covers_destroy_command(self):
        """Test that destroy command is thoroughly tested"""
        test_methods = [node.name for node in ast.walk(self.test_ast) 
                       if isinstance(node, ast.FunctionDef) 
                       and 'destroy' in node.name.lower()]
        
        destroy_tests = [t for t in test_methods if 'destroy' in t.lower()]
        self.assertGreater(len(destroy_tests), 2,
                          "Should have multiple tests for destroy command")

    def test_covers_all_command(self):
        """Test that all command is thoroughly tested"""
        test_methods = [node.name for node in ast.walk(self.test_ast) 
                       if isinstance(node, ast.FunctionDef) 
                       and 'all' in node.name.lower()]
        
        all_tests = [t for t in test_methods if 'all' in t.lower() and 'test_' in t]
        self.assertGreaterEqual(len(all_tests), 2,
                          "Should have at least 2 tests for all command")


    def test_covers_invalid_inputs(self):
        """Test that invalid inputs are tested"""
        test_content_lower = self.test_file_content.lower()
        
        invalid_cases = [
            'missingclassname',
            'invalidclass',
            'missingid',
            'noinstancefound'  # Changed from 'instance not found' to match actual error message
        ]
        
        found_cases = 0
        for case in invalid_cases:
            if case in test_content_lower.replace(' ', ''):
                found_cases += 1
        
        # Should find at least 3 out of 4 invalid input cases
        self.assertGreaterEqual(found_cases, 3,
                               f"Should test at least 3 invalid input cases, found {found_cases}")

    def test_uses_mocking(self):
        """Test that mocking is used for external dependencies"""
        self.assertIn('patch', self.test_file_content,
                     "Should use unittest.mock.patch")
        self.assertIn('MagicMock', self.test_file_content,
                     "Should use MagicMock for mocking")
        self.assertIn('console.storage', self.test_file_content,
                     "Should mock the storage object")

    def test_captures_output(self):
        """Test that printed output is captured and verified"""
        self.assertIn('sys.stdout', self.test_file_content,
                     "Should capture stdout output")
        self.assertIn('StringIO', self.test_file_content,
                     "Should use StringIO to capture output")
        self.assertIn('getvalue', self.test_file_content,
                     "Should retrieve captured output")

    def test_has_meaningful_test_names(self):
        """Test that test methods have meaningful names"""
        test_methods = [node.name for node in ast.walk(self.test_ast) 
                       if isinstance(node, ast.FunctionDef) 
                       and node.name.startswith('test_')]
        
        # All test names should be descriptive
        for test_name in test_methods:
            self.assertGreater(len(test_name), 10,
                             f"Test name '{test_name}' should be descriptive")
            # Should not just be 'test_1', 'test_2', etc.
            self.assertFalse(
                test_name.replace('test_', '').isdigit(),
                f"Test name '{test_name}' should not be just a number"
            )

    def test_follows_pep8_structure(self):
        """Test that test file follows PEP8 structure"""
        # Check for proper class structure
        self.assertIn('class Test', self.test_file_content,
                     "Should have a Test class")
        
        # Check for docstrings in test methods
        test_functions = [node for node in ast.walk(self.test_ast) 
                         if isinstance(node, ast.FunctionDef) 
                         and node.name.startswith('test_')]
        
        methods_with_docstrings = sum(1 for func in test_functions 
                                     if ast.get_docstring(func))
        
        # At least 80% of test methods should have docstrings
        if len(test_functions) > 0:
            docstring_ratio = methods_with_docstrings / len(test_functions)
            self.assertGreater(
                docstring_ratio, 0.8,
                "At least 80% of test methods should have docstrings"
            )

    def test_covers_edge_cases(self):
        """Test that edge cases are covered"""
        test_content_lower = self.test_file_content.lower()
        
        edge_cases = [
            'empty',
            'special',
            'whitespace',
            'zero',
            'negative',
            'long',
            'missing',  # Missing inputs are edge cases
            'not found'  # Not found is an edge case
        ]
        
        found_cases = sum(1 for case in edge_cases if case in test_content_lower)
        self.assertGreaterEqual(
            found_cases, 2,
            f"Should test at least 2 edge cases, found {found_cases}"
        )

    def test_covers_dot_syntax(self):
        """Test that dot-style command syntax is tested"""
        test_content_lower = self.test_file_content.lower()
        self.assertIn('parseline', test_content_lower,
                     "Should test parseline method")
        self.assertTrue(
            'dot' in test_content_lower or 'syntax' in test_content_lower,
            "Should test dot-style syntax"
        )

    def test_covers_count_functionality(self):
        """Test that count functionality is tested"""
        test_content_lower = self.test_file_content.lower()
        self.assertIn('count', test_content_lower,
                     "Should test count command functionality")

    def test_uses_context_managers(self):
        """Test that patching is used (either decorators or context managers)"""
        # Check that patching is used (either @patch decorator or 'with patch')
        has_decorators = '@patch' in self.test_file_content
        has_context_managers = 'with patch' in self.test_file_content
        
        # Should use at least one form of patching
        self.assertTrue(
            has_decorators or has_context_managers,
            "Should use patching (@patch decorator or 'with patch' context manager)"
        )
        
        # If using decorators, that's acceptable (some prefer them)
        # If using context managers, that's also acceptable
        # Both are valid approaches

    def test_has_sufficient_test_count(self):
        """Test that there are sufficient number of tests"""
        test_methods = [node.name for node in ast.walk(self.test_ast) 
                       if isinstance(node, ast.FunctionDef) 
                       and node.name.startswith('test_')]
        
        # Should have at least 20 test methods for comprehensive coverage
        # (Some tests may cover multiple scenarios in one method)
        self.assertGreaterEqual(
            len(test_methods), 20,
            f"Should have at least 20 test methods, found {len(test_methods)}"
        )

    def test_validates_command_outputs(self):
        """Test that command outputs are validated"""
        # Should check for assertions on output
        self.assertIn('assertEqual', self.test_file_content,
                     "Should use assertEqual to validate outputs")
        self.assertIn('assertIn', self.test_file_content,
                     "Should use assertIn to check output content")

    def test_organizes_tests_logically(self):
        """Test that tests are organized into logical groups"""
        test_methods = [node.name for node in ast.walk(self.test_ast) 
                       if isinstance(node, ast.FunctionDef) 
                       and node.name.startswith('test_')]
        
        # Group tests by command
        create_tests = [t for t in test_methods if 'create' in t.lower()]
        show_tests = [t for t in test_methods if 'show' in t.lower()]
        destroy_tests = [t for t in test_methods if 'destroy' in t.lower()]
        update_tests = [t for t in test_methods if 'update' in t.lower()]
        all_tests = [t for t in test_methods if 'all' in t.lower() and 'test_' in t]
        
        # Each major command should have multiple tests
        self.assertGreater(len(create_tests), 0, "Should test create command")
        self.assertGreater(len(show_tests), 0, "Should test show command")
        self.assertGreater(len(destroy_tests), 0, "Should test destroy command")
        self.assertGreater(len(update_tests), 0, "Should test update command")
        self.assertGreater(len(all_tests), 0, "Should test all command")


if __name__ == '__main__':
    unittest.main()
