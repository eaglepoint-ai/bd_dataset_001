"""
Network sniffer for capturing packets and generating flow features.
"""

from typing import Optional, Callable, Dict, Any, Generator
import time

from sniffer.packet import Packet
from sniffer.flow import FlowManager
from sniffer.analysis.features import FeatureCalculator
from sniffer.config import Config, default_config


class FlowSniffer:
    """
    Network sniffer that captures packets and generates flow features.
    
    This class captures network packets, groups them into flows, and
    extracts features from completed flows.
    """
    
    def __init__(self, config: Config = None):
        """
        Initialize the FlowSniffer.
        
        Args:
            config: Configuration instance
        """
        self.config = config or default_config
        self.flow_manager = FlowManager(self.config)
        self.feature_calculator = FeatureCalculator()
    
    def process_packet(self, raw_packet) -> Optional[Dict[str, Any]]:
        """
        Process a single packet and return features if a flow completes.
        
        Args:
            raw_packet: Raw scapy packet
            
        Returns:
            Dictionary with flow data and features if flow completed, None otherwise
        """
        packet = Packet(raw_packet)
        
        # Process packet through flow manager
        flow_data = self.flow_manager.process_packet(packet)
        
        if flow_data is not None:
            # Calculate features for the completed flow
            features, column_mapping = self.feature_calculator.calculate(flow_data)
            
            return {
                "flow_data": flow_data,
                "features": features,
                "column_mapping": column_mapping,
                "timestamp": time.time(),
            }
        
        return None
    
    def start_sniffing(
        self, 
        callback: Callable[[Dict[str, Any]], None] = None, 
        filter_str: str = None,
        count: int = 0
    ):
        """
        Start sniffing packets (blocking).
        
        Args:
            callback: Callback function called with flow features when a flow completes
            filter_str: BPF filter string (e.g., "tcp", "port 80")
            count: Number of packets to capture (0 = infinite)
        """
        from scapy.all import sniff
        
        def packet_handler(raw_packet):
            result = self.process_packet(raw_packet)
            if result is not None:
                if callback:
                    callback(result)
                else:
                    self._default_callback(result)
        
        print(f"Starting packet capture...")
        if filter_str:
            print(f"Filter: {filter_str}")
        
        sniff(prn=packet_handler, filter=filter_str, count=count)
    
    def _default_callback(self, result: Dict[str, Any]):
        """Default callback that prints flow features."""
        flow = result["flow_data"]
        features = result["features"]
        
        print(f"\n{'='*60}")
        print(f"Flow Complete: {flow['source_ip']}:{flow['source_port']} -> "
              f"{flow['destination_ip']}:{flow['destination_port']} ({flow['protocol']})")
        print(f"Features:")
        for name, value in features.items():
            print(f"  {name}: {value}")
        print(f"{'='*60}\n")
    
    def sniff_flows(
        self, 
        filter_str: str = None, 
        count: int = 0
    ) -> Generator[Dict[str, Any], None, None]:
        """
        Generator that yields flow features as flows complete.
        
        Args:
            filter_str: BPF filter string
            count: Number of packets to capture (0 = infinite)
            
        Yields:
            Dictionary with flow data and features
        """
        from scapy.all import sniff
        
        flows_generated = []
        
        def packet_handler(raw_packet):
            result = self.process_packet(raw_packet)
            if result is not None:
                flows_generated.append(result)
        
        # Note: This is a simple implementation. For streaming,
        # consider using sniff with store=False and a queue.
        sniff(prn=packet_handler, filter=filter_str, count=count)
        
        yield from flows_generated
    
    def get_active_flow_count(self) -> int:
        """Get the number of active (incomplete) flows."""
        return len(self.flow_manager.active_flows)
    
    def get_completed_flow_count(self) -> int:
        """Get the number of completed flows."""
        return len(self.flow_manager.completed_flows)
    
    def clear_flows(self):
        """Clear all tracked flows."""
        self.flow_manager.clear_all()
    
    def __repr__(self) -> str:
        return f"FlowSniffer(active={self.get_active_flow_count()}, completed={self.get_completed_flow_count()})"
