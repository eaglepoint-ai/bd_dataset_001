from PIL import Image, ImageEnhance, ImageFilter, ImageOps
import numpy as np
from typing import Tuple, Optional, Union

class ImageProcessor:
    """Handles loading and preprocessing of images."""

    def __init__(self):
        pass

    def load_image(self, path: str) -> Image.Image:
        """Loads an image from a file path."""
        try:
            return Image.open(path)
        except IOError:
            raise ValueError(f"Unable to load image: {path}")

    def preprocess(self, image: Image.Image,
                   contrast: float = 1.0,
                   brightness: float = 1.0,
                   sharpness: float = 1.0,
                   invert: bool = False,
                   flip_h: bool = False,
                   flip_v: bool = False,
                   edge_detect: bool = False) -> Image.Image:
        """Applies various image enhancements and transformations."""

        # Color corrections
        if contrast != 1.0:
            image = ImageEnhance.Contrast(image).enhance(contrast)
        if brightness != 1.0:
            image = ImageEnhance.Brightness(image).enhance(brightness)
        if sharpness != 1.0:
            image = ImageEnhance.Sharpness(image).enhance(sharpness)

        # Transformations
        if flip_h:
            image = ImageOps.mirror(image)
        if flip_v:
            image = ImageOps.flip(image)
        if invert:
            # Invert requires RGB or L mode usually
            if image.mode == 'RGBA':
                r, g, b, a = image.split()
                rgb_image = Image.merge('RGB', (r, g, b))
                inverted = ImageOps.invert(rgb_image)
                r, g, b = inverted.split()
                image = Image.merge('RGBA', (r, g, b, a))
            else:
                image = ImageOps.invert(image.convert('RGB'))

        # Filters
        if edge_detect:
            image = image.filter(ImageFilter.FIND_EDGES)

        return image

    def resize_for_ascii(self, image: Image.Image, width: int, aspect_ratio: float = 0.5, braille: bool = False) -> Image.Image:
        """
        Resizes image accounting for terminal character aspect ratio.

        Args:
            image: Source image.
            width: Target width in characters.
            aspect_ratio: Height/Width ratio of a terminal character (usually ~0.5).
            braille: If True, uses specific calculation for 2x4 dot matrix.
        """
        w_orig, h_orig = image.size

        if braille:
            # Braille uses 2x4 dots per character
            # We resize the image to the virtual pixel size (2 * chars_width, 4 * chars_height)
            # To keep aspect, we first calculate target char height
            r = h_orig / w_orig
            h_chars = int(width * r * aspect_ratio)
            return image.resize((width * 2, h_chars * 4), Image.Resampling.LANCZOS)

        r = h_orig / w_orig
        new_height = int(width * r * aspect_ratio)
        return image.resize((width, new_height), Image.Resampling.LANCZOS)