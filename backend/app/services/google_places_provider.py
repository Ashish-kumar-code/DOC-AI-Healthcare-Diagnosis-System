import os
import requests
from urllib.parse import urlencode
from .location_provider import LocationProvider

GOOGLE_PLACES_API_KEY = os.getenv("GOOGLE_PLACES_API_KEY", "")
BASE_URL = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"


class GooglePlacesProvider(LocationProvider):
    def __init__(self, api_key=None):
        self.api_key = api_key or GOOGLE_PLACES_API_KEY

    def nearby_search(self, latitude, longitude, place_type="hospital", radius=5000):
        if not self.api_key:
            raise ValueError("Google Places API key not set")

        params = {
            "location": f"{latitude},{longitude}",
            "radius": radius,
            "type": place_type,
            "key": self.api_key,
        }

        url = f"{BASE_URL}?{urlencode(params)}"
        resp = requests.get(url, timeout=10)
        resp.raise_for_status()
        data = resp.json()

        if data.get("status") not in ["OK", "ZERO_RESULTS"]:
            raise RuntimeError(f"Google Places API error: {data.get('status')} - {data.get('error_message')}")

        return [self._map_place_result(item) for item in data.get("results", [])]

    def text_search(self, query):
        # fallback endpoint for text search
        text_url = "https://maps.googleapis.com/maps/api/place/textsearch/json"
        params = {
            "query": query,
            "key": self.api_key,
        }

        resp = requests.get(text_url, params=params, timeout=10)
        resp.raise_for_status()
        data = resp.json()

        if data.get("status") not in ["OK", "ZERO_RESULTS"]:
            raise RuntimeError(f"Google Places API error: {data.get('status')} - {data.get('error_message')}")

        return [self._map_place_result(item) for item in data.get("results", [])]

    def _map_place_result(self, item):
        return {
            "name": item.get("name"),
            "category": ", ".join(item.get("types", [])),
            "address": item.get("vicinity") or item.get("formatted_address"),
            "rating": item.get("rating"),
            "place_id": item.get("place_id"),
            "location": item.get("geometry", {}).get("location"),
            "open_now": item.get("opening_hours", {}).get("open_now"),
            "map_url": f"https://www.google.com/maps/search/?api=1&query={item.get('name')}+{item.get('vicinity', '')}" if item.get("name") else None,
            "phone": item.get("formatted_phone_number"),
            "distance_meters": None,
        }
