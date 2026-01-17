import argparse
import sys
import os
import cv2
import time
from tqdm import tqdm
from pathlib import Path

from .image_processor import ImageProcessor
from .ascii_converter import AsciiConverter
from .output_generator import OutputGenerator
from .utils import load_config

def process_single_image(args, config, img_path):
    processor = ImageProcessor()
    converter = AsciiConverter(char_set=args.charset, custom_set=args.custom_chars)
    generator = OutputGenerator()

    # Load
    try:
        img = processor.load_image(img_path)
    except Exception as e:
        print(f"Error loading {img_path}: {e}")
        return

    # Preprocess
    img = processor.preprocess(
        img,
        contrast=args.contrast,
        brightness=args.brightness,
        sharpness=args.sharpness,
        invert=args.invert,
        flip_h=args.mirror,
        flip_v=args.flip,
        edge_detect=args.edge
    )

    # Resize
    braille_mode = (args.charset == 'braille')
    resized_img = processor.resize_for_ascii(
        img,
        width=args.width,
        braille=braille_mode
    )

    # Convert
    if braille_mode:
        ascii_grid = converter.convert_braille(resized_img)
        # Flatten braille rows to strings
        ascii_lines = ["".join(row) for row in ascii_grid]
        # Braille color extraction not implemented in this demo, default to none
        colors = []
    else:
        ascii_lines, colors = converter.convert_image(
            resized_img,
            color_mode=args.color_mode,
            dither=args.dither
        )

    # Output Handling
    output_content = ""
    if args.format == 'terminal':
        print(generator.generate_terminal(ascii_lines, colors, args.color_mode))
    else:
        if args.format == 'html':
            output_content = generator.generate_html(
                ascii_lines, colors,
                original_image=img if args.compare else None,
                comparison=args.compare
            )
            ext = ".html"
        elif args.format == 'json':
            meta = vars(args)
            output_content = generator.generate_json(ascii_lines, meta)
            ext = ".json"
        else: # txt
            output_content = generator.generate_text(ascii_lines)
            ext = ".txt"

        # Save
        filename = Path(img_path).stem
        out_path = os.path.join(args.output_dir, f"{filename}{ext}")
        generator.save_file(output_content, out_path)
        print(f"Saved to {out_path}")

def process_video(args, config):
    cap = cv2.VideoCapture(args.input)
    if not cap.isOpened():
        print("Error opening video stream or file")
        return

    processor = ImageProcessor()
    converter = AsciiConverter(char_set=args.charset)
    generator = OutputGenerator()

    # Calculate FPS
    fps = cap.get(cv2.CAP_PROP_FPS)
    frame_delay = 1.0 / fps if fps > 0 else 0.1

    try:
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            # Convert OpenCV frame (BGR) to PIL Image (RGB)
            img = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            pil_img = Image.fromarray(img)

            # Minimal preprocessing for speed
            resized_img = processor.resize_for_ascii(pil_img, width=args.width)
            ascii_lines, colors = converter.convert_image(resized_img, color_mode=args.color_mode)

            # Clear screen and print
            output = generator.generate_terminal(ascii_lines, colors, args.color_mode)
            # ANSI clear screen
            sys.stdout.write("\033[2J\033[H")
            sys.stdout.write(output)
            sys.stdout.flush()

            time.sleep(frame_delay)
    except KeyboardInterrupt:
        print("\nStopped.")
    finally:
        cap.release()

def main():
    parser = argparse.ArgumentParser(description="Advanced ASCII Art Generator")

    # Input/Output
    parser.add_argument('-i', '--input', required=True, help="Input image path, folder, or video")
    parser.add_argument('-o', '--output-dir', default=".", help="Output directory")
    parser.add_argument('-w', '--width', type=int, default=100, help="Output width in characters")
    parser.add_argument('--format', choices=['text', 'html', 'terminal', 'json'], default='terminal')
    parser.add_argument('--config', help="Path to config file")

    # Character and Color
    parser.add_argument('--charset', choices=['simple', 'detailed', 'block', 'braille'], default='detailed')
    parser.add_argument('--custom-chars', help="Custom string of characters")
    parser.add_argument('--color-mode', choices=['grayscale', 'ansi256', 'truecolor'], default='grayscale')

    # Preprocessing
    parser.add_argument('--contrast', type=float, default=1.0)
    parser.add_argument('--brightness', type=float, default=1.0)
    parser.add_argument('--sharpness', type=float, default=1.0)
    parser.add_argument('--dither', action='store_true', help="Apply Floyd-Steinberg dithering")
    parser.add_argument('--edge', action='store_true', help="Edge detection")

    # Transform
    parser.add_argument('--invert', action='store_true', help="Invert colors")
    parser.add_argument('--mirror', action='store_true', help="Horizontal flip")
    parser.add_argument('--flip', action='store_true', help="Vertical flip")

    # Extra
    parser.add_argument('--compare', action='store_true', help="Show original image in HTML output")

    args = parser.parse_args()
    config = load_config(args.config)

    # Video check
    ext = os.path.splitext(args.input)[1].lower()
    if ext in ['.mp4', '.avi', '.mov', '.mkv']:
        process_video(args, config)
    elif os.path.isdir(args.input):
        # Batch processing
        files = [os.path.join(args.input, f) for f in os.listdir(args.input)
                 if f.lower().endswith(('.png', '.jpg', '.jpeg', '.bmp', '.gif'))]
        for f in tqdm(files, desc="Processing Images"):
            process_single_image(args, config, f)
    else:
        # Single Image
        process_single_image(args, config, args.input)

if __name__ == "__main__":
    main()