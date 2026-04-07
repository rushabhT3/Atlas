from apps.trips import TripPlanner


# Legacy function for backward compatibility
def calculate_schedule(current_loc, pickup_loc, dropoff_loc, cycle_used_input):
    """
    Legacy function - use TripPlanner.plan_trip() for new code
    """
    trip_planner = TripPlanner()
    return trip_planner.plan_trip(
        current_loc, pickup_loc, dropoff_loc, cycle_used_input
    )
