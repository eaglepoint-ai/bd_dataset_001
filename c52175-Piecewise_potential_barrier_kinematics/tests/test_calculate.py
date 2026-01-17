import math
import pytest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../repository_after')))

from calculate import compute_dual_zone_impact

def test_repulsive_zone_start():
    t, v = compute_dual_zone_impact(150)
    assert t == math.inf
    assert v is None

def test_attractive_zone_start():
    h = 100
    t, v = compute_dual_zone_impact(h)
    expected_t = math.sqrt(100 / 4.9)
    expected_v = -9.8 * expected_t
    
    assert t == pytest.approx(expected_t, abs=1e-5)
    assert v == pytest.approx(expected_v, abs=1e-5)

def test_exact_boundary():
    t, v = compute_dual_zone_impact(100)
    assert t != math.inf
    assert v is not None
