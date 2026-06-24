from typing import Any
from django.conf import settings
from core.config import FMCSARegulations
from core.driver_state import DriverState, StopInfo
from apps.geocoding import (
    GeocodingService,
    NominatimGeocodingService,
    LocationIQGeocodingService,
)
from apps.routing import (
    RoutingService,
    OSRMRoutingService,
    LocationIQRoutingService,
    RouteInfo,
)
from apps.compliance import DrivingSimulator


class TripPlanner:
    """Main orchestrator class for trip planning and compliance calculation"""

    def __init__(
        self,
        regulations: FMCSARegulations = None,
        geocoding_service: GeocodingService = None,
        routing_service: RoutingService = None,
    ):
        """Initialize trip planner with dependency injection"""
        self.regulations = regulations or FMCSARegulations()

        # Use LocationIQ when an API key is configured (works on cloud hosts
        # like Render); otherwise fall back to the public Nominatim/OSRM demo
        # servers, which are fine for local dev but block datacenter IPs.
        api_key = getattr(settings, "LOCATIONIQ_API_KEY", "")
        self.geocoding_service = geocoding_service or (
            LocationIQGeocodingService() if api_key else NominatimGeocodingService()
        )
        self.routing_service = routing_service or (
            LocationIQRoutingService() if api_key else OSRMRoutingService()
        )

    def plan_trip(
        self,
        current_loc: str,
        pickup_loc: str,
        dropoff_loc: str,
        cycle_used_input: float = 0.0,
    ) -> dict[str, Any]:
        """
        Plan a complete trip with compliance considerations

        Args:
            current_loc: Starting location
            pickup_loc: Pickup location
            dropoff_loc: Final destination
            cycle_used_input: Hours already used in 70-hour cycle

        Returns:
            Dictionary containing logs, stops, route geometry, and summary
        """
        # Step 1: Geocode all locations
        coordinates = self._geocode_locations(current_loc, pickup_loc, dropoff_loc)
        if "error" in coordinates:
            return coordinates

        curr_coords, pick_coords, drop_coords = coordinates

        # Step 2: Get routes
        routes = self._get_routes(curr_coords, pick_coords, drop_coords)
        if "error" in routes:
            return routes

        leg1, leg2 = routes

        # Step 3: Initialize driver state and simulator
        driver_state = DriverState(self.regulations, cycle_used_input)
        simulator = DrivingSimulator(self.regulations, driver_state)

        # Step 4: Execute trip simulation
        self._execute_trip_simulation(
            driver_state, simulator, curr_coords, pick_coords, drop_coords, leg1, leg2
        )

        # Step 5: Build response
        return self._build_response(driver_state, leg1, leg2)

    def _geocode_locations(
        self, current_loc: str, pickup_loc: str, dropoff_loc: str
    ) -> tuple[str, str, str] | dict[str, str]:
        """Geocode all three locations"""
        curr_coords = self.geocoding_service.geocode(current_loc)
        pick_coords = self.geocoding_service.geocode(pickup_loc)
        drop_coords = self.geocoding_service.geocode(dropoff_loc)

        if not curr_coords:
            return {"error": f"Could not locate current location: {current_loc}"}
        if not pick_coords:
            return {"error": f"Could not locate pickup location: {pickup_loc}"}
        if not drop_coords:
            return {"error": f"Could not locate dropoff location: {dropoff_loc}"}

        return curr_coords, pick_coords, drop_coords

    def _get_routes(
        self, curr_coords: str, pick_coords: str, drop_coords: str
    ) -> tuple[RouteInfo, RouteInfo] | dict[str, str]:
        """Get routes for both legs of the trip"""
        leg1 = self.routing_service.get_route(curr_coords, pick_coords)
        if not leg1:
            return {
                "error": "Could not calculate route from Current Location to Pickup."
            }

        leg2 = self.routing_service.get_route(pick_coords, drop_coords)
        if not leg2:
            return {"error": "Could not calculate route from Pickup to Dropoff."}

        return leg1, leg2

    def _execute_trip_simulation(
        self,
        driver_state: DriverState,
        simulator: DrivingSimulator,
        curr_coords: str,
        pick_coords: str,
        drop_coords: str,
        leg1: RouteInfo,
        leg2: RouteInfo,
    ):
        """Execute the complete trip simulation"""
        # Add starting point
        driver_state.stops.append(
            StopInfo(
                coords=curr_coords,
                type="start",
                remark="Trip Start",
                time=driver_state.current_time,
                duration=0,
            )
        )

        # Pre-trip inspection
        driver_state.add_event(
            self.regulations.ON_DUTY_STATUS,
            0.25,
            curr_coords,
            "Pre-trip Inspection",
            "inspection",
        )

        # LEG 1: Current -> Pickup
        simulator.drive_leg(
            curr_coords, leg1.distance_miles, leg1.coordinates, "to Pickup"
        )

        # Pickup (1 hour loading)
        driver_state.add_event(
            self.regulations.ON_DUTY_STATUS,
            self.regulations.LOAD_UNLOAD_TIME,
            pick_coords,
            "Loading at Pickup",
            "pickup",
        )

        # LEG 2: Pickup -> Dropoff
        simulator.drive_leg(
            pick_coords, leg2.distance_miles, leg2.coordinates, "to Dropoff"
        )

        # Dropoff (1 hour unloading)
        driver_state.add_event(
            self.regulations.ON_DUTY_STATUS,
            self.regulations.LOAD_UNLOAD_TIME,
            drop_coords,
            "Unloading at Dropoff",
            "dropoff",
        )

        # End point
        driver_state.stops.append(
            StopInfo(
                coords=drop_coords,
                type="end",
                remark="Trip Complete",
                time=driver_state.current_time,
                duration=0,
            )
        )

    def _build_response(
        self, driver_state: DriverState, leg1: RouteInfo, leg2: RouteInfo
    ) -> dict[str, Any]:
        """Build the final response dictionary"""
        # Convert logs to dictionary format
        logs = [
            {
                "status": log.status,
                "start": log.start,
                "end": log.end,
                "location": log.location,
                "remarks": log.remarks,
            }
            for log in driver_state.logs
        ]

        # Convert stops to dictionary format
        stops = [
            {
                "coords": stop.coords,
                "type": stop.type,
                "remark": stop.remark,
                "time": stop.time,
                "duration": stop.duration,
            }
            for stop in driver_state.stops
        ]

        # Get summary statistics
        summary = driver_state.get_summary_stats()

        # Add route-specific summary
        summary.update(
            {
                "total_miles": round(leg1.distance_miles + leg2.distance_miles, 1),
                "leg1_miles": round(leg1.distance_miles, 1),
                "leg2_miles": round(leg2.distance_miles, 1),
            }
        )

        return {
            "logs": logs,
            "stops": stops,
            "route_geometry": {
                "leg1": {"type": "LineString", "coordinates": leg1.coordinates},
                "leg2": {"type": "LineString", "coordinates": leg2.coordinates},
            },
            "summary": summary,
        }
