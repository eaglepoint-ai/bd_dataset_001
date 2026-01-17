import pytest
import json
from repository_after.src.output_generator import OutputGenerator
from PIL import Image

class TestOutputGenerator:

    def test_generate_text(self):
        """Req D: Plain text."""
        lines = ["Line1", "Line2"]
        output = OutputGenerator.generate_text(lines)
        assert output == "Line1\nLine2"

    def test_generate_json(self):
        """Req D: JSON Export."""
        lines = ["A", "B"]
        meta = {"width": 10}
        json_str = OutputGenerator.generate_json(lines, meta)
        data = json.loads(json_str)

        assert data['content'] == lines
        assert data['metadata']['width'] == 10

    def test_generate_html_structure(self):
        """Req D: HTML with CSS."""
        lines = ["#"]
        colors = [[(255, 0, 0)]]
        html_out = OutputGenerator.generate_html(lines, colors)

        assert "<!DOCTYPE html>" in html_out
        assert "font-family: 'Courier New'" in html_out
        assert "color: #ff0000" in html_out

    def test_html_comparison_embedding(self, rgb_image):
        """Req D: Comparison View (Base64 embedding)."""
        lines = ["#"]
        html_out = OutputGenerator.generate_html(
            lines, [],
            original_image=rgb_image,
            comparison=True
        )
        assert "data:image/png;base64" in html_out
        assert "<img src=" in html_out