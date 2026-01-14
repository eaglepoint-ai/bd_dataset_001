# Trajectory: Advanced ASCII Art Generator

## 1. Problem Understanding

The objective is to transform raster digital images (pixels) into structured text representations (characters) while maintaining visual fidelity. The challenge lies in mapping continuous brightness and color values into discrete character sets and limited terminal color palettes, while accounting for the non-square aspect ratio of monospaced fonts.

## 2. Modular Architecture Design

To ensure maintainability and testability, the solution adopts a strict **Separation of Concerns** pattern:

- **ImageProcessor:** Pure image manipulation (PIL/Pillow).
- **AsciiConverter:** Mathematical mapping of pixel data to characters.
- **ColorHandler:** ANSI and HTML color logic.
- **OutputGenerator:** Formatting and serialization.

This architecture allows independent unit testing of core logic without side effects from I/O or CLI arguments.

## 3. Image Preprocessing & Filtering

Raw images rarely convert perfectly to ASCII. The pipeline first normalizes inputs:

- **Luminance Adjustment:** Contrast and brightness are modified to expand the dynamic range, ensuring the resulting ASCII isn't too "muddy" or "washed out."
- **Edge Detection:** An optional convolution filter highlights high-frequency details, allowing characters to represent contours rather than just shading.

## 4. Geometric Correction (Aspect Ratio)

A critical constraint is that terminal characters are typically rectangular (approx. 1:2 width-to-height ratio), whereas pixels are square (1:1).
To prevent the output from looking vertically stretched:

- The target image height is calculated as:
  $$Height = Width \times \frac{ImageHeight}{ImageWidth} \times 0.5$$
- Resizing is performed using **Lanczos resampling** to preserve detail before character mapping.

## 5. Luminance Quantization & Dithering

The core conversion logic maps pixel brightness (0–255) to a character index.

- **Linear Mapping:**
  $$Index = \lfloor \frac{PixelValue}{255} \times (Length_{charset} - 1) \rfloor$$
- **Floyd-Steinberg Dithering:** To prevent "banding" in gradients, quantization errors are calculated and distributed to neighboring pixels (East, South-West, South, South-East). This preserves perceived detail using a limited character set.

## 6. Braille Pattern Generation

High-resolution output is achieved using Unicode Braille Patterns (U+2800 to U+28FF).

- Instead of mapping 1 pixel to 1 char, the image is virtually upscaled.
- A **2x4 pixel grid** determines the specific Unicode offset based on binary flags (8 dots).
- This effectively increases the output resolution by 8x compared to standard ASCII characters.

## 7. Color Space Approximation

The system handles three distinct color fidelities:

- **True Color (24-bit):** Direct mapping of RGB values to ANSI `\033[38;2;r;g;bm` codes.
- **ANSI 256 (8-bit):** Mathematical approximation to map RGB tuples to the nearest color in the standard 6x6x6 terminal color cube.
- **HTML/Hex:** Standard hex conversion for web outputs.

## 8. Output Serialization

The generated ASCII grid is serialized based on the target format:

- **Terminal:** Interleaves ANSI escape codes directly into the string buffer, appending Reset codes at line ends to prevent color bleed.
- **HTML:** Wraps characters in `<span>` tags with inline CSS, generating a standalone document with a dark/light theme wrapper.
- **JSON:** Exports metadata and raw text lines for programmatic consumption.

## 9. Stream Processing (Video)

For video input, the system utilizes **OpenCV** to extract frames as a stream.

- Frame rate synchronization is calculated to match the video FPS.
- The ASCII frame is generated, the terminal buffer is cleared via ANSI codes, and the new frame is written, creating the illusion of animation.

## 10. Verification Strategy

The codebase is validated via a `pytest` suite that checks:

- **Mathematical Correctness:** Ensuring brightness values map to the expected collection indices.
- **Geometric Integrity:** Verifying resize logic maintains aspect ratios.
- **Integration:** Ensuring the CLI entry point correctly orchestrates the modules.
