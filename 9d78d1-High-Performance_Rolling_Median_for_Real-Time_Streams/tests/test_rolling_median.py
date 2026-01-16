import pytest
import os
import sys

# Dynamically import RollingMedian based on environment variable
TARGET_REPO = os.environ.get("TARGET_REPO", "repository_after")
sys.path.insert(0, f"/app/{TARGET_REPO}")

if TARGET_REPO.endswith("repository_after"):
    from rolling_median import RollingMedian
else:
    from rolling_median import RollingMedian as OldRollingMedian


def test_median_basic_operations():
    """
    Test basic median calculation with a small sliding window.

    Ensures:
    - Correct median for initial window fills.
    - Proper median after sliding (oldest elements removed).
    """
    rm = RollingMedian(window_size=5)

    # Add initial elements
    assert rm.add(3) == 3.0  # median of [3]
    assert rm.add(1) == 2.0  # median of [3,1]
    assert rm.add(4) == 3.0  # median of [3,1,4]
    assert rm.add(1) == 2.0  # median of [3,1,4,1]
    assert rm.add(5) == 3.0  # median of [3,1,4,1,5]

    # Window slides (oldest 3 removed)
    assert rm.add(9) == 4.0  # median of [1,4,1,5,9]
    assert rm.add(2) == 4.0  # median of [4,1,5,9,2]


def test_handle_duplicates():
    """
    Test that the rolling median handles duplicate prices correctly.

    Ensures:
    - Multiple identical values do not break median calculation.
    """
    rm = RollingMedian(window_size=4)
    prices = [5, 5, 5, 5]
    for _ in prices:
        median = rm.add(5)
        assert median == 5.0, "Median should handle duplicates correctly"


def test_exact_median_even_odd_window():
    """
    Test exact median calculation for even and odd-sized windows.

    Ensures:
    - Even count: median is the average of middle two elements.
    - Odd count: median is the middle element.
    """
    rm = RollingMedian(window_size=4)
    rm.add(1)
    rm.add(3)
    rm.add(2)
    rm.add(4)
    # Even count: median = (2 + 3)/2 = 2.5
    assert rm.get_median() == 2.5

    rm.add(5)  # window now [3,2,4,5] -> sorted [2,3,4,5]
    # Median = (3 + 4)/2 = 3.5
    assert rm.get_median() == 3.5


def test_window_underfill():
    """
    Test behavior when the window is not yet full.

    Ensures:
    - Median is computed correctly for partially filled windows.
    """
    rm = RollingMedian(window_size=5)
    assert rm.add(10) == 10.0
    assert rm.add(20) == 15.0  # median of [10,20]
    assert rm.add(30) == 20.0  # median of [10,20,30]


def test_all_identical_values():
    """
    Test behavior when all elements in the window are identical.

    Ensures:
    - Median remains constant and equal to repeated value.
    """
    rm = RollingMedian(window_size=3)
    for _ in range(3):
        assert rm.add(7) == 7.0  # median always 7


def test_out_of_bounds():
    """
    Test that the rolling median correctly rejects invalid prices.

    Ensures:
    - ValueError is raised for prices < 0 or > price_max.
    """
    rm = RollingMedian(window_size=3)
    with pytest.raises(ValueError):
        rm.add(-1)
    with pytest.raises(ValueError):
        rm.add(10001)