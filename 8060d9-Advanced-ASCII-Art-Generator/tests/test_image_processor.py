import pytest
from PIL import Image
from repository_after.src.image_processor import ImageProcessor

class TestImageProcessor:

    def test_resize_aspect_ratio_correction(self):
        """Req C: Aspect Ratio Correction (2:1 char ratio)."""
        processor = ImageProcessor()
        # Original: 100x100 square
        img = Image.new('L', (100, 100))
        target_width = 50

        # With 0.5 ratio: Height = 50 * (100/100) * 0.5 = 25
        resized = processor.resize_for_ascii(img, width=50, aspect_ratio=0.5)
        assert resized.size == (50, 25)

    def test_resize_for_braille(self):
        """Req A: Braille requires specific 2x4 upscaling logic."""
        processor = ImageProcessor()
        img = Image.new('L', (10, 10))
        width_chars = 10

        # Braille physics: 1 char = 2x4 pixels.
        # Resize target = (10*2, calculated_height*4)
        resized = processor.resize_for_ascii(img, width=width_chars, braille=True)

        assert resized.width == 20 # 10 * 2
        # Height logic depends on aspect, but ensures block alignment

    def test_preprocessing_filters(self, rgb_image):
        """Req C: Brightness, Contrast, Invert, Flip, Edge."""
        processor = ImageProcessor()

        # Test Invert
        inverted = processor.preprocess(rgb_image, invert=True)
        # Original was Red (255,0,0), Inverted should be Cyan (0, 255, 255)
        assert inverted.getpixel((0,0)) == (0, 255, 255)

        # Test Flip
        img_gradient = Image.new('L', (10, 10))
        img_gradient.putpixel((0,0), 0)
        img_gradient.putpixel((9,0), 255)
        flipped = processor.preprocess(img_gradient, flip_h=True)
        assert flipped.getpixel((0,0)) == 255

        # Test Edge Detection (Smoke test: ensure it runs and returns image)
        edge_img = processor.preprocess(rgb_image, edge_detect=True)
        assert isinstance(edge_img, Image.Image)