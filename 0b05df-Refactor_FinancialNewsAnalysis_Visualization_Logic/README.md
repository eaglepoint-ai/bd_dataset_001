# Refactor: FinancialNewsAnalysis Visualization Logic

This dataset task contains a `FinancialNewsAnalysis` class with repetitive plotting logic.
The objective is **structural de-duplication** of the `visualize_stat_measures` method while preserving **exact visual output behavior**.

## Problem Statement

The `FinancialNewsAnalysis` class contains tightly coupled, repetitive plotting logic within the `visualize_stat_measures` method. The current implementation:
- Violates the DRY principle with repeated `plt.figure()`, `plt.xlabel()`, `plt.ylabel()`, `plt.title()`, `plt.show()` patterns
- Relies on implicit matplotlib state instead of explicit figure/axis objects
- Mixes inline plotting code instead of using reusable helper methods

Refactoring is needed to extract private helper methods (`_create_figure`, `_configure_axis`, `_show_plot`, `_plot_histogram`, `_plot_bar`) that consolidate duplicated logic while preserving the public API and exact visual output.

## Folder Layout

- `repository_before/` — original implementation with duplicated plotting code
- `repository_after/` — refactored implementation with private helper methods
- `tests/` — structural and behavioral equivalence tests
- `evaluation/` — evaluation scripts and reports
- `patches/` — diff between before/after
- `instances/` — task instance metadata (JSON)
- `trajectory/` — AI reasoning trajectory (Markdown)

## Run with Docker

### Build image
```bash
docker compose build
```

### Run tests (before – expected some failures)
```bash
docker compose run --rm -e PYTHONPATH=/app/repository_before app pytest -v --tb=no
```

**Expected behavior:**
- Behavioral tests: ✅ PASS (public API works correctly)
- Structural tests: ❌ FAIL (no helper methods, duplicated code)

### Run tests (after – expected all pass)
```bash
docker compose run --rm -e PYTHONPATH=/app/repository_after app pytest -v
```

**Expected behavior:**
- Behavioral tests: ✅ PASS (public API unchanged)
- Structural tests: ✅ PASS (helper methods extracted, DRY principle followed)

### Run evaluation (compares both implementations)
```bash
docker compose run --rm app python evaluation/evaluation.py
```

This will:
- Run tests for both before and after implementations
- Verify structural requirements (helper methods, DRY principle)
- Generate a report at `evaluation/YYYY-MM-DD/HH-MM-SS/report.json`

## Run Locally

### Install dependencies
```bash
pip install -r requirements.txt
```

### Run tests on repository_before
```bash
PYTHONPATH=repository_before pytest tests/ -v
```

### Run tests on repository_after
```bash
PYTHONPATH=repository_after pytest tests/ -v
```

## Regenerate Patch

From repo root:
```bash
git diff --no-index repository_before/financial_news_analysis.py repository_after/financial_news_analysis.py > patches/diff.patch
```

## Test Categories

### FAIL_TO_PASS (8 tests)
These tests fail on `repository_before` and pass on `repository_after`:
- `test_helper_methods_exist` — verifies private helpers are defined
- `test_create_figure_returns_fig_and_ax` — verifies explicit figure/axis objects
- `test_dry_principle_plot_histogram_reused` — verifies `_plot_histogram` called 2+ times
- `test_no_duplicated_figure_creation` — verifies no direct `plt.figure()` calls
- `test_helper_accepts_explicit_data` — verifies helpers accept data parameters
- `test_no_duplicated_show_calls` — verifies no direct `plt.show()` calls
- `test_configure_axis_reused` — verifies `_configure_axis` is called by plotting helpers
- `test_show_plot_reused` — verifies `_show_plot` is called by plotting helpers

### PASS_TO_PASS (8 tests)
These tests pass on both implementations:
- `test_public_api_exists` — verifies public methods exist
- `test_descriptive_statistics_returns_tuple` — verifies return type
- `test_data_loaded_correctly` — verifies CSV loading
- `test_headline_length_calculated` — verifies computed column
- `test_descriptive_statistics_headline_stats_structure` — verifies stats keys
- `test_descriptive_statistics_publisher_counts` — verifies publisher counting
- `test_descriptive_statistics_date_counts` — verifies date counting
- `test_class_accepts_file_path` — verifies constructor accepts file path
