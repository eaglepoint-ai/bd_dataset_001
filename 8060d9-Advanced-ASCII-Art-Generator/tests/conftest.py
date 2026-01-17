import pytest
from PIL import Image
import numpy as np
import os

@pytest.fixture
def gray_image():
    """Creates a 10x10 grayscale gradient image."""
    img = Image.new('L', (10, 10))
    # Create a gradient
    for x in range(10):
        for y in range(10):
            img.putpixel((x, y), x * 25)
    return img

@pytest.fixture
def rgb_image():
    """Creates a 10x10 RGB image (Red)."""
    img = Image.new('RGB', (10, 10), color=(255, 0, 0))
    return img

@pytest.fixture
def small_braille_image():
    """Creates a 2x4 image specifically for testing one Braille char."""
    # Pattern: Top-left and Bottom-right active
    # Braille Dots: 1 (top-left) + 8 (bottom-right) = 0x2800 + 1 + 80 = 0x2881
    img = Image.new('L', (2, 4), color=0)
    img.putpixel((0, 0), 255) # Dot 1
    img.putpixel((1, 3), 255) # Dot 8
    return img