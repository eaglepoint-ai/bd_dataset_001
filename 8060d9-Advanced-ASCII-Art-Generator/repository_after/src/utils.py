import os
import yaml
from typing import Dict, Any, Optional

DEFAULT_CONFIG = {
    "width": 100,
    "mode": "detailed",
    "color": "grayscale",
    "preprocess": {"contrast": 1.0, "brightness": 1.0, "sharpness": 1.0},
}

def load_config(config_path: Optional[str]) -> Dict[str, Any]:
    """Loads configuration from a YAML/JSON file."""
    config = DEFAULT_CONFIG.copy()
    if config_path and os.path.exists(config_path):
        try:
            with open(config_path, 'r') as f:
                user_config = yaml.safe_load(f)
                if user_config:
                    config.update(user_config)
        except Exception as e:
            print(f"Warning: Could not load config file: {e}")
    return config

def validate_path(path: str) -> bool:
    """Checks if a file path exists."""
    return os.path.exists(path)