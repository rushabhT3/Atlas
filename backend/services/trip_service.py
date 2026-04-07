from apps.trips import TripPlanner


def process_trip_request(data):
    """Process trip planning request data"""
    # Validate required fields
    required_fields = ['current', 'pickup', 'dropoff']
    for field in required_fields:
        if not data.get(field):
            return {"error": f"Missing required field: {field}"}, 400

    try:
        # Process the trip planning
        trip_planner = TripPlanner()
        result = trip_planner.plan_trip(
            current_loc=data.get('current'),
            pickup_loc=data.get('pickup'),
            dropoff_loc=data.get('dropoff'),
            cycle_used_input=data.get('cycle', 0)
        )

        # Check for errors in the result
        if "error" in result:
            return result, 400

        return result, 200

    except Exception as e:
        return {"error": f"Internal server error: {str(e)}"}, 500
