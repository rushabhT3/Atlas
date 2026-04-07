import logging
from apps.trips import TripPlanner

logger = logging.getLogger(__name__)


def process_trip_request(data):
    """Process trip planning request data"""
    logger.info(f"Received trip request: {data}")

    # Validate required fields
    required_fields = ["current", "pickup", "dropoff"]
    for field in required_fields:
        if not data.get(field):
            error_msg = f"Missing required field: {field}"
            logger.error(error_msg)
            return {"error": error_msg}, 400

    # Log what we're passing to TripPlanner
    logger.info(
        f"Calling TripPlanner with: current={data.get('current')}, pickup={data.get('pickup')}, dropoff={data.get('dropoff')}"
    )

    try:
        # Process the trip planning
        trip_planner = TripPlanner()
        result = trip_planner.plan_trip(
            current_loc=data.get("current"),
            pickup_loc=data.get("pickup"),
            dropoff_loc=data.get("dropoff"),
            cycle_used_input=data.get("cycle", 0),
        )

        # Check for errors in the result
        if "error" in result:
            logger.error(f"TripPlanner error: {result}")
            return result, 400

        logger.info(f"Trip planning successful: {result}")
        return result, 200

    except Exception as e:
        error_msg = f"Internal server error: {str(e)}"
        logger.error(error_msg)
        return {"error": error_msg}, 500
