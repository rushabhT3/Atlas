import time
import requests
from abc import ABC, abstractmethod
from typing import Optional

from django.conf import settings


class GeocodingService(ABC):
    """Abstract base class for geocoding services"""

    @abstractmethod
    def geocode(self, place: str) -> Optional[str]:
        """Convert address/place name to coordinates"""
        pass


class NominatimGeocodingService(GeocodingService):
    """Nominatim/OpenStreetMap geocoding implementation"""

    def __init__(self, user_agent: str = "SpotterELD/1.0", timeout: int = 15):
        self.user_agent = user_agent
        self.timeout = timeout
        self.base_url = "https://nominatim.openstreetmap.org/search"

    def geocode(self, place: str) -> Optional[str]:
        """Convert address to coordinates using Nominatim API"""
        if not place or not place.strip():
            return None

        url = f"{self.base_url}?q={place}&format=json&limit=1&countrycodes=us"
        headers = {"User-Agent": self.user_agent}

        try:
            response = requests.get(url, headers=headers, timeout=self.timeout)
            response.raise_for_status()
            data = response.json()

            if not data:
                print(f"Geocode Error: No results found for '{place}'")
                return None

            result = data[0]
            return f"{result['lon']},{result['lat']}"

        except requests.RequestException as e:
            print(f"Geocode Error for '{place}': {e}")
            return None
        except (KeyError, IndexError) as e:
            print(f"Geocode Data Error for '{place}': {e}")
            return None


class LocationIQGeocodingService(GeocodingService):
    """LocationIQ geocoding implementation.

    LocationIQ is built on OSM/Nominatim data, so the response format matches
    Nominatim (array of objects with 'lat'/'lon'). Unlike the public Nominatim
    server, it allows server-side/cloud use with an API key.
    """

    def __init__(self, api_key: str = "", timeout: int = 15):
        self.api_key = api_key or getattr(settings, "LOCATIONIQ_API_KEY", "")
        self.timeout = timeout
        self.base_url = "https://us1.locationiq.com/v1/search"

    def geocode(self, place: str) -> Optional[str]:
        """Convert address to coordinates using the LocationIQ API"""
        if not place or not place.strip():
            return None

        if not self.api_key:
            print("Geocode Error: LOCATIONIQ_API_KEY is not set")
            return None

        params = {
            "key": self.api_key,
            "q": place,
            "format": "json",
            "limit": 1,
            "countrycodes": "us",
        }

        for attempt in range(2):
            try:
                response = requests.get(
                    self.base_url, params=params, timeout=self.timeout
                )

                # Free tier allows 2 req/s; back off once if we burst past it.
                if response.status_code == 429 and attempt == 0:
                    time.sleep(1)
                    continue

                response.raise_for_status()
                data = response.json()

                if not data:
                    print(f"Geocode Error: No results found for '{place}'")
                    return None

                result = data[0]
                return f"{result['lon']},{result['lat']}"

            except requests.RequestException as e:
                print(f"Geocode Error for '{place}': {e}")
                return None
            except (KeyError, IndexError) as e:
                print(f"Geocode Data Error for '{place}': {e}")
                return None

        return None


class MockGeocodingService(GeocodingService):
    """Mock geocoding service for testing"""

    def __init__(self):
        self.mock_coordinates = {
            "new york": "-74.0060,40.7128",
            "los angeles": "-118.2437,34.0522",
            "chicago": "-87.6298,41.8781",
        }

    def geocode(self, place: str) -> Optional[str]:
        """Return mock coordinates for known locations"""
        place_lower = place.lower()
        return self.mock_coordinates.get(place_lower)
