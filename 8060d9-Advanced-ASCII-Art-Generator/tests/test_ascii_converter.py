import pytest
from repository_after.src.ascii_converter import AsciiConverter, CHAR_SETS

class TestAsciiConverter:

    def test_char_sets_availability(self):
        """Req A: Ensure all required modes exist."""
        assert 'simple' in CHAR_SETS
        assert 'detailed' in CHAR_SETS
        assert 'block' in CHAR_SETS
        # Detailed should have 70+ chars
        assert len(CHAR_SETS['detailed']) >= 70
        # Simple should have ~10
        assert 10 <= len(CHAR_SETS['simple']) <= 12

    def test_custom_charset(self):
        """Req A: Custom defined sets."""
        converter = AsciiConverter(custom_set="ABC")
        assert converter.chars == "ABC"
        assert converter._pixel_to_char(0) == "A"
        assert converter._pixel_to_char(255) == "C"

    def test_braille_conversion_logic(self, small_braille_image):
        """Req A & 1: Braille Mode logic."""
        converter = AsciiConverter(char_set='braille')
        # small_braille_image is 2x4 pixels -> 1 braille char
        grid = converter.convert_braille(small_braille_image)

        assert len(grid) == 1
        assert len(grid[0]) == 1
        # Hex 2881 is ⢁
        assert grid[0][0] == chr(0x2881)

    def test_dithering_impact(self, gray_image):
        """Req C: Dithering should alter pixel values vs standard."""
        converter = AsciiConverter(char_set='simple')

        # For a flat gray image, dithering introduces noise (checkering).
        flat_gray = gray_image.point(lambda p: 128)

        lines_no_dither, _ = converter.convert_image(flat_gray, dither=False)
        lines_dither, _ = converter.convert_image(flat_gray, dither=True)

        # Non-dithered flat gray is uniform chars
        assert len(set(lines_no_dither[0])) == 1
        # Dithered flat gray usually alternates chars to simulate grey
        assert lines_no_dither != lines_dither