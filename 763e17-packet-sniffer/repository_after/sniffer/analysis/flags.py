"""
TCP flag analysis utilities.
"""

from typing import List, Optional, Dict


class FlagAnalyzer:
    """
    Analyzes TCP flags in packets and flows.
    
    This class provides methods for working with TCP flags,
    including parsing, counting, and detecting specific flag patterns.
    """
    
    # Flag bit masks
    FLAG_BITS = {
        "FIN": 0x01,
        "SYN": 0x02,
        "RST": 0x04,
        "PSH": 0x08,
        "ACK": 0x10,
        "URG": 0x20,
        "ECE": 0x40,
        "CWR": 0x80,
    }
    
    # Connection termination flags
    END_FLAGS = {"FIN", "RST"}
    
    @classmethod
    def deconstruct_flags(cls, flags_value: int) -> List[str]:
        """
        Deconstruct TCP flags from raw value to list of flag names.
        
        Args:
            flags_value: Raw TCP flags integer value
            
        Returns:
            List of flag names that are set
        """
        flags_list = []
        for flag_name, bit_mask in cls.FLAG_BITS.items():
            if flags_value & bit_mask:
                flags_list.append(flag_name)
        return flags_list
    
    @classmethod
    def count_flag(cls, flag_arrays: List[List[str]], flag: str) -> int:
        """
        Count occurrences of a specific flag across multiple packets.
        
        Args:
            flag_arrays: List of flag arrays from multiple packets
            flag: Flag name to count
            
        Returns:
            Total count of the specified flag
        """
        count = 0
        flag = flag.upper()
        for flags in flag_arrays:
            if flags is not None:
                for f in flags:
                    if f is not None and f == flag:
                        count += 1
        return count
    
    @classmethod
    def count_flags(cls, flag_arrays: List[List[str]]) -> Dict[str, int]:
        """
        Count all flags across multiple packets.
        
        Args:
            flag_arrays: List of flag arrays from multiple packets
            
        Returns:
            Dictionary mapping flag names to counts
        """
        counts = {flag: 0 for flag in cls.FLAG_BITS.keys()}
        for flags in flag_arrays:
            if flags is not None:
                for f in flags:
                    if f is not None and f in counts:
                        counts[f] += 1
        return counts
    
    @classmethod
    def is_end_of_flow(cls, flags: Optional[List[str]]) -> bool:
        """
        Check if flags indicate end of flow (FIN or RST).
        
        Args:
            flags: List of flag names
            
        Returns:
            True if flow should end
        """
        if flags is None:
            return False
        return any(f in cls.END_FLAGS for f in flags)
    
    @classmethod
    def has_flag(cls, flags: Optional[List[str]], flag: str) -> bool:
        """
        Check if a specific flag is present.
        
        Args:
            flags: List of flag names
            flag: Flag to check for
            
        Returns:
            True if flag is present
        """
        if flags is None:
            return False
        return flag.upper() in flags
    
    @classmethod
    def is_syn(cls, flags: Optional[List[str]]) -> bool:
        """Check if SYN flag is present."""
        return cls.has_flag(flags, "SYN")
    
    @classmethod
    def is_ack(cls, flags: Optional[List[str]]) -> bool:
        """Check if ACK flag is present."""
        return cls.has_flag(flags, "ACK")
    
    @classmethod
    def is_fin(cls, flags: Optional[List[str]]) -> bool:
        """Check if FIN flag is present."""
        return cls.has_flag(flags, "FIN")
    
    @classmethod
    def is_rst(cls, flags: Optional[List[str]]) -> bool:
        """Check if RST flag is present."""
        return cls.has_flag(flags, "RST")
    
    @classmethod
    def is_psh(cls, flags: Optional[List[str]]) -> bool:
        """Check if PSH flag is present."""
        return cls.has_flag(flags, "PSH")
    
    @classmethod
    def is_urg(cls, flags: Optional[List[str]]) -> bool:
        """Check if URG flag is present."""
        return cls.has_flag(flags, "URG")
    
    @classmethod
    def get_syn_count(cls, flag_arrays: List[List[str]]) -> int:
        """Get count of SYN flags."""
        return cls.count_flag(flag_arrays, "SYN")
    
    @classmethod
    def get_fin_count(cls, flag_arrays: List[List[str]]) -> int:
        """Get count of FIN flags."""
        return cls.count_flag(flag_arrays, "FIN")
    
    @classmethod
    def get_ack_count(cls, flag_arrays: List[List[str]]) -> int:
        """Get count of ACK flags."""
        return cls.count_flag(flag_arrays, "ACK")
    
    @classmethod
    def get_rst_count(cls, flag_arrays: List[List[str]]) -> int:
        """Get count of RST flags."""
        return cls.count_flag(flag_arrays, "RST")
    
    @classmethod
    def get_psh_count(cls, flag_arrays: List[List[str]]) -> int:
        """Get count of PSH flags."""
        return cls.count_flag(flag_arrays, "PSH")
    
    @classmethod
    def get_urg_count(cls, flag_arrays: List[List[str]]) -> int:
        """Get count of URG flags."""
        return cls.count_flag(flag_arrays, "URG")

