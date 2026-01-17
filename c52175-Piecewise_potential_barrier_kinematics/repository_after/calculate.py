import math

def compute_dual_zone_impact(start_height):
    """
    Computes time to impact and final velocity for an object in a dual-zone 
    gravitational field.
    
    Zone 1 (> 100m): a = +9.8 m/s^2 (Repulsive/Upward)
    Zone 2 (<= 100m): a = -9.8 m/s^2 (Attractive/Downward)
    
    Args:
        start_height (float): Initial height in meters (released from rest).
        
    Returns:
        tuple: (total_time, final_velocity)
               Returns (math.inf, None) if the object never hits the ground.
    """
    
    BOUNDARY = 100.0
    ACCEL_REPULSIVE = 9.8  # Upward acceleration
    ACCEL_ATTRACTIVE = -9.8 # Downward acceleration
    V_INITIAL = 0.0
    
    current_height = start_height
    current_velocity = V_INITIAL
    total_time = 0.0
    
    # CASE 1: Above 100m 
    if current_height > BOUNDARY:
        return math.inf, None

    # CASE 2: At or Below 100m (Attractive Zone) 
    if current_height <= BOUNDARY:
        distance_to_ground = current_height - 0 
        a_quad = 0.5 * ACCEL_ATTRACTIVE
        b_quad = current_velocity
        c_quad = current_height
        
        discriminant = (b_quad**2) - (4 * a_quad * c_quad)
        
        if discriminant < 0:
            return math.inf, None # Should not happen in attractive zone starting from rest
            
        # We need the positive time component
        t1 = (-b_quad + math.sqrt(discriminant)) / (2 * a_quad)
        t2 = (-b_quad - math.sqrt(discriminant)) / (2 * a_quad)
        
        time_phase_2 = max(t1, t2)
        
        total_time += time_phase_2
        
        final_velocity = current_velocity + (ACCEL_ATTRACTIVE * time_phase_2)
        
        return total_time, final_velocity