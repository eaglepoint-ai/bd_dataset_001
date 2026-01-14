import json
import os
import html
from typing import List, Tuple
from .color_handler import ColorHandler
from PIL import Image
import io
import base64

class OutputGenerator:
    """Generates various output formats."""

    @staticmethod
    def generate_text(ascii_lines: List[str]) -> str:
        return "\n".join(ascii_lines)

    @staticmethod
    def generate_terminal(ascii_lines: List[str], colors: List[List[Tuple]], mode: str) -> str:
        output = []
        for y, line in enumerate(ascii_lines):
            row_str = ""
            for x, char in enumerate(line):
                prefix = ""
                if colors and y < len(colors) and x < len(colors[y]):
                    r, g, b = colors[y][x]
                    if mode == 'ansi256':
                        prefix = ColorHandler.rgb_to_ansi_256(r, g, b)
                    elif mode == 'truecolor':
                        prefix = ColorHandler.rgb_to_ansi(r, g, b)

                row_str += f"{prefix}{char}"
            output.append(row_str + ColorHandler.get_reset_code())
        return "\n".join(output)

    @staticmethod
    def generate_html(ascii_lines: List[str], colors: List[List[Tuple]],
                      original_image: Image.Image = None, comparison: bool = False) -> str:

        # Base template
        html_content = """
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { background-color: #1a1a1a; color: #f0f0f0; font-family: 'Courier New', monospace; white-space: pre; line-height: 0.6; }
                .container { display: flex; gap: 20px; padding: 20px; }
                .ascii-art { font-size: 8px; overflow-x: auto; }
                .original { max-width: 50%; }
                img { width: 100%; height: auto; }
            </style>
        </head>
        <body>
        <div class="container">
        """

        # Comparison view logic
        if comparison and original_image:
            img_byte_arr = io.BytesIO()
            original_image.save(img_byte_arr, format='PNG')
            img_b64 = base64.b64encode(img_byte_arr.getvalue()).decode('utf-8')
            html_content += f'<div class="original"><img src="data:image/png;base64,{img_b64}" /></div>'

        html_content += '<div class="ascii-art">'

        for y, line in enumerate(ascii_lines):
            for x, char in enumerate(line):
                color_style = ""
                if colors and y < len(colors) and x < len(colors[y]):
                    r, g, b = colors[y][x]
                    hex_color = ColorHandler.rgb_to_html(r, g, b)
                    color_style = f"color: {hex_color};"

                # Escape HTML chars
                safe_char = html.escape(char)
                html_content += f'<span style="{color_style}">{safe_char}</span>'
            html_content += "<br>"

        html_content += "</div></div></body></html>"
        return html_content

    @staticmethod
    def save_file(content: str, path: str):
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)

    @staticmethod
    def generate_json(ascii_lines: List[str], metadata: dict) -> str:
        data = {
            "metadata": metadata,
            "content": ascii_lines
        }
        return json.dumps(data, indent=2)