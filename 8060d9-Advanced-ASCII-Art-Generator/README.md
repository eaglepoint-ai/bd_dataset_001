# project template

Starter scaffold for bd dataset task.

## Structure

- repository_before/: baseline code (`__init__.py`)
- repository_after/: optimized code (`__init__.py`)
- tests/: test suite (`__init__.py`)
- evaluation/: evaluation scripts (`evaluation.py`)
- instances/: sample/problem instances (JSON)
- patches/: patches for diffing
- trajectory/: notes or write-up (Markdown)

---

## Template Instructions

> **Note:** The task gen team should delete this section after creating the task.

### Setup Steps

1. **Create a directory** with the format: `uuid-task_title`

   - Task title words should be joined by underscores (`_`)
   - UUID and task title should be joined with a dash (`-`)
   - Example: `5g27e7-My_Task_Title`

2. **Update `instances/instance.json`** — the following fields are empty by default; fill in appropriate values:

   - `"instance_id"`
   - `"problem_statement"`
   - `"github_url"`

3. **Update `.gitignore`** to reflect your language and library setup

4. **Add `reports/` inside `evaluation/` to `.gitignore`**
   - Each report run should be organized by date/time

---

## Reports Generation

> **Note:** The developer should delete this section after completing the task before pushing to GitHub.

When the evaluation command is run, it should generate reports in the following structure:

```
evaluation/
└── reports/
    └── YYYY-MM-DD/
        └── HH-MM-SS/
            └── report.json
```

### Report Schema

```json
{
  "run_id": "uuid",
  "started_at": "ISO-8601",
  "finished_at": "ISO-8601",
  "duration_seconds": 0.0,
  "environment": {
    "python_version": "3.x",
    "platform": "os-arch"
  },
  "before": {
    "tests": {},
    "metrics": {}
  },
  "after": {
    "tests": {},
    "metrics": {}
  },
  "comparison": {},
  "success": true,
  "error": null
}
```

The developer should add any additional metrics and keys that reflect the runs (e.g., data seeded to test the code on before/after repository).

---

## Final README Contents

> **Note:** Replace the template content above with the following sections before pushing:

1. **Problem Statement**
2. **Prompt Used**
3. **Requirements Specified**
4. **Commands:**

   - Commands to spin up the app and run tests on `repository_before`
   - Commands to run tests on `repository_after`
   - Commands to run `evaluation/evaluation.py` and generate reports

   > **Note:** For full-stack app tasks, the `repository_before` commands will be empty since there is no app initially.

## Problem Statement

```
The task is to develop a sophisticated Python command-line application that converts digital images into ASCII art with advanced customization and multiple output formats. The tool must analyze pixel brightness, map it to various character sets—including simple gradients, detailed sets, Braille patterns, and custom user-defined sets—and support outputs in plain text, colored terminal, HTML, JSON, and even animated GIFs or video frames. It should offer image processing features like aspect-ratio correction, contrast/brightness/sharpness adjustment, edge detection, dithering, inversion, and flipping, with full CLI support for batch and interactive modes, configuration files, and detailed output customization. The codebase must be modular, well-documented, PEP 8 compliant, robustly tested, and leverage libraries such as Pillow, OpenCV, Rich/Colorama, PyYAML, and tqdm to deliver a professional, flexible, and maintainable ASCII art generation platform.

```

## Prompt Used

```
Create a sophisticated Python command-line application that converts images into ASCII art with advanced features and multiple output formats.

Develop a Python 3.8+ command-line tool that converts digital images (JPG, PNG, GIF, BMP) into ASCII art by analyzing pixel brightness, mapping values to ASCII characters, and reconstructing images as text. The program must support multiple character modes including a simple 10-character gradient, a detailed 70+ character set, Unicode block elements, custom user-defined sets, and Braille patterns for high-resolution output. It should provide grayscale, ANSI 256-color, true-color RGB, and HTML color outputs, with image processing features such as aspect-ratio correction for terminal characters, user-defined output dimensions, adjustable contrast/brightness/sharpness, optional edge detection, and Floyd–Steinberg dithering. Output formats must include plain text, terminal display, styled HTML (with dark/light themes and optional side-by-side comparison with the original image), JSON export, and support for animated GIFs and video frame conversion with playback controls. A comprehensive argparse-based CLI is required, supporting batch and interactive modes, configuration via YAML/JSON files, preprocessing options, inversion, mirroring/flipping, and detailed output customization. The technical stack should use Pillow for image processing, colorama or rich for terminal colors, OpenCV for video handling, tqdm for progress reporting, PyYAML for config files, and pytest for unit testing. The codebase must follow a modular architecture (image processing, character mapping, color handling, output generation, CLI), include type hints, docstrings, PEP 8 compliance, robust error handling, and achieve over 80% unit test coverage.

Project Structure
ASCII Art Generator folder/
- src/
  - `__init__.py`
  - `main.py`              # Entry point and CLI
  - `image_processor.py`   # Image loading and preprocessing
  - `ascii_converter.py`   # Core conversion logic
  - `color_handler.py`     # Color processing and output
  - `output_generator.py`  # Generate different output formats
  - `utils.py`             # Helper functions
1. Core Functionality
Develop a Python script that converts digital images (JPG, PNG, GIF, BMP) into ASCII art representations. The program should:
- Analyze pixel brightness values
- Map them to appropriate ASCII characters
- Recreate the image using text

2. Feature Set
A. Character Set Options
- Simple Mode: Use a basic 10-character gradient ( .:-=+*#%@)
- Detailed Mode:Implement 70+ character sets for fine-grained gradients
- Block Mode: Utilize Unicode block elements (█▓▒░▌▐ etc.) for solid representations
- Custom Sets: Allow users to define their own character mappings
- Braille Mode: Use Unicode Braille patterns for ultra-high resolution output

B. Color Support
- Grayscale: Traditional black-and-white ASCII output
- ANSI 256: Terminal output with 256-color palette
- True Color: RGB terminal output with 16.7 million colors
- HTML Color: Generate colored HTML files with inline CSS styling

C. Image Processing
- Aspect Ratio Correction: Account for terminal character dimensions (typically 2:1 height-to-width ratio)
- Dimension Control:Allow users to specify output width and height in characters
- Preprocessing: Implement adjustable contrast, brightness, and sharpness
- Edge Detection: Optional edge enhancement mode to highlight contours
- Dithering:Apply Floyd-Steinberg dithering for improved detail retention

D. Output Formats
- Plain Text: Save to .txt files
- HTML: Generate styled HTML files with theme support (dark/light modes)
- Terminal: Display directly in terminal with color support
- JSON:Export as structured data for programmatic use
- Comparison View: HTML output showing original image alongside ASCII version


E. Animation Support
- GIF Processing: Convert animated GIFs to terminal-animated ASCII art
- Video Support: Extract video frames and convert to ASCII sequences
- Playback Controls: Implement frame rate adjustment and playback controls

F. Command-Line Interface
- Comprehensive argparse implementation with the following options:
  - Input file/directory path
  - Output dimensions (width/height)
  - Character set selection
  - Color mode selection
  - Output format choice
  - Preprocessing options (contrast, brightness, sharpness)
  - Invert mode toggle
  - Mirror/flip options
- Batch Mode:Process multiple images in one command
- Interactive Mode: Real-time preview with adjustment capabilities
- Config Files: Support YAML/JSON configuration files for preset settings


3. Technical Stack
- Core: Python 3.8+
- Image Processing:*Pillow (PIL)
- Terminal Colors: colorama or rich library
- Video Processing: opencv-python
- CLI: argparse
- Config: PyYAML
- Progress: tqdm
- Testing: pytest (unit tests for core functions)

4. Code Quality Requirements
- Modular architecture with separate modules for:
  - Image processing
  - Character mapping
  - Color conversion
  - Output generation
  - CLI handling
- Type hints throughout the codebase
- Comprehensive docstrings
- PEP 8 compliant
- Error handling and user-friendly error messages
```

## Requirements

Criteria that must be met for this task

1. Core Functionality
   Develop a Python script that converts digital images (JPG, PNG, GIF, BMP) into ASCII art representations. The program should:

- Analyze pixel brightness values
- Map them to appropriate ASCII characters
- Recreate the image using text

2. Feature Set
   A. Character Set Options

- Simple Mode: Use a basic 10-character gradient ( .:-=+\*#%@)
- Detailed Mode:Implement 70+ character sets for fine-grained gradients
- Block Mode: Utilize Unicode block elements (█▓▒░▌▐ etc.) for solid representations
- Custom Sets: Allow users to define their own character mappings
- Braille Mode: Use Unicode Braille patterns for ultra-high resolution output
  B. Color Support
- Grayscale: Traditional black-and-white ASCII output
- ANSI 256: Terminal output with 256-color palette
- True Color: RGB terminal output with 16.7 million colors
- HTML Color: Generate colored HTML files with inline CSS styling
  C. Image Processing
- Aspect Ratio Correction: Account for terminal character dimensions (typically 2:1 height-to-width ratio)
- Dimension Control:Allow users to specify output width and height in characters
- Preprocessing: Implement adjustable contrast, brightness, and sharpness
- Edge Detection: Optional edge enhancement mode to highlight contours
- Dithering:Apply Floyd-Steinberg dithering for improved detail retention
  D. Output Formats
- Plain Text: Save to .txt files
- HTML: Generate styled HTML files with theme support (dark/light modes)
- Terminal: Display directly in terminal with color support
- JSON:Export as structured data for programmatic use
- Comparison View: HTML output showing original image alongside ASCII version
  E. Animation Support
- GIF Processing: Convert animated GIFs to terminal-animated ASCII art
- Video Support: Extract video frames and convert to ASCII sequences
- Playback Controls: Implement frame rate adjustment and playback controls
  F. Command-Line Interface
- Comprehensive argparse implementation with the following options:
- Input file/directory path
- Output dimensions (width/height)
- Character set selection
- Color mode selection
- Output format choice
- Preprocessing options (contrast, brightness, sharpness)
- Invert mode toggle
- Mirror/flip options
- Batch Mode:Process multiple images in one command
- Interactive Mode: Real-time preview with adjustment capabilities
- Config Files: Support YAML/JSON configuration files for preset settings

3. Technical Stack

- Core: Python 3.8+
- Image Processing:\*Pillow (PIL)
- Terminal Colors: colorama or rich library
- Video Processing: opencv-python
- CLI: argparse
- Config: PyYAML
- Progress: tqdm
- Testing: pytest (unit tests for core functions)

4. Code Quality Requirements

- Modular architecture with separate modules for:
- Image processing
- Character mapping
- Color conversion
- Output generation
- CLI handling
- Type hints throughout the codebase
- Comprehensive docstrings
- PEP 8 compliant
- Error handling and user-friendly error messages

## Commands

### Run with Docker

### Build image

```bash
docker compose build
```

### Run tests before

- No repository_before

### Run test for after

```bash
docker compose run --rm app pytest -v

```

**Expected behavior:**

- All test cases are expected to pass for all edge cases

#### Run evaluation

This will show the detail for repository_after test (we don't have repository_before).

```bash
docker compose run --rm app python evaluation/evaluation.py
```

This will:

- Run tests for after implementations
- Run structure and equivalence tests
- Generate a report at `evaluation/YYYY-MM-DD/HH-MM-SS/report.json`

#### Run evaluation with custom output file

```bash
docker compose run --rm app python evaluation/evaluation.py --output /path/to/custom/report.json
```

### Generate patch

From repo root:

```bash
git diff --no-index repository_before repository_after > patches/task_001.patch
```
