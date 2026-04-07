import requests
from abc import ABC, abstractmethod
from collections.abc import Sequence
from typing import Any, Optional, Tuple
from dataclasses import dataclass


@dataclass
class RouteInfo:
    """Data class for route information"""

    distance_miles: float
    geometry: dict[str, Any]
    coordinates: Sequence[Tuple[float, float]]


class RoutingService(ABC):
    """Abstract base class for routing services"""

    @abstractmethod
    def get_route(self, start_coords: str, end_coords: str) -> Optional[RouteInfo]:
        """Get route information between two coordinate points"""
        pass


class OSRMRoutingService(RoutingService):
    """OSRM (Open Source Routing Machine) implementation"""

    def __init__(
        self, base_url: str = "http://router.project-osrm.org", timeout: int = 30
    ):
        self.base_url = base_url
        self.timeout = timeout

    def get_route(self, start_coords: str, end_coords: str) -> Optional[RouteInfo]:
        """Get route from OSRM API"""
        if not start_coords or not end_coords:
            return None

        url = f"{self.base_url}/route/v1/driving/{start_coords};{end_coords}?overview=full&geometries=geojson"

        try:
            response = requests.get(url, timeout=self.timeout)
            response.raise_for_status()
            data = response.json()

            if "routes" not in data or len(data["routes"]) == 0:
                print(
                    f"OSRM Error: No route found between {start_coords} and {end_coords}"
                )
                return None

            route = data["routes"][0]
            distance_miles = route["distance"] * 0.000621371  # Convert meters to miles
            geometry = route["geometry"]
            coordinates = geometry.get("coordinates", [])

            return RouteInfo(
                distance_miles=distance_miles,
                geometry=geometry,
                coordinates=coordinates,
            )

        except requests.RequestException as e:
            print(f"OSRM Request Error: {e}")
            return None
        except (KeyError, ValueError) as e:
            print(f"OSRM Data Error: {e}")
            return None


class MockRoutingService(RoutingService):
    """Mock routing service for testing"""

    def __init__(self):
        self.mock_distances = {
            "new york,los angeles": 2790,
            "new york,chicago": 790,
            "chicago,los angeles": 2015,
        }

    def get_route(self, start_coords: str, end_coords: str) -> Optional[RouteInfo]:
        """Return mock route information"""
        # Simple mock implementation
        key = f"{start_coords},{end_coords}"
        distance = self.mock_distances.get(key, 100)  # Default 100 miles

        # Create simple mock geometry
        start_lon, start_lat = map(float, start_coords.split(","))
        end_lon, end_lat = map(float, end_coords.split(","))

        coordinates = [
            [start_lon, start_lat],
            [(start_lon + end_lon) / 2, (start_lat + end_lat) / 2],
            [end_lon, end_lat],
        ]

        return RouteInfo(
            distance_miles=distance,
            geometry={"type": "LineString", "coordinates": coordinates},
            coordinates=coordinates,
        )
