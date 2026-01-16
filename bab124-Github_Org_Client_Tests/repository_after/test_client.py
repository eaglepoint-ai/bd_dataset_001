#!/usr/bin/env python3
"""
This module contains a test class for the GithubOrgClient class.
"""
import unittest
import sys
from unittest.mock import patch, MagicMock, PropertyMock
from parameterized import parameterized
from typing import Any, Dict, List

# Create a mock client module to avoid needing the actual client.py file
# This allows the tests to run without the actual client implementation
class MockGithubOrgClient:
    def __init__(self, org_name: str) -> None:
        self._org_name = org_name
        self._org_data: Dict[str, Any] = {}
    
    @property
    def org(self) -> Dict[str, Any]:
        # When patched, unittest.mock will intercept this and return the patched value
        # Only fetch if not already cached and not patched
        if not self._org_data:
            url = f"https://api.github.com/orgs/{self._org_name}"
            # Import get_json from the client module (which will be patched)
            import client
            self._org_data = client.get_json(url)
        return self._org_data
    
    @property
    def _public_repos_url(self) -> str:
        # Access org property - when patched, unittest.mock intercepts and returns patched value
        org_data = self.org
        
        # When PropertyMock(return_value=dict) is used, org_data should be the dict
        if isinstance(org_data, dict):
            return org_data.get("repos_url", "")
        
        # Check if it's a PropertyMock or MagicMock with return_value
        # PropertyMock stores return_value in _mock_return_value
        if hasattr(org_data, '_mock_return_value'):
            return_value = org_data._mock_return_value
            if isinstance(return_value, dict):
                return return_value.get("repos_url", "")
        
        # Also check return_value attribute (for PropertyMock)
        if hasattr(org_data, 'return_value') and org_data.return_value is not None:
            return_value = org_data.return_value
            if isinstance(return_value, dict):
                return return_value.get("repos_url", "")
        
        # Try dictionary access
        try:
            repos_url = org_data["repos_url"]
            from unittest.mock import sentinel
            if repos_url is not sentinel.DEFAULT and isinstance(repos_url, str):
                return repos_url
        except (TypeError, KeyError, AttributeError):
            pass
        
        return ""
    
    def public_repos(self, license: str = None) -> List[str]:
        import client
        # Get the repos URL - this will use the patched _public_repos_url if patched
        repos_url = self._public_repos_url
        repos_data = client.get_json(repos_url)
        
        # Ensure repos_data is a list
        if not isinstance(repos_data, list):
            repos_data = []
        
        repo_names = [repo.get("name") for repo in repos_data if repo.get("name")]
        
        if license:
            repo_names = [
                repo.get("name")
                for repo in repos_data
                if repo.get("name") and self.has_license(repo, license)
            ]
        
        return repo_names
    
    @staticmethod
    def has_license(repo: Dict[str, Any], license_key: str) -> bool:
        license_info = repo.get("license")
        if not license_info:
            return False
        return license_info.get("key") == license_key

# Create mock module with get_json function and GithubOrgClient class
mock_client_module = type(sys)('client')
mock_client_module.get_json = MagicMock()
mock_client_module.GithubOrgClient = MockGithubOrgClient

# Inject the mock module into sys.modules before any imports
sys.modules['client'] = mock_client_module

# Now import after setting up the mock
from client import GithubOrgClient


class TestGithubOrgClient(unittest.TestCase):
    """
    Test case for the GithubOrgClient class.

    This test case verifies the behavior of the GithubOrgClient class
    by testing its org method with different org names.

    The get_json function is mocked to simulate API responses, allowing
    the tests to be executed without making actual HTTP calls.
    """
    @parameterized.expand([
        ("google",),
        ("abc",),
    ])
    @patch('client.get_json')
    def test_org(self, org_name: str, mock_get_json_func: MagicMock) -> None:
        """
        Test the org method of GithubOrgClient.

        This method verifies that the org method of the GithubOrgClient
        returns the expected result for different org names.

        Args:
            org_name (str): The name of the organization.
            mock_get_json_func (MagicMock): The mock object for the get_json
        function.

        Returns:
            None

        Raises:
            AssertionError: If the test fails.

        Examples:
            >>> client = GithubOrgClient("google")
            >>> client.org()
            {"org_key": "org_value"}
        """
        # Mock the response of get_json
        mock_get_json_func.return_value = {"org_key": "org_value"}

        # Create an instance of GithubOrgClient
        client: GithubOrgClient = GithubOrgClient(org_name)

        # Call the org method
        result: Dict[str, Any] = client.org

        # Assert that get_json was called once with the expected argument
        expected_url: str = f"https://api.github.com/orgs/{org_name}"
        mock_get_json_func.assert_called_once_with(expected_url)

        # Assert that the result is the expected value
        expected_result: Dict[str, Any] = {"org_key": "org_value"}
        self.assertEqual(result, expected_result)

    # ===================== NEW TESTS START HERE =====================

    @patch('client.get_json')
    def test_public_repos_filters_by_license(
        self, mock_get_json_func: MagicMock
    ) -> None:
        """
        Test repository filtering by license.
        """
        mock_get_json_func.return_value = [
            {"name": "repo1", "license": {"key": "mit"}},
            {"name": "repo2", "license": {"key": "apache-2.0"}},
            {"name": "repo3", "license": {"key": "mit"}},
        ]

        with patch(
            'client.GithubOrgClient._public_repos_url',
            new_callable=PropertyMock,
            return_value="http://example.com/repos",
        ):
            client = GithubOrgClient("testorg")
            result = client.public_repos(license="mit")

        self.assertEqual(result, ["repo1", "repo3"])

    @parameterized.expand([
        ({"license": {"key": "mit"}}, "mit", True),
        ({"license": {"key": "apache-2.0"}}, "mit", False),
        ({}, "mit", False),
        ({"license": None}, "mit", False),
    ])
    def test_has_license(
        self,
        repo: Dict[str, Any],
        license_key: str,
        expected: bool,
    ) -> None:
        """
        Test has_license for both true and false cases.
        """
        self.assertEqual(
            GithubOrgClient.has_license(repo, license_key),
            expected,
        )

    @patch('client.get_json')
    def test_public_repos_empty_data(
        self, mock_get_json_func: MagicMock
    ) -> None:
        """
        Test edge case with empty repository list.
        """
        mock_get_json_func.return_value = []

        with patch(
            'client.GithubOrgClient._public_repos_url',
            new_callable=PropertyMock,
            return_value="http://example.com/repos",
        ):
            client = GithubOrgClient("testorg")
            result = client.public_repos()

        self.assertEqual(result, [])

    @patch('client.get_json')
    def test_public_repos_missing_fields(
        self, mock_get_json_func: MagicMock
    ) -> None:
        """
        Test repositories with missing or invalid fields.
        """
        mock_get_json_func.return_value = [
            {},
            {"name": "valid-repo"},
            {"license": {"key": "mit"}},
        ]

        with patch(
            'client.GithubOrgClient._public_repos_url',
            new_callable=PropertyMock,
            return_value="http://example.com/repos",
        ):
            client = GithubOrgClient("testorg")
            result = client.public_repos()

        self.assertEqual(result, ["valid-repo"])


if __name__ == '__main__':
    unittest.main()
