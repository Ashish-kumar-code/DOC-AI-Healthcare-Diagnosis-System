import math
import logging
import requests
from .location_provider import LocationProvider

logger = logging.getLogger(__name__)


def haversine(lat1, lon1, lat2, lon2):
    """Calculate distance in meters between two coordinates."""
    r = 6371000  # Earth radius in meters
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    return r * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


class OSMProvider(LocationProvider):
    NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
    HEADERS = {
        "User-Agent": "DOC-AI-Healthcare-Platform/2.0 (healthcare-assistant@docai.local)",
        "Accept": "application/json",
    }

    TYPE_KEYWORDS = {
        "hospital": ["hospital", "super speciality hospital"],
        "doctor": ["doctor", "clinic", "dispensary"],
        "pharmacy": ["pharmacy", "chemist", "medical store"],
    }

    def nearby_search(self, latitude, longitude, place_type="hospital", radius=5000):
        lat = float(latitude)
        lon = float(longitude)
        keywords = self.TYPE_KEYWORDS.get(place_type, [place_type])

        results = []
        seen_names = set()

        # Query Nominatim for each relevant keyword to maximize coverage
        for kw in keywords:
            try:
                params = {
                    "q": f"{kw} near {lat},{lon}",
                    "format": "json",
                    "addressdetails": 1,
                    "limit": 15,
                }
                resp = requests.get(self.NOMINATIM_URL, params=params, headers=self.HEADERS, timeout=8)
                if resp.status_code != 200:
                    continue

                items = resp.json()
                for item in items:
                    item_lat = item.get("lat")
                    item_lon = item.get("lon")
                    if not item_lat or not item_lon:
                        continue

                    item_lat = float(item_lat)
                    item_lon = float(item_lon)

                    # Compute distance
                    dist_m = haversine(lat, lon, item_lat, item_lon)

                    # Filter within reasonable radius (default 10km if radius not strict)
                    max_allowed_radius = max(radius, 10000)
                    if dist_m > max_allowed_radius:
                        continue

                    raw_display = item.get("display_name", "")
                    name = raw_display.split(",")[0].strip() if raw_display else "Unknown Facility"

                    # Deduplicate by normalized name
                    norm_name = "".join(ch for ch in name.lower() if ch.isalnum())
                    if not norm_name or norm_name in seen_names:
                        continue
                    seen_names.add(norm_name)

                    # Address
                    addr = raw_display

                    # Google Maps navigation link
                    map_url = f"https://www.google.com/maps/dir/?api=1&destination={item_lat},{item_lon}"

                    results.append({
                        "name": name,
                        "category": place_type,
                        "address": addr,
                        "rating": None,
                        "location": {"lat": item_lat, "lng": item_lon},
                        "open_now": None,
                        "opening_hours": None,
                        "map_url": map_url,
                        "phone": None,
                        "distance_meters": round(dist_m),
                    })
            except Exception as e:
                logger.warning(f"Error querying Nominatim for keyword '{kw}': {e}")
                continue

        # Sort nearest first
        results.sort(key=lambda x: x.get("distance_meters", float("inf")))
        return results[:25]

    def text_search(self, query):
        try:
            params = {
                "q": query,
                "format": "json",
                "limit": 20,
                "addressdetails": 1,
            }
            resp = requests.get(self.NOMINATIM_URL, params=params, headers=self.HEADERS, timeout=10)
            resp.raise_for_status()
            data = resp.json()

            results = []
            seen = set()
            for item in data:
                raw_display = item.get("display_name", "")
                name = raw_display.split(",")[0].strip() if raw_display else query
                norm = name.lower()
                if norm in seen:
                    continue
                seen.add(norm)

                lat = float(item.get("lat", 0))
                lon = float(item.get("lon", 0))
                map_url = f"https://www.google.com/maps/dir/?api=1&destination={lat},{lon}"

                results.append({
                    "name": name,
                    "category": "manual",
                    "address": raw_display,
                    "location": {"lat": lat, "lng": lon},
                    "map_url": map_url,
                    "rating": None,
                    "phone": None,
                    "open_now": None,
                    "distance_meters": None,
                })
            return results
        except Exception as e:
            logger.error(f"Text search error: {e}")
            return []
