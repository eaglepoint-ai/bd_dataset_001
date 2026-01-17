from typing import Tuple, Optional

class ColorHandler:
    """Handles color conversion for Terminal and HTML output."""

    @staticmethod
    def rgb_to_ansi(r: int, g: int, b: int, background: bool = False) -> str:
        """Converts RGB values to ANSI escape codes (True Color)."""
        mode = 48 if background else 38
        return f"\033[{mode};2;{r};{g};{b}m"

    @staticmethod
    def rgb_to_html(r: int, g: int, b: int) -> str:
        """Converts RGB values to Hex string."""
        return f"#{r:02x}{g:02x}{b:02x}"

    @staticmethod
    def get_reset_code() -> str:
        """Returns the ANSI reset code."""
        return "\033[0m"

    @staticmethod
    def rgb_to_ansi_256(r: int, g: int, b: int) -> str:
        """Approximates RGB to ANSI 256 color code."""
        if r == g == b:
            if r < 8: return "\033[38;5;16m"
            if r > 248: return "\033[38;5;231m"
            return f"\033[38;5;{round(((r - 8) / 247) * 24) + 232}m"

        val = 16 + (36 * round(r / 255 * 5)) + (6 * round(g / 255 * 5)) + round(b / 255 * 5)
        return f"\033[38;5;{val}m"