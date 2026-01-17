"""
Packet wrapper class that abstracts scapy implementation details.
"""

from typing import Optional, Tuple, List, Dict, Any
from dataclasses import dataclass
from enum import Enum


class Protocol(Enum):
    """Supported network protocols."""
    TCP = "TCP"
    UDP = "UDP"
    ICMP = "ICMP"
    UNKNOWN = "UNKNOWN"


@dataclass
class PacketInfo:
    """
    Data class containing extracted packet information.
    """
    source_ip: Optional[str]
    destination_ip: Optional[str]
    source_port: Optional[int]
    destination_port: Optional[int]
    protocol: Protocol
    timestamp: float
    length: int
    header_length: int
    flags: List[str]
    payload_length: int
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert packet info to dictionary."""
        return {
            "source_ip": self.source_ip,
            "destination_ip": self.destination_ip,
            "source_port": self.source_port,
            "destination_port": self.destination_port,
            "protocol": self.protocol.value if self.protocol != Protocol.UNKNOWN else None,
            "timestamp": self.timestamp,
        }


class Packet:
    """
    Wrapper class for network packets that abstracts scapy details.
    
    This class provides a clean interface for packet analysis without
    requiring direct interaction with scapy in consumer code.
    """
    
    # Lazy-loaded scapy classes
    _IP = None
    _TCP = None
    _UDP = None
    _ICMP = None
    
    @classmethod
    def _load_scapy(cls):
        """Lazy-load scapy classes."""
        if cls._IP is None:
            from scapy.layers.inet import IP, TCP, UDP, ICMP
            cls._IP = IP
            cls._TCP = TCP
            cls._UDP = UDP
            cls._ICMP = ICMP
    
    @property
    def IP(self):
        self._load_scapy()
        return self._IP
    
    @property
    def TCP(self):
        self._load_scapy()
        return self._TCP
    
    @property
    def UDP(self):
        self._load_scapy()
        return self._UDP
    
    @property
    def ICMP(self):
        self._load_scapy()
        return self._ICMP
    
    def __init__(self, raw_packet):
        """
        Initialize the Packet wrapper.
        
        Args:
            raw_packet: A scapy packet object
        """
        self._raw = raw_packet
        self._info: Optional[PacketInfo] = None
    
    @property
    def raw(self):
        """Access the underlying scapy packet (for advanced use cases)."""
        return self._raw
    
    @property
    def info(self) -> PacketInfo:
        """Get extracted packet information (lazily computed)."""
        if self._info is None:
            self._info = self._extract_info()
        return self._info
    
    def _extract_info(self) -> PacketInfo:
        """Extract all relevant information from the packet."""
        return PacketInfo(
            source_ip=self.source_ip,
            destination_ip=self.destination_ip,
            source_port=self.source_port,
            destination_port=self.destination_port,
            protocol=self.protocol,
            timestamp=self.timestamp,
            length=self.length,
            header_length=self.header_length,
            flags=self.flags,
            payload_length=self.payload_length,
        )
    
    @property
    def has_ip_layer(self) -> bool:
        """Check if packet has IP layer."""
        return self._raw.haslayer("IP")
    
    @property
    def has_tcp_layer(self) -> bool:
        """Check if packet has TCP layer."""
        return self._raw.haslayer(self.TCP)
    
    @property
    def has_udp_layer(self) -> bool:
        """Check if packet has UDP layer."""
        return self._raw.haslayer(self.UDP)
    
    @property
    def has_icmp_layer(self) -> bool:
        """Check if packet has ICMP layer."""
        return self._raw.haslayer(self.ICMP)
    
    @property
    def source_ip(self) -> Optional[str]:
        """Get source IP address."""
        if self.has_ip_layer:
            return self._raw["IP"].src
        return None
    
    @property
    def destination_ip(self) -> Optional[str]:
        """Get destination IP address."""
        if self.has_ip_layer:
            return self._raw["IP"].dst
        return None
    
    @property
    def ip_addresses(self) -> Tuple[Optional[str], Optional[str]]:
        """Get source and destination IP addresses as a tuple."""
        return self.source_ip, self.destination_ip
    
    @property
    def protocol(self) -> Protocol:
        """Determine the protocol of the packet."""
        if self.has_tcp_layer:
            return Protocol.TCP
        elif self.has_udp_layer:
            return Protocol.UDP
        elif self.has_icmp_layer:
            return Protocol.ICMP
        return Protocol.UNKNOWN
    
    @property
    def protocol_str(self) -> Optional[str]:
        """Get protocol as string for compatibility."""
        proto = self.protocol
        return proto.value if proto != Protocol.UNKNOWN else None
    
    @property
    def source_port(self) -> Optional[int]:
        """Get source port."""
        proto = self.protocol
        if proto == Protocol.TCP and self.has_tcp_layer:
            return self._raw[self.TCP].sport
        elif proto == Protocol.UDP and self.has_udp_layer:
            return self._raw[self.UDP].sport
        return None
    
    @property
    def destination_port(self) -> Optional[int]:
        """Get destination port."""
        proto = self.protocol
        if proto == Protocol.TCP and self.has_tcp_layer:
            return self._raw[self.TCP].dport
        elif proto == Protocol.UDP and self.has_udp_layer:
            return self._raw[self.UDP].dport
        return None
    
    @property
    def ports(self) -> Tuple[Optional[int], Optional[int]]:
        """Get source and destination ports as a tuple."""
        return self.source_port, self.destination_port
    
    @property
    def timestamp(self) -> float:
        """Get packet timestamp."""
        return float(self._raw.time)
    
    @property
    def length(self) -> int:
        """Get total packet length."""
        if self.has_ip_layer:
            return self._raw["IP"].len
        return 0
    
    @property
    def header_length(self) -> int:
        """Get IP header length in bytes."""
        if self.has_ip_layer:
            return self._raw["IP"].ihl * 4
        return 0
    
    @property
    def tcp_flags_raw(self) -> Optional[int]:
        """Get raw TCP flags value."""
        if self.has_tcp_layer:
            return self._raw[self.TCP].flags
        return None
    
    @property
    def flags(self) -> List[str]:
        """Get TCP flags as a list of flag names."""
        if not self.has_tcp_layer:
            return []
        
        flags_value = self._raw[self.TCP].flags
        flags_list = []
        
        flag_map = {
            0x01: "FIN",
            0x02: "SYN",
            0x04: "RST",
            0x08: "PSH",
            0x10: "ACK",
            0x20: "URG",
            0x40: "ECE",
            0x80: "CWR",
        }
        
        for bit, name in flag_map.items():
            if flags_value & bit:
                flags_list.append(name)
        
        return flags_list
    
    @property
    def tcp_flags_str(self) -> Optional[str]:
        """Get TCP flags as a string representation."""
        if self.has_tcp_layer:
            return str(self._raw[self.TCP].flags)
        return None
    
    @property
    def payload_length(self) -> int:
        """Get the payload/segment length."""
        proto = self.protocol
        if proto == Protocol.TCP and self.has_tcp_layer:
            return len(bytes(self._raw[self.TCP].payload))
        elif proto == Protocol.UDP and self.has_udp_layer:
            return len(bytes(self._raw[self.UDP].payload))
        elif proto == Protocol.ICMP and self.has_icmp_layer:
            return len(bytes(self._raw[self.ICMP].payload))
        return 0
    
    def has_flag(self, flag: str) -> bool:
        """Check if packet has a specific TCP flag."""
        return flag.upper() in self.flags
    
    def is_syn(self) -> bool:
        """Check if packet is a SYN packet."""
        return self.tcp_flags_str == "S"
    
    def is_ack(self) -> bool:
        """Check if packet is an ACK packet."""
        return self.tcp_flags_str == "A"
    
    def is_fin(self) -> bool:
        """Check if packet is a FIN packet."""
        return self.tcp_flags_str == "F"
    
    def is_rst(self) -> bool:
        """Check if packet is a RST packet."""
        return self.tcp_flags_str == "R"
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert packet to dictionary representation."""
        return self.info.to_dict()
    
    def __repr__(self) -> str:
        return (
            f"Packet(src={self.source_ip}:{self.source_port}, "
            f"dst={self.destination_ip}:{self.destination_port}, "
            f"proto={self.protocol.value})"
        )

