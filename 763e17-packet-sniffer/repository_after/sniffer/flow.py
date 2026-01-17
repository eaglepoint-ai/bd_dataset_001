"""
Flow and FlowManager classes for tracking network sessions.
"""

from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field
import ipaddress

from sniffer.packet import Packet, Protocol
from sniffer.config import Config, default_config


@dataclass
class FlowData:
    """
    Data class representing a network flow session.
    """
    flow_id: int
    source_ip: str
    destination_ip: str
    protocol: str
    source_port: Optional[int]
    destination_port: Optional[int]
    
    # Flow state
    is_complete: bool = False
    
    # Timestamps
    timestamps: List[float] = field(default_factory=list)
    forward_packet_times: List[float] = field(default_factory=list)
    backward_packet_times: List[float] = field(default_factory=list)
    
    # Flags
    flags: List[List[str]] = field(default_factory=list)
    forward_packet_flags: List[List[str]] = field(default_factory=list)
    backward_packet_flags: List[List[str]] = field(default_factory=list)
    
    # Lengths
    forward_packet_lengths: List[int] = field(default_factory=list)
    backward_packet_lengths: List[int] = field(default_factory=list)
    
    # Header lengths
    forward_packet_ihl: List[int] = field(default_factory=list)
    backward_packet_ihl: List[int] = field(default_factory=list)
    
    # Segments
    forward_segments: List[int] = field(default_factory=list)
    backward_segments: List[int] = field(default_factory=list)
    
    # Direction tracking
    packet_directions: List[str] = field(default_factory=list)
    packet_ihl: List[int] = field(default_factory=list)
    packet_segments: List[int] = field(default_factory=list)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert flow data to dictionary representation."""
        return {
            "source_ip": self.source_ip,
            "destination_ip": self.destination_ip,
            "protocol": self.protocol,
            "source_port": self.source_port,
            "destination_port": self.destination_port,
            "flags": self.flags,
            "isComplete": self.is_complete,
            "forward_packet_flag": self.forward_packet_flags,
            "backward_packet_flag": self.backward_packet_flags,
            "timestamp": self.timestamps,
            "forward_packet_time": self.forward_packet_times,
            "backward_packet_time": self.backward_packet_times,
            "forward_packet_length": self.forward_packet_lengths,
            "backward_packet_length": self.backward_packet_lengths,
            "forward_packet_ihl": self.forward_packet_ihl,
            "backward_packet_ihl": self.backward_packet_ihl,
            "for_segment": self.forward_segments,
            "back_segment": self.backward_segments,
            "packet_dir": self.packet_directions,
            "packet_ihl": self.packet_ihl,
            "packet_seg": self.packet_segments,
        }


class Flow:
    """
    Represents a network flow session.
    
    A flow is a sequence of packets between two endpoints that share
    the same 5-tuple (src_ip, dst_ip, src_port, dst_port, protocol).
    """
    
    def __init__(self, flow_id: int, packet: Packet, config: Config = None):
        """
        Initialize a new flow from a packet.
        
        Args:
            flow_id: Unique identifier for this flow
            packet: Initial packet that starts the flow
            config: Configuration instance
        """
        self.config = config or default_config
        self._data = FlowData(
            flow_id=flow_id,
            source_ip=packet.source_ip,
            destination_ip=packet.destination_ip,
            protocol=packet.protocol_str or "UNKNOWN",
            source_port=packet.source_port,
            destination_port=packet.destination_port,
        )
        
        # Add initial packet data
        self._add_packet_data(packet)
    
    @property
    def data(self) -> FlowData:
        """Get the flow data."""
        return self._data
    
    @property
    def flow_id(self) -> int:
        """Get flow ID."""
        return self._data.flow_id
    
    @property
    def is_complete(self) -> bool:
        """Check if flow is complete."""
        return self._data.is_complete
    
    @is_complete.setter
    def is_complete(self, value: bool):
        """Set flow completion status."""
        self._data.is_complete = value
    
    @property
    def start_time(self) -> Optional[float]:
        """Get flow start time."""
        if self._data.timestamps:
            return self._data.timestamps[0]
        return None
    
    @property
    def last_time(self) -> Optional[float]:
        """Get last packet time in flow."""
        if self._data.timestamps:
            return self._data.timestamps[-1]
        return None
    
    def _determine_direction(self, source: str, destination: str) -> bool:
        """
        Determine packet direction within flow.
        
        Returns:
            True if forward direction, False if backward
        """
        src_bytes = ipaddress.ip_address(source).packed
        dst_bytes = ipaddress.ip_address(destination).packed
        
        for src_byte, dst_byte in zip(src_bytes, dst_bytes):
            if src_byte != dst_byte:
                if src_byte > dst_byte:
                    return False
                break
        
        return True
    
    def _check_end_flow(self, flags: List[str]) -> bool:
        """Check if flags indicate end of flow."""
        if flags:
            return "FIN" in flags or "RST" in flags
        return False
    
    def _add_packet_data(self, packet: Packet):
        """Add packet data to flow."""
        self._data.timestamps.append(packet.timestamp)
        self._data.flags.append(packet.flags)
        
        is_forward = self._determine_direction(packet.source_ip, packet.destination_ip)
        
        if is_forward:
            self._data.forward_packet_flags.append(packet.flags)
            self._data.forward_packet_times.append(packet.timestamp)
            self._data.forward_packet_lengths.append(packet.length)
            self._data.forward_packet_ihl.append(packet.header_length)
            self._data.forward_segments.append(packet.payload_length)
            self._data.packet_directions.append("FOR")
        else:
            self._data.backward_packet_flags.append(packet.flags)
            self._data.backward_packet_times.append(packet.timestamp)
            self._data.backward_packet_lengths.append(packet.length)
            self._data.backward_packet_ihl.append(packet.header_length)
            self._data.backward_segments.append(packet.payload_length)
            self._data.packet_directions.append("BACK")
        
        self._data.packet_ihl.append(packet.header_length)
        self._data.packet_segments.append(packet.payload_length)
        
        # Check if flow should end
        if self._check_end_flow(packet.flags):
            self._data.is_complete = True
    
    def add_packet(self, packet: Packet) -> bool:
        """
        Add a packet to this flow.
        
        Args:
            packet: Packet to add
            
        Returns:
            True if packet was added, False if flow is complete
        """
        if self._data.is_complete:
            return False
        
        self._add_packet_data(packet)
        return True
    
    def matches(self, packet: Packet) -> bool:
        """
        Check if a packet belongs to this flow.
        
        Args:
            packet: Packet to check
            
        Returns:
            True if packet matches this flow
        """
        if self._data.is_complete:
            return False
        
        # Check protocol
        if packet.protocol_str != self._data.protocol:
            return False
        
        # Check IP addresses (bidirectional)
        src_match = (
            packet.source_ip == self._data.source_ip or 
            packet.source_ip == self._data.destination_ip
        )
        dst_match = (
            packet.destination_ip == self._data.source_ip or 
            packet.destination_ip == self._data.destination_ip
        )
        
        if not (src_match and dst_match):
            return False
        
        # Check ports (bidirectional)
        sport_match = (
            packet.source_port == self._data.source_port or 
            packet.source_port == self._data.destination_port
        )
        dport_match = (
            packet.destination_port == self._data.source_port or 
            packet.destination_port == self._data.destination_port
        )
        
        return sport_match and dport_match
    
    def check_activity_timeout(self, current_time: float) -> bool:
        """
        Check if flow has exceeded activity timeout.
        
        Args:
            current_time: Current packet timestamp
            
        Returns:
            True if flow has timed out
        """
        if self.start_time is None:
            return False
        return current_time - self.start_time >= self.config.active_timeout
    
    def check_inactivity_timeout(self, current_time: float) -> bool:
        """
        Check if flow has exceeded inactivity timeout.
        
        Args:
            current_time: Current packet timestamp
            
        Returns:
            True if flow is inactive
        """
        if self.last_time is None:
            return False
        return current_time - self.last_time >= self.config.inactivity_timeout
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert flow to dictionary representation."""
        return self._data.to_dict()
    
    def __repr__(self) -> str:
        return (
            f"Flow(id={self.flow_id}, "
            f"{self._data.source_ip}:{self._data.source_port} -> "
            f"{self._data.destination_ip}:{self._data.destination_port}, "
            f"proto={self._data.protocol}, complete={self.is_complete})"
        )


class FlowManager:
    """
    Manages network flow sessions.
    
    This class handles the creation, tracking, and expiration of network flows.
    """
    
    def __init__(self, config: Config = None):
        """
        Initialize the FlowManager.
        
        Args:
            config: Configuration instance
        """
        self.config = config or default_config
        self._flows: Dict[int, Flow] = {}
        self._next_id = 1
    
    @property
    def flows(self) -> Dict[int, Flow]:
        """Get all flows."""
        return self._flows
    
    @property
    def active_flows(self) -> List[Flow]:
        """Get list of active (non-complete) flows."""
        return [f for f in self._flows.values() if not f.is_complete]
    
    @property
    def completed_flows(self) -> List[Flow]:
        """Get list of completed flows."""
        return [f for f in self._flows.values() if f.is_complete]
    
    def _find_matching_flow(self, packet: Packet) -> Optional[Flow]:
        """Find an existing flow that matches the packet."""
        for flow in self._flows.values():
            if flow.matches(packet):
                return flow
        return None
    
    def process_packet(self, packet: Packet) -> Optional[Dict[str, Any]]:
        """
        Process a packet and update/create flows accordingly.
        
        Args:
            packet: Packet to process
            
        Returns:
            Flow data dictionary if a flow completed, None otherwise
        """
        if not packet.has_ip_layer:
            return None
        
        # Find existing flow
        flow = self._find_matching_flow(packet)
        
        if flow is not None:
            # Check for activity timeout
            if flow.check_activity_timeout(packet.timestamp):
                flow.is_complete = True
                return flow.to_dict()
            
            # Add packet to existing flow
            flow.add_packet(packet)
            
            if flow.is_complete:
                return flow.to_dict()
        else:
            # Check for inactivity timeout on other flows
            for existing_flow in self.active_flows:
                if existing_flow.check_inactivity_timeout(packet.timestamp):
                    existing_flow.is_complete = True
                    # Create new flow and return the timed out one
                    self._create_new_flow(packet)
                    return existing_flow.to_dict()
            
            # Create new flow
            new_flow = self._create_new_flow(packet)
            
            if new_flow.is_complete:
                return new_flow.to_dict()
        
        return None
    
    def _create_new_flow(self, packet: Packet) -> Flow:
        """Create a new flow from a packet."""
        flow = Flow(self._next_id, packet, self.config)
        self._flows[self._next_id] = flow
        self._next_id += 1
        return flow
    
    def get_flow(self, flow_id: int) -> Optional[Flow]:
        """Get a flow by ID."""
        return self._flows.get(flow_id)
    
    def remove_flow(self, flow_id: int) -> bool:
        """Remove a flow by ID."""
        if flow_id in self._flows:
            del self._flows[flow_id]
            return True
        return False
    
    def clear_completed(self):
        """Remove all completed flows."""
        completed_ids = [f.flow_id for f in self.completed_flows]
        for flow_id in completed_ids:
            del self._flows[flow_id]
    
    def clear_all(self):
        """Clear all flows."""
        self._flows.clear()
        self._next_id = 1
    
    def __len__(self) -> int:
        return len(self._flows)
    
    def __repr__(self) -> str:
        return f"FlowManager(total={len(self)}, active={len(self.active_flows)})"

