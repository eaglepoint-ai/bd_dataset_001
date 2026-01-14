from PIL import Image
import numpy as np
from typing import List, Dict, Tuple, Optional
from .color_handler import ColorHandler

CHAR_SETS = {
    'simple': " .:-=+*#%@"[::-1], # Darkest to lightest usually, or flip for black BG
    'detailed': "$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\|()1{}[]?-_+~<>i!lI;:,\"^`'. "[::-1],
    'block': "█▓▒░ ",
}

class AsciiConverter:
    """Converts pixel data into ASCII characters."""

    def __init__(self, char_set: str = 'detailed', custom_set: str = None):
        if custom_set:
            self.chars = custom_set
        else:
            self.chars = CHAR_SETS.get(char_set, CHAR_SETS['detailed'])
        self.char_len = len(self.chars)

    def _pixel_to_char(self, value: int) -> str:
        """Maps 0-255 brightness to character index."""
        # Ensure value is clamped
        value = max(0, min(255, value))
        index = int((value / 255) * (self.char_len - 1))
        return self.chars[index]

    def convert_braille(self, image: Image.Image) -> List[List[str]]:
        """
        Converts image to Unicode Braille patterns.
        Image must be resized to (W*2, H*4) prior to this.
        """
        pixels = np.array(image.convert('L'))
        height, width = pixels.shape
        output = []

        # Threshold for "dot on"
        threshold = 127

        for y in range(0, height - 3, 4):
            row = []
            for x in range(0, width - 1, 2):
                byte = 0
                if x < width and y < height and pixels[y, x] > threshold: byte |= 0x1
                if x < width and y+1 < height and pixels[y+1, x] > threshold: byte |= 0x2
                if x < width and y+2 < height and pixels[y+2, x] > threshold: byte |= 0x4
                if x+1 < width and y < height and pixels[y, x+1] > threshold: byte |= 0x8
                if x+1 < width and y+1 < height and pixels[y+1, x+1] > threshold: byte |= 0x10
                if x+1 < width and y+2 < height and pixels[y+2, x+1] > threshold: byte |= 0x20
                if x < width and y+3 < height and pixels[y+3, x] > threshold: byte |= 0x40
                if x+1 < width and y+3 < height and pixels[y+3, x+1] > threshold: byte |= 0x80

                row.append(chr(0x2800 + byte))
            output.append(row)
        return output

    def convert_image(self, image: Image.Image, color_mode: str = 'grayscale', dither: bool = False) -> Tuple[List[str], List[List[Tuple[int, int, int]]]]:
        """
        Converts image to ASCII grid.
        Returns: (Lines of text, Color grid (RGB tuples))
        """
        # Prepare Grayscale for character mapping
        gray_image = image.convert('L')

        if dither:
            # Floyd-Steinberg Dithering for character selection
            # We map 0-255 range to 0-(N-1) range explicitly
            arr = np.array(gray_image, dtype=float)
            h, w = arr.shape
            quant_error = 0.0

            for y in range(h):
                for x in range(w):
                    old_pixel = arr[y, x]
                    # Quantize
                    normalized = old_pixel / 255.0
                    idx = int(normalized * (self.char_len - 1))
                    idx = max(0, min(self.char_len - 1, idx))

                    new_pixel_val = (idx / (self.char_len - 1)) * 255.0
                    arr[y, x] = new_pixel_val

                    quant_error = old_pixel - new_pixel_val

                    # Distribute error
                    if x + 1 < w:
                        arr[y, x + 1] += quant_error * 7 / 16
                    if x - 1 >= 0 and y + 1 < h:
                        arr[y + 1, x - 1] += quant_error * 3 / 16
                    if y + 1 < h:
                        arr[y + 1, x] += quant_error * 5 / 16
                    if x + 1 < w and y + 1 < h:
                        arr[y + 1, x + 1] += quant_error * 1 / 16

            # Re-read quantized array to chars
            chars_grid = []
            for y in range(h):
                row_str = ""
                for x in range(w):
                    val = max(0, min(255, int(arr[y, x])))
                    idx = int((val / 255) * (self.char_len - 1))
                    row_str += self.chars[idx]
                chars_grid.append(row_str)

        else:
            pixels = np.array(gray_image)
            chars_grid = []
            for row in pixels:
                chars_grid.append("".join([self._pixel_to_char(p) for p in row]))

        colors_grid = []
        if color_mode != 'grayscale':
            rgb_image = image.convert('RGB')
            # For Braille, color extraction is tricky (block average),
            color_pixels = np.array(rgb_image)
            for row in color_pixels:
                row_colors = [tuple(p) for p in row]
                colors_grid.append(row_colors)

        return chars_grid, colors_grid