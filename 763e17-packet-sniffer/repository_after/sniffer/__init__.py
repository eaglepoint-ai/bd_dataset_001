"""
Sniffer - A Network Flow Feature Generator

This package provides tools for network packet capture,
flow tracking, and feature extraction for network traffic analysis.
"""

from sniffer.config import Config, default_config
from sniffer.packet import Packet, PacketInfo, Protocol
from sniffer.flow import Flow, FlowData, FlowManager
from sniffer.analysis.flags import FlagAnalyzer
from sniffer.analysis.features import FeatureCalculator
from sniffer.analysis.statistics import StatisticsCalculator
from sniffer.network.sniffer import FlowSniffer

__version__ = "2.0.0"
__all__ = [
    # Configuration
    "Config",
    "default_config",
    
    # Core classes
    "Packet",
    "PacketInfo",
    "Protocol",
    "Flow",
    "FlowData",
    "FlowManager",
    
    # Analysis classes
    "FlagAnalyzer",
    "FeatureCalculator",
    "StatisticsCalculator",
    
    # Sniffer
    "FlowSniffer",
]
