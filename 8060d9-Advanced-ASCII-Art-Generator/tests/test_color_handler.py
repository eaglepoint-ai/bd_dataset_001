import pytest
from repository_after.src.color_handler import ColorHandler

class TestColorHandler:

    def test_rgb_to_html(self):
        """Req B: HTML Hex conversion."""
        assert ColorHandler.rgb_to_html(255, 0, 0) == "#ff0000"
        assert ColorHandler.rgb_to_html(0, 255, 0) == "#00ff00"
        assert ColorHandler.rgb_to_html(255, 255, 255) == "#ffffff"

    def test_rgb_to_ansi_truecolor(self):
        """Req B: True Color RGB sequences."""
        # Foreground
        fg = ColorHandler.rgb_to_ansi(255, 100, 50, background=False)
        assert "38;2;255;100;50" in fg

        # Background
        bg = ColorHandler.rgb_to_ansi(0, 0, 0, background=True)
        assert "48;2;0;0;0" in bg

    def test_rgb_to_ansi_256(self):
        """Req B: 256 Color approximation."""
        # Black
        assert "16" in ColorHandler.rgb_to_ansi_256(0, 0, 0)
        # White
        assert "231" in ColorHandler.rgb_to_ansi_256(255, 255, 255)