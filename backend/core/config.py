from dataclasses import dataclass


@dataclass
class FMCSARegulations:
    """Configuration class containing all FMCSA regulatory constants"""
    
    # Time limits (in hours)
    MAX_DRIVE_TIME: float = 11.0
    MAX_DUTY_WINDOW: float = 14.0
    BREAK_REQUIRED_AFTER: float = 8.0
    MIN_BREAK: float = 0.5
    SLEEPER_REST: float = 10.0
    RESTART_34: float = 34.0
    MAX_CYCLE_LIMIT: float = 70.0
    
    # Distance and timing constants
    FUEL_INTERVAL: float = 1000.0
    LOAD_UNLOAD_TIME: float = 1.0
    AVG_SPEED: float = 55.0
    
    # Event types
    DRIVING_STATUS = "DRIVING"
    ON_DUTY_STATUS = "ON_DUTY"
    OFF_DUTY_STATUS = "OFF_DUTY"
    SLEEPER_STATUS = "SLEEPER"

    def get_time_constraints(self) -> dict[str, float]:
        """Return all time-based constraints"""
        return {
            "max_drive_time": self.MAX_DRIVE_TIME,
            "max_duty_window": self.MAX_DUTY_WINDOW,
            "break_required_after": self.BREAK_REQUIRED_AFTER,
            "min_break": self.MIN_BREAK,
            "sleeper_rest": self.SLEEPER_REST,
            "restart_34": self.RESTART_34,
            "max_cycle_limit": self.MAX_CYCLE_LIMIT,
        }

    def get_distance_constraints(self) -> dict[str, float]:
        """Return all distance-based constraints"""
        return {"fuel_interval": self.FUEL_INTERVAL, "avg_speed": self.AVG_SPEED}
