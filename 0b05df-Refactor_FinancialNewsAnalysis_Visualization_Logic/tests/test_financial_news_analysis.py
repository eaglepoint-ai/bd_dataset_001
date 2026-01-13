#!/usr/bin/python3
"""
Unified test file for FinancialNewsAnalysis refactoring.

This test file uses PYTHONPATH to import from either repository_before or repository_after.
Run with:
    PYTHONPATH=/app/repository_before pytest tests/test_financial_news_analysis.py
    PYTHONPATH=/app/repository_after pytest tests/test_financial_news_analysis.py

Note: Structural tests will FAIL for repository_before (expected) and PASS for repository_after.
"""
import os
import sys
import csv
import inspect
from pathlib import Path

# Import the module to test
from financial_news_analysis import FinancialNewsAnalysis
import financial_news_analysis as fna_module


# =============================================================================
# Test Fixtures
# =============================================================================

def create_test_csv():
    """Create a test CSV file with sample data."""
    test_dir = Path(__file__).parent
    csv_path = test_dir / 'test_data.csv'
    
    rows = [
        ['headline', 'publisher', 'date'],
        ['Stock Market Hits Record High', 'Reuters', '2024-01-15'],
        ['Fed Raises Interest Rates', 'Bloomberg', '2024-01-16'],
        ['Tech Giants Report Earnings', 'CNBC', '2024-01-17'],
        ['Oil Prices Surge', 'Reuters', '2024-01-18'],
        ['Crypto Market Volatility', 'Bloomberg', '2024-01-19'],
    ]
    
    with open(csv_path, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerows(rows)
    
    return str(csv_path)


def cleanup_test_csv():
    """Remove test CSV file."""
    csv_path = Path(__file__).parent / 'test_data.csv'
    if csv_path.exists():
        os.unlink(csv_path)


# =============================================================================
# PASS_TO_PASS: Behavioral tests that pass on both versions
# =============================================================================

def test_public_api_exists():
    """Verify public API methods exist and are callable."""
    csv_path = create_test_csv()
    try:
        analysis = FinancialNewsAnalysis(csv_path)
        
        assert hasattr(analysis, 'descriptive_statistics'), "Missing descriptive_statistics"
        assert callable(analysis.descriptive_statistics), "descriptive_statistics not callable"
        assert hasattr(analysis, 'visualize_stat_measures'), "Missing visualize_stat_measures"
        assert callable(analysis.visualize_stat_measures), "visualize_stat_measures not callable"
    finally:
        cleanup_test_csv()


def test_descriptive_statistics_returns_tuple():
    """Verify descriptive_statistics returns a 3-element tuple."""
    csv_path = create_test_csv()
    try:
        analysis = FinancialNewsAnalysis(csv_path)
        result = analysis.descriptive_statistics()
        
        assert isinstance(result, tuple), "Must return tuple"
        assert len(result) == 3, "Must return 3 elements (headline_stats, publisher_counts, date_counts)"
    finally:
        cleanup_test_csv()


def test_data_loaded_correctly():
    """Verify CSV data is loaded into self.data."""
    csv_path = create_test_csv()
    try:
        analysis = FinancialNewsAnalysis(csv_path)
        
        assert hasattr(analysis, 'data'), "Missing data attribute"
        assert len(analysis.data) == 5, f"Expected 5 rows, got {len(analysis.data)}"
        assert 'headline' in analysis.data.columns, "Missing headline column"
        assert 'publisher' in analysis.data.columns, "Missing publisher column"
        assert 'date' in analysis.data.columns, "Missing date column"
    finally:
        cleanup_test_csv()


def test_headline_length_calculated():
    """Verify headline_length column is added after descriptive_statistics."""
    csv_path = create_test_csv()
    try:
        analysis = FinancialNewsAnalysis(csv_path)
        analysis.descriptive_statistics()
        
        assert 'headline_length' in analysis.data.columns, "Missing headline_length column"
        
        # Verify first headline length is correct
        first_headline = 'Stock Market Hits Record High'
        expected_length = len(first_headline)
        actual_length = analysis.data['headline_length'].iloc[0]
        assert actual_length == expected_length, f"Expected {expected_length}, got {actual_length}"
    finally:
        cleanup_test_csv()


# =============================================================================
# FAIL_TO_PASS: Structural tests that fail on before, pass on after
# =============================================================================

def test_helper_methods_exist():
    """
    Structural requirement: Refactored code must have private helper methods.
    
    This test will FAIL for repository_before (no helper methods)
    and PASS for repository_after (has _create_figure, _configure_axis, etc).
    """
    csv_path = create_test_csv()
    try:
        analysis = FinancialNewsAnalysis(csv_path)
        
        required_helpers = [
            '_create_figure',
            '_configure_axis',
            '_show_plot',
            '_plot_histogram',
            '_plot_bar'
        ]
        
        for helper in required_helpers:
            assert hasattr(analysis, helper), (
                f"Missing required helper method: {helper}. "
                f"Refactored code must extract common plotting logic into private helpers."
            )
            assert callable(getattr(analysis, helper)), f"{helper} must be callable"
    finally:
        cleanup_test_csv()


def test_create_figure_returns_fig_and_ax():
    """
    Structural requirement: _create_figure must return (fig, ax) tuple.
    
    This test will FAIL for repository_before (method doesn't exist)
    and PASS for repository_after (returns explicit fig, ax objects).
    """
    csv_path = create_test_csv()
    try:
        analysis = FinancialNewsAnalysis(csv_path)
        
        assert hasattr(analysis, '_create_figure'), (
            "_create_figure method does not exist. "
            "Refactored code must use explicit figure/axis objects."
        )
        
        result = analysis._create_figure((12, 6))
        
        assert isinstance(result, tuple), "_create_figure must return a tuple"
        assert len(result) == 2, "_create_figure must return (fig, ax) tuple"
    finally:
        cleanup_test_csv()


def test_dry_principle_plot_histogram_reused():
    """
    Structural requirement: _plot_histogram must be called at least 2 times (DRY).
    
    This test will FAIL for repository_before (no _plot_histogram method, code duplicated)
    and PASS for repository_after (_plot_histogram called for headline and date histograms).
    """
    csv_path = create_test_csv()
    try:
        analysis = FinancialNewsAnalysis(csv_path)
        
        assert hasattr(analysis, '_plot_histogram'), (
            "_plot_histogram method does not exist. "
            "Refactored code must extract histogram plotting into reusable helper."
        )
        
        # Check source code of visualize_stat_measures for _plot_histogram calls
        source = inspect.getsource(analysis.visualize_stat_measures)
        call_count = source.count('_plot_histogram')
        
        assert call_count >= 2, (
            f"_plot_histogram should be called at least 2 times (DRY principle). "
            f"Found {call_count} calls. The histogram logic for headline lengths and "
            f"date distribution should both use this helper."
        )
    finally:
        cleanup_test_csv()


def test_no_duplicated_figure_creation():
    """
    Structural requirement: visualize_stat_measures must not contain duplicated plt.figure() calls.
    
    This test will FAIL for repository_before (has 3 direct plt.figure() calls)
    and PASS for repository_after (uses _create_figure helper instead).
    """
    csv_path = create_test_csv()
    try:
        analysis = FinancialNewsAnalysis(csv_path)
        
        source = inspect.getsource(analysis.visualize_stat_measures)
        
        # Count direct plt.figure() calls in visualize_stat_measures
        figure_calls = source.count('plt.figure(')
        
        assert figure_calls == 0, (
            f"visualize_stat_measures contains {figure_calls} direct plt.figure() calls. "
            f"Refactored code must use _create_figure helper instead of duplicating "
            f"figure creation logic."
        )
    finally:
        cleanup_test_csv()


def test_helper_accepts_explicit_data():
    """
    Structural requirement: Helper methods must accept data explicitly (no hardcoded columns).
    
    This test will FAIL for repository_before (no helpers)
    and PASS for repository_after (helpers accept 'data' and 'series' parameters).
    """
    csv_path = create_test_csv()
    try:
        analysis = FinancialNewsAnalysis(csv_path)
        
        # Check _plot_histogram accepts 'data' parameter
        assert hasattr(analysis, '_plot_histogram'), "_plot_histogram does not exist"
        sig = inspect.signature(analysis._plot_histogram)
        params = list(sig.parameters.keys())
        assert 'data' in params, (
            "_plot_histogram must accept 'data' parameter explicitly. "
            "Helper methods should not hardcode column names."
        )
        
        # Check _plot_bar accepts 'series' parameter
        assert hasattr(analysis, '_plot_bar'), "_plot_bar does not exist"
        sig = inspect.signature(analysis._plot_bar)
        params = list(sig.parameters.keys())
        assert 'series' in params, (
            "_plot_bar must accept 'series' parameter explicitly. "
            "Helper methods should not hardcode column names."
        )
    finally:
        cleanup_test_csv()


def test_no_duplicated_show_calls():
    """
    Structural requirement: visualize_stat_measures must not contain duplicated plt.show() calls.
    
    This test will FAIL for repository_before (has 3 direct plt.show() calls)
    and PASS for repository_after (uses _show_plot helper instead).
    """
    csv_path = create_test_csv()
    try:
        analysis = FinancialNewsAnalysis(csv_path)
        
        source = inspect.getsource(analysis.visualize_stat_measures)
        
        # Count direct plt.show() calls in visualize_stat_measures
        show_calls = source.count('plt.show(')
        
        assert show_calls == 0, (
            f"visualize_stat_measures contains {show_calls} direct plt.show() calls. "
            f"Refactored code must use _show_plot helper instead of duplicating "
            f"show logic."
        )
    finally:
        cleanup_test_csv()


def test_configure_axis_reused():
    """
    Structural requirement: _configure_axis must be called multiple times (DRY).
    
    This test will FAIL for repository_before (no _configure_axis method)
    and PASS for repository_after (_configure_axis called by _plot_histogram and _plot_bar).
    """
    csv_path = create_test_csv()
    try:
        analysis = FinancialNewsAnalysis(csv_path)
        
        assert hasattr(analysis, '_configure_axis'), (
            "_configure_axis method does not exist. "
            "Refactored code must extract axis configuration into reusable helper."
        )
        
        # Check that _configure_axis is called in _plot_histogram
        if hasattr(analysis, '_plot_histogram'):
            hist_source = inspect.getsource(analysis._plot_histogram)
            assert '_configure_axis' in hist_source, (
                "_plot_histogram must call _configure_axis for DRY compliance."
            )
        
        # Check that _configure_axis is called in _plot_bar
        if hasattr(analysis, '_plot_bar'):
            bar_source = inspect.getsource(analysis._plot_bar)
            assert '_configure_axis' in bar_source, (
                "_plot_bar must call _configure_axis for DRY compliance."
            )
    finally:
        cleanup_test_csv()


def test_show_plot_reused():
    """
    Structural requirement: _show_plot must be called by plotting helpers.
    
    This test will FAIL for repository_before (no _show_plot method)
    and PASS for repository_after (_show_plot called by _plot_histogram and _plot_bar).
    """
    csv_path = create_test_csv()
    try:
        analysis = FinancialNewsAnalysis(csv_path)
        
        assert hasattr(analysis, '_show_plot'), (
            "_show_plot method does not exist. "
            "Refactored code must extract show logic into reusable helper."
        )
        
        # Check that _show_plot is called in _plot_histogram
        if hasattr(analysis, '_plot_histogram'):
            hist_source = inspect.getsource(analysis._plot_histogram)
            assert '_show_plot' in hist_source, (
                "_plot_histogram must call _show_plot for DRY compliance."
            )
        
        # Check that _show_plot is called in _plot_bar
        if hasattr(analysis, '_plot_bar'):
            bar_source = inspect.getsource(analysis._plot_bar)
            assert '_show_plot' in bar_source, (
                "_plot_bar must call _show_plot for DRY compliance."
            )
    finally:
        cleanup_test_csv()


# =============================================================================
# Additional PASS_TO_PASS: More behavioral tests
# =============================================================================

def test_descriptive_statistics_headline_stats_structure():
    """Verify headline_stats has expected statistical keys."""
    csv_path = create_test_csv()
    try:
        analysis = FinancialNewsAnalysis(csv_path)
        headline_stats, _, _ = analysis.descriptive_statistics()
        
        # Should have count, mean, std, min, max, etc.
        assert hasattr(headline_stats, 'count') or 'count' in headline_stats.index, (
            "headline_stats should contain 'count'"
        )
    finally:
        cleanup_test_csv()


def test_descriptive_statistics_publisher_counts():
    """Verify publisher_counts returns correct counts."""
    csv_path = create_test_csv()
    try:
        analysis = FinancialNewsAnalysis(csv_path)
        _, publisher_counts, _ = analysis.descriptive_statistics()
        
        # Reuters and Bloomberg each have 2 articles, CNBC has 1
        assert publisher_counts['Reuters'] == 2, f"Expected Reuters=2, got {publisher_counts['Reuters']}"
        assert publisher_counts['Bloomberg'] == 2, f"Expected Bloomberg=2, got {publisher_counts['Bloomberg']}"
        assert publisher_counts['CNBC'] == 1, f"Expected CNBC=1, got {publisher_counts['CNBC']}"
    finally:
        cleanup_test_csv()


def test_descriptive_statistics_date_counts():
    """Verify date_counts returns counts per date."""
    csv_path = create_test_csv()
    try:
        analysis = FinancialNewsAnalysis(csv_path)
        _, _, date_counts = analysis.descriptive_statistics()
        
        # Each date has 1 article
        assert len(date_counts) == 5, f"Expected 5 unique dates, got {len(date_counts)}"
    finally:
        cleanup_test_csv()


def test_class_accepts_file_path():
    """Verify class constructor accepts file path string."""
    csv_path = create_test_csv()
    try:
        analysis = FinancialNewsAnalysis(csv_path)
        assert analysis is not None, "Constructor should return instance"
        assert hasattr(analysis, 'data'), "Instance should have data attribute"
    finally:
        cleanup_test_csv()


if __name__ == '__main__':
    import subprocess
    result = subprocess.run(
        [sys.executable, '-m', 'pytest', __file__, '-v'],
        capture_output=False
    )
    sys.exit(result.returncode)
