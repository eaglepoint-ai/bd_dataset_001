"""
Feature extraction for flow analysis.
"""

from typing import Dict, Any, Tuple, Optional

from sniffer.analysis.statistics import StatisticsCalculator
from sniffer.analysis.flags import FlagAnalyzer


class FeatureCalculator:
    """
    Calculates features from network flows for ML classification.
    
    This class extracts statistical features from flow data that can
    be used for machine learning-based traffic classification.
    """
    
    # Column mapping for model input
    COLUMN_MAPPING = {
        "for_seg_min": "Fwd Seg Size Min",
        "for_pkt_len_std": "Fwd Pkt Len Std",
        "back_iat_mean": "Bwd IAT Mean",
        "init_for_win_bytes": "Init Fwd Win Byts",
        "destination_port": "Dst Port",
        "back_packets": "Bwd Pkts/s",
        "back_len_max": "Bwd Pkt Len Max",
        "FIN_flag_count": "FIN Flag Cnt",
        "for_header_len": "Fwd Header Len",
        "for_PSH_flag": "Fwd PSH Flags",
        "SYN_flag_count": "SYN Flag Cnt",
        "flow_iat_std": "Flow IAT Std",
        "tot_back_pkt": "Tot Bwd Pkts",
        "flow_iat_mean": "Flow IAT Mean",
        "tot_len_back_pkt": "TotLen Bwd Pkts",
        "URG_flag_count": "URG Flag Cnt",
        "init_back_win_bytes": "Init Bwd Win Byts",
        "back_pkt_len_std": "Bwd Pkt Len Std",
        "back_pkt_len_mean": "Bwd Pkt Len Mean",
    }
    
    def __init__(self):
        """Initialize the FeatureCalculator."""
        self.stats = StatisticsCalculator()
        self.flags = FlagAnalyzer()
    
    def calculate(self, flow: Dict[str, Any]) -> Tuple[Dict[str, Any], Dict[str, str]]:
        """
        Calculate features from a flow dictionary.
        
        Args:
            flow: Flow data dictionary
            
        Returns:
            Tuple of (renamed_features, column_mapping)
        """
        if flow is None:
            return {}, {}
        
        # Extract protocol
        protocol = flow.get("protocol", "")
        is_tcp = protocol == "TCP"
        
        # Forward segment minimum
        for_segment = flow.get("for_segment", [])
        for_seg_min = self.stats.min_value(for_segment) if for_segment else 0
        
        # Forward packet length std
        fwd_pkt_len = flow.get("forward_packet_length", [])
        for_pkt_len_std = self.stats.std(fwd_pkt_len) if fwd_pkt_len else 0
        
        # Backward IAT mean
        bwd_pkt_time = flow.get("backward_packet_time", [])
        back_iat_mean = self.stats.iat_mean(bwd_pkt_time) if bwd_pkt_time else 0
        
        # Initialize forward window bytes (placeholder)
        init_for_win_bytes = 0
        
        # Destination port
        destination_port = flow.get("destination_port", 0) or 0
        
        # Backward packets count
        bwd_pkt_flag = flow.get("backward_packet_flag", [])
        back_packets = len(bwd_pkt_flag) if is_tcp else 0
        
        # Backward length max
        bwd_pkt_len = flow.get("backward_packet_length", [])
        back_len_max = self.stats.max_value(bwd_pkt_len) if bwd_pkt_len else 0
        
        # Flag counts
        flags = flow.get("flags", [])
        fwd_flags = flow.get("forward_packet_flag", [])
        
        FIN_flag_count = self.flags.get_fin_count(flags) if is_tcp else 0
        SYN_flag_count = self.flags.get_syn_count(flags) if is_tcp else 0
        for_PSH_flag = self.flags.get_psh_count(fwd_flags) if is_tcp else 0
        URG_flag_count = self.flags.get_urg_count(fwd_flags) if is_tcp else 0
        
        # Forward header length
        fwd_ihl = flow.get("forward_packet_ihl", [])
        for_header_len = self.stats.max_value(fwd_ihl) if fwd_ihl else 0
        
        # Flow IAT calculations
        fwd_pkt_time = flow.get("forward_packet_time", [])
        flow_iat_std = self.stats.iat_std(fwd_pkt_time, bwd_pkt_time)
        flow_iat_mean = self.stats.concatenated_mean(fwd_pkt_time, bwd_pkt_time)
        
        # Total backward packets
        tot_back_pkt = len(bwd_pkt_flag)
        
        # Total backward packet length
        tot_len_back_pkt = self.stats.sum_values(bwd_pkt_len)
        
        # Initialize backward window bytes (placeholder)
        init_back_win_bytes = 0
        
        # Backward packet length stats
        back_pkt_len_std = self.stats.std(bwd_pkt_len) if bwd_pkt_len else 0
        back_pkt_len_mean = self.stats.mean(bwd_pkt_len) if bwd_pkt_len else 0
        
        # Build feature dictionary
        features = {
            "for_seg_min": for_seg_min,
            "for_pkt_len_std": for_pkt_len_std,
            "back_iat_mean": back_iat_mean,
            "init_for_win_bytes": init_for_win_bytes,
            "destination_port": destination_port,
            "back_packets": back_packets,
            "back_len_max": back_len_max,
            "FIN_flag_count": FIN_flag_count,
            "for_header_len": for_header_len,
            "for_PSH_flag": for_PSH_flag,
            "SYN_flag_count": SYN_flag_count,
            "flow_iat_std": flow_iat_std,
            "tot_back_pkt": tot_back_pkt,
            "flow_iat_mean": flow_iat_mean,
            "tot_len_back_pkt": tot_len_back_pkt,
            "URG_flag_count": URG_flag_count,
            "init_back_win_bytes": init_back_win_bytes,
            "back_pkt_len_std": back_pkt_len_std,
            "back_pkt_len_mean": back_pkt_len_mean,
        }
        
        # Rename features using column mapping
        renamed_features = {
            self.COLUMN_MAPPING[k]: v for k, v in features.items()
        }
        
        return renamed_features, self.COLUMN_MAPPING
    
    @classmethod
    def get_column_mapping(cls) -> Dict[str, str]:
        """Get the column mapping for model input."""
        return cls.COLUMN_MAPPING.copy()

