"""
Statistical calculations for flow analysis.
"""

from typing import List, Union
import numpy as np


class StatisticsCalculator:
    """
    Provides statistical calculations for flow analysis.
    
    This class contains methods for calculating various statistics
    used in feature extraction for network flow analysis.
    """
    
    @staticmethod
    def mean(values: List[Union[int, float]]) -> float:
        """
        Calculate the mean of a list of values.
        
        Args:
            values: List of numeric values
            
        Returns:
            Mean value, or 0 if list is empty
        """
        if len(values) > 0:
            return float(np.mean(values))
        return 0.0
    
    @staticmethod
    def std(values: List[Union[int, float]]) -> float:
        """
        Calculate the standard deviation of a list of values.
        
        Args:
            values: List of numeric values
            
        Returns:
            Standard deviation, or 0 if list is empty
        """
        if len(values) > 0:
            return float(np.std(values))
        return 0.0
    
    @staticmethod
    def sum_values(values: List[Union[int, float]]) -> float:
        """
        Calculate the sum of a list of values.
        
        Args:
            values: List of numeric values
            
        Returns:
            Sum of values, or 0 if list is empty
        """
        if len(values) > 0:
            return float(np.sum(values))
        return 0.0
    
    @staticmethod
    def min_value(values: List[Union[int, float]]) -> float:
        """
        Get the minimum value from a list.
        
        Args:
            values: List of numeric values
            
        Returns:
            Minimum value, or 0 if list is empty
        """
        if len(values) > 0:
            return float(min(values))
        return 0.0
    
    @staticmethod
    def max_value(values: List[Union[int, float]]) -> float:
        """
        Get the maximum value from a list.
        
        Args:
            values: List of numeric values
            
        Returns:
            Maximum value, or 0 if list is empty
        """
        if len(values) > 0:
            return float(max(values))
        return 0.0
    
    @staticmethod
    def extreme_diff(values: List[Union[int, float]]) -> float:
        """
        Calculate the difference between max and min values.
        
        Args:
            values: List of numeric values
            
        Returns:
            Difference between max and min, or 0 if list is empty
        """
        if len(values) > 0:
            return float(max(values) - min(values))
        return 0.0
    
    @staticmethod
    def iat_mean(timestamps: List[float]) -> float:
        """
        Calculate the mean Inter-Arrival Time.
        
        Args:
            timestamps: List of packet timestamps
            
        Returns:
            Mean IAT, or 0 if insufficient data
        """
        if len(timestamps) > 1:
            iat = np.diff(timestamps)
            return float(np.mean(iat))
        return 0.0
    
    @staticmethod
    def iat_std(forward_times: List[float], backward_times: List[float]) -> float:
        """
        Calculate the standard deviation of combined IAT.
        
        Args:
            forward_times: List of forward packet timestamps
            backward_times: List of backward packet timestamps
            
        Returns:
            IAT standard deviation
        """
        combined = np.concatenate((forward_times, backward_times))
        if len(combined) > 1:
            sorted_times = np.sort(combined)
            return StatisticsCalculator.std(sorted_times.tolist())
        return 0.0
    
    @staticmethod
    def concatenated_mean(
        forward_times: List[float], 
        backward_times: List[float]
    ) -> float:
        """
        Calculate the mean of concatenated forward and backward timestamps.
        
        Args:
            forward_times: List of forward packet timestamps
            backward_times: List of backward packet timestamps
            
        Returns:
            Mean of combined timestamps
        """
        if len(forward_times) > 0 and len(backward_times) > 0:
            combined = np.concatenate((forward_times, backward_times))
            return float(np.mean(combined))
        elif len(forward_times) == 0 and len(backward_times) == 0:
            return 0.0
        elif len(forward_times) > 0:
            return float(np.mean(forward_times))
        else:
            return float(np.mean(backward_times))
    
    @staticmethod
    def per_second(lengths: List[int], timestamps: List[float]) -> float:
        """
        Calculate bytes per second.
        
        Args:
            lengths: List of packet lengths
            timestamps: List of timestamps
            
        Returns:
            Bytes per second
        """
        length_sum = StatisticsCalculator.sum_values(lengths)
        time_diff = StatisticsCalculator.extreme_diff(timestamps)
        if time_diff > 0:
            return length_sum / time_diff
        return 0.0

