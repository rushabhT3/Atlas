from typing import List, Optional, Tuple
from core.config import FMCSARegulations
from core.driver_state import DriverState


class RouteInterpolator:
    """Handles interpolation along route geometry"""

    @staticmethod
    def interpolate_along_route(
        geometry_coords: List[Tuple[float, float]], fraction: float
    ) -> Optional[str]:
        """
        Get a point along the route at a given fraction (0.0 to 1.0)
        Uses LOCAL interpolation - NO API calls needed!
        """
        if not geometry_coords or len(geometry_coords) == 0:
            return None

        fraction = max(0.0, min(1.0, fraction))

        if len(geometry_coords) == 1:
            return f"{geometry_coords[0][0]},{geometry_coords[0][1]}"

        # Calculate total route length (approximate using coordinate distances)
        total_length = 0
        segment_lengths = []

        for i in range(len(geometry_coords) - 1):
            p1 = geometry_coords[i]
            p2 = geometry_coords[i + 1]
            # Simple euclidean distance (good enough for interpolation)
            seg_len = ((p2[0] - p1[0]) ** 2 + (p2[1] - p1[1]) ** 2) ** 0.5
            segment_lengths.append(seg_len)
            total_length += seg_len

        if total_length == 0:
            return f"{geometry_coords[0][0]},{geometry_coords[0][1]}"

        # Find the point at the given fraction
        target_distance = fraction * total_length
        current_distance = 0

        for i, seg_len in enumerate(segment_lengths):
            if current_distance + seg_len >= target_distance:
                # Interpolate within this segment
                seg_fraction = (
                    (target_distance - current_distance) / seg_len if seg_len > 0 else 0
                )
                p1 = geometry_coords[i]
                p2 = geometry_coords[i + 1]
                lon = p1[0] + (p2[0] - p1[0]) * seg_fraction
                lat = p1[1] + (p2[1] - p1[1]) * seg_fraction
                return f"{lon},{lat}"
            current_distance += seg_len

        # Return last point if we've gone past
        last = geometry_coords[-1]
        return f"{last[0]},{last[1]}"


class DrivingSimulator:
    """Simulates driving while respecting FMCSA regulations"""

    def __init__(self, regulations: FMCSARegulations, driver_state: DriverState):
        self.regulations = regulations
        self.driver_state = driver_state
        self.interpolator = RouteInterpolator()

    def drive_leg(
        self,
        start_coords: str,
        total_miles: float,
        geometry_coords: List[Tuple[float, float]],
        leg_name: str,
    ):
        """Simulate driving a route leg with all required stops"""
        remaining_miles = total_miles
        driven_on_leg = 0.0

        while remaining_miles > 0.5:  # 0.5 mile tolerance
            # Get current position on this leg
            fraction = driven_on_leg / total_miles if total_miles > 0 else 0
            current_pos = self._get_position(geometry_coords, fraction, start_coords)

            # Calculate time constraints
            time_constraints = self._calculate_time_constraints(
                remaining_miles, current_pos
            )

            # Determine limiting factor
            limiting_time = min(time_constraints.values())

            # If we can't drive at all, take required rest
            if limiting_time <= 0.001:
                self._handle_required_stop(current_pos)
                continue

            # Drive the limiting time or finish the leg
            if limiting_time >= time_constraints["time_to_finish"]:
                # We can finish this leg!
                self.driver_state.add_event(
                    self.regulations.DRIVING_STATUS,
                    time_constraints["time_to_finish"],
                    f"En Route ({leg_name})",
                    "Driving",
                )
                miles_driven = remaining_miles
                remaining_miles = 0
            else:
                # We need to stop for something
                miles_driven = limiting_time * self.regulations.AVG_SPEED
                self.driver_state.add_event(
                    self.regulations.DRIVING_STATUS,
                    limiting_time,
                    f"En Route ({leg_name})",
                    "Driving",
                )
                remaining_miles -= miles_driven

            driven_on_leg += miles_driven
            self.driver_state.add_miles_driven(miles_driven)

            # Handle the stop if we didn't finish
            if remaining_miles > 0.5:
                fraction = driven_on_leg / total_miles if total_miles > 0 else 1
                stop_pos = self._get_position(geometry_coords, fraction, current_pos)
                self._handle_required_stop(stop_pos)

    def _get_position(
        self,
        geometry_coords: List[Tuple[float, float]],
        fraction: float,
        fallback_coords: str,
    ) -> str:
        """Get position with proper string fallback"""
        pos = self.interpolator.interpolate_along_route(geometry_coords, fraction)
        return pos if pos else fallback_coords

    def _calculate_time_constraints(
        self, remaining_miles: float, current_pos: str
    ) -> dict[str, float]:
        """Calculate all time constraints for the current situation"""
        return {
            "time_to_finish": remaining_miles / self.regulations.AVG_SPEED,
            "time_until_11hr": self.driver_state.get_available_driving_time(),
            "time_until_14hr": self.driver_state.get_available_duty_time(),
            "time_until_8hr": self.driver_state.get_time_until_break(),
            "time_until_70hr": self.driver_state.get_remaining_cycle_time(),
            "time_until_fuel": self.driver_state.get_time_until_fuel(
                self.regulations.AVG_SPEED
            ),
        }

    def _handle_required_stop(self, current_pos: str):
        """Handle required stops based on driver state"""
        if self.driver_state.needs_cycle_reset():
            self.driver_state.add_event(
                self.regulations.OFF_DUTY_STATUS,
                self.regulations.RESTART_34,
                current_pos,
                "34-hr Restart (Cycle Reset)",
                "restart",
            )
        elif self.driver_state.needs_rest():
            self.driver_state.add_event(
                self.regulations.SLEEPER_STATUS,
                self.regulations.SLEEPER_REST,
                current_pos,
                "10-hr Sleeper Berth",
                "sleep",
            )
        elif self.driver_state.needs_break():
            self.driver_state.add_event(
                self.regulations.OFF_DUTY_STATUS,
                self.regulations.MIN_BREAK,
                current_pos,
                "30-min Break",
                "break",
            )
        elif self.driver_state.needs_fuel(self.regulations.AVG_SPEED):
            self.driver_state.add_event(
                self.regulations.ON_DUTY_STATUS, 0.5, current_pos, "Fuel Stop", "fuel"
            )
            self.driver_state.reset_fuel_counter()
