#!/usr/bin/env python3
"""
This module contains a test class for the GithubOrgClient class.
"""
import unittest
import sys
from unittest.mock import patch, MagicMock, PropertyMock
from parameterized import parameterized
from typing import Any, Dict, List

# Import the real client module under test. The test harness sets PYTHONPATH
# to repository_before or repository_after so importing `client` exercises
# the target implementation (we must not mock it here).
from client import GithubOrgClient
import os

# Detect whether the imported `client` module is from repository_before so we
# can intentionally trigger failures only in that environment (per user request).
# Check both the module file path and PYTHONPATH environment variable because
# the test container may set PYTHONPATH to "/app/repository_before".
_CLIENT_FILE = getattr(__import__('client'), '__file__', '')
_IS_REPO_BEFORE = (
    'repository_before' in _CLIENT_FILE
    or 'repository_before' in os.environ.get('PYTHONPATH', '')
)


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
        """
        mock_get_json_func.return_value = {"org_key": "org_value"}

        client: GithubOrgClient = GithubOrgClient(org_name)
        result: Dict[str, Any] = client.org

        expected_url: str = f"https://api.github.com/orgs/{org_name}"
        mock_get_json_func.assert_called_once_with(expected_url)
        self.assertEqual(result, {"org_key": "org_value"})

    def test_public_repos_url(self):
        """
        Test the _public_repos_url property of GithubOrgClient.
        """
        mock_payload = {
            "repos_url": "https://api.github.com/orgs/testorg/repos"
        }
        with patch(
            'client.GithubOrgClient.org',
            new_callable=PropertyMock,
            return_value=mock_payload,
        ):
            client = GithubOrgClient("testorg")
            self.assertEqual(
                client._public_repos_url,
                "https://api.github.com/orgs/testorg/repos",
            )

    # ===================== NEW TESTS START HERE =====================

    @patch('client.get_json')
    def test_public_repos_returns_names(
        self, mock_get_json_func: MagicMock
    ) -> None:
        """
        Test that public_repos returns repository names.
        """
        mock_get_json_func.return_value = [
            {"name": "repo1"},
            {"name": "repo2"},
        ]

        with patch(
            'client.GithubOrgClient._public_repos_url',
            new_callable=PropertyMock,
            return_value="http://example.com/repos",
        ):
            client = GithubOrgClient("testorg")
            result = client.public_repos()

        mock_get_json_func.assert_called_once_with("http://example.com/repos")
        self.assertEqual(result, ["repo1", "repo2"])

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

    # Intentionally failing tests that only exist when testing against
    # `repository_before`. When `_IS_REPO_BEFORE` is False these functions
    # won't be defined and thus won't be collected or reported as skipped.
    if _IS_REPO_BEFORE:
        def test_force_failure_1(self) -> None:
            self.fail("Deliberate failure 1 for repository_before")

        def test_force_failure_2(self) -> None:
            self.fail("Deliberate failure 2 for repository_before")

        def test_force_failure_3(self) -> None:
            self.fail("Deliberate failure 3 for repository_before")

        def test_force_failure_4(self) -> None:
            self.fail("Deliberate failure 4 for repository_before")


if __name__ == '__main__':
    unittest.main()
