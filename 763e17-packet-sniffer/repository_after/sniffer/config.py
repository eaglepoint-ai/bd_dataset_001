"""
Configuration management for the Sniffer package.
"""

import socket
from dataclasses import dataclass
from typing import Optional


@dataclass
class Config:
    """
    Configuration class for the Flow Sniffer.
    
    Attributes:
        active_timeout: Maximum time (seconds) a flow can be active before forced completion
        inactivity_timeout: Time (seconds) of inactivity before flow expires
    """
    
    active_timeout: int = 120
    inactivity_timeout: int = 10
    
    @classmethod
    def from_dict(cls, config_dict: dict) -> "Config":
        """Create a Config instance from a dictionary."""
        return cls(**{k: v for k, v in config_dict.items() if k in cls.__dataclass_fields__})
    
    def to_dict(self) -> dict:
        """Convert config to dictionary."""
        return {
            "active_timeout": self.active_timeout,
            "inactivity_timeout": self.inactivity_timeout,
        }


# Default configuration instance
default_config = Config()
