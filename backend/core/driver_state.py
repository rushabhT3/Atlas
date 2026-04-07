from dataclasses import dataclass
from collections.abc import Sequence
from .config import FMCSARegulations


@dataclass
class LogEntry:
    """Represents a single log entry"""

    status: str
    start: float
    end: float
    location: str
    remarks: str


@dataclass
class StopInfo:
    """Represents a stop location with metadata"""

    coords: str
    type: str
    remark: str
    time: float
    duration: float


class DriverState:
    """Tracks driver's current state according to FMCSA regulations"""

    def __init__(self, regulations: FMCSARegulations, initial_cycle_used: float = 0.0):
        self.regulations = regulations
        self.cycle_used = initial_cycle_used
        self.drive_clock = 0.0
        self.window_clock = 0.0
        self.since_break_clock = 0.0
        self.miles_since_fuel = 0.0
        self.current_time = 6.0  # Start at 6:00 AM

        # Track logs and stops
        self.logs: Sequence[LogEntry] = []
        self.stops: Sequence[StopInfo] = []

    def add_event(
        self,
        status: str,
        duration: float,
        location: str,
        remarks: str,
        stop_type: str = None,
    ):
        """Add an event and update driver state"""
        duration = max(0, duration)
        start_time = self.current_time
        end_time = self.current_time + duration

        # Create log entry
        log_entry = LogEntry(
            status=status,
            start=round(start_time, 3),
            end=round(end_time, 3),
            location=location,
            remarks=remarks,
        )
        self.logs.append(log_entry)

        # Add stop if specified
        if stop_type:
            stop_info = StopInfo(
                coords=location,
                type=stop_type,
                remark=remarks,
                time=round(start_time, 3),
                duration=round(duration, 3),
            )
            self.stops.append(stop_info)

        # Update time
        self.current_time = end_time

        # Update clocks based on status
        self._update_clocks(status, duration)

    def _update_clocks(self, status: str, duration: float):
        """Update driver clocks based on event status"""
        if status == self.regulations.DRIVING_STATUS:
            self.drive_clock += duration
            self.since_break_clock += duration
            self.cycle_used += duration
            self.window_clock += duration
        elif status == self.regulations.ON_DUTY_STATUS:
            self.cycle_used += duration
            self.window_clock += duration
            if duration >= 0.5:
                self.since_break_clock = 0
        elif status in [
            self.regulations.OFF_DUTY_STATUS,
            self.regulations.SLEEPER_STATUS,
        ]:
            self.window_clock += duration
            if duration >= 0.5:
                self.since_break_clock = 0
            if duration >= 10.0:
                self.drive_clock = 0
                self.window_clock = 0
                self.since_break_clock = 0
            if duration >= 34.0:
                self.cycle_used = 0

    def get_available_driving_time(self) -> float:
        """Get remaining driving time before hitting 11-hour limit"""
        return max(0, self.regulations.MAX_DRIVE_TIME - self.drive_clock)

    def get_available_duty_time(self) -> float:
        """Get remaining duty window time before hitting 14-hour limit"""
        return max(0, self.regulations.MAX_DUTY_WINDOW - self.window_clock)

    def get_time_until_break(self) -> float:
        """Get time until 30-minute break is required"""
        return max(0, self.regulations.BREAK_REQUIRED_AFTER - self.since_break_clock)

    def get_remaining_cycle_time(self) -> float:
        """Get remaining time in 70-hour cycle"""
        return max(0, self.regulations.MAX_CYCLE_LIMIT - self.cycle_used)

    def get_time_until_fuel(self, avg_speed: float) -> float:
        """Get time until fuel stop is required"""
        miles_until_fuel = max(
            0, self.regulations.FUEL_INTERVAL - self.miles_since_fuel
        )
        return miles_until_fuel / avg_speed if avg_speed > 0 else 0

    def needs_rest(self) -> bool:
        """Check if driver needs to take a rest period"""
        return (
            self.get_available_driving_time() <= 0.001
            or self.get_available_duty_time() <= 0.001
        )

    def needs_break(self) -> bool:
        """Check if driver needs a 30-minute break"""
        return self.get_time_until_break() <= 0.001

    def needs_fuel(self, avg_speed: float) -> bool:
        """Check if driver needs fuel"""
        return self.get_time_until_fuel(avg_speed) <= 0.001

    def needs_cycle_reset(self) -> bool:
        """Check if driver needs a 34-hour restart"""
        return self.get_remaining_cycle_time() <= 0.001

    def add_miles_driven(self, miles: float):
        """Add miles driven since last fuel stop"""
        self.miles_since_fuel += miles

    def reset_fuel_counter(self):
        """Reset fuel counter after fueling"""
        self.miles_since_fuel = 0

    def get_summary_stats(self) -> dict[str, float]:
        """Get summary statistics for the trip"""
        total_drive = sum(
            log.end - log.start
            for log in self.logs
            if log.status == self.regulations.DRIVING_STATUS
        )
        total_rest = sum(
            log.end - log.start
            for log in self.logs
            if log.status
            in [self.regulations.OFF_DUTY_STATUS, self.regulations.SLEEPER_STATUS]
        )
        total_on_duty = sum(
            log.end - log.start
            for log in self.logs
            if log.status == self.regulations.ON_DUTY_STATUS
        )
        trip_duration = self.current_time - 6.0

        return {
            "total_drive_time": round(total_drive, 1),
            "total_rest_time": round(total_rest, 1),
            "total_on_duty_time": round(total_on_duty, 1),
            "total_trip_time": round(trip_duration, 1),
            "num_stops": len(self.stops),
            "num_days": max(1, int(self.current_time / 24) + 1),
        }
