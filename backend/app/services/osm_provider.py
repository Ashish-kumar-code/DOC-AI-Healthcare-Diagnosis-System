import requests
from .location_provider import LocationProvider


class OSMProvider(LocationProvider):
    OVERPASS_URL = "https://overpass-api.de/api/interpreter"

    def nearby_search(self, latitude, longitude, place_type="hospital", radius=5000):
        # mapping known types to osm tags
        type_to_tag = {
            "doctor": "amenity=doctors",
            "hospital": "amenity=hospital",
            "clinic": "amenity=clinic",
            "pharmacy": "amenity=pharmacy",
            "medical_store": "shop=chemist",
        }

        osm_tag = type_to_tag.get(place_type, "amenity=hospital")
        query = f"[out:json];(node[{osm_tag}](around:{radius},{latitude},{longitude});way[{osm_tag}](around:{radius},{latitude},{longitude});relation[{osm_tag}](around:{radius},{latitude},{longitude}););out center;"

        headers = {
            "User-Agent": "doc-ai-app/1.0",
            "Accept": "application/json"
        }

        try:
            response = requests.get(self.OVERPASS_URL, params={"data": query}, timeout=15, headers=headers)
            response.raise_for_status()
            data = response.json()

            results = []
            for el in data.get("elements", []):
                lat = el.get("lat") or el.get("center", {}).get("lat")
                lon = el.get("lon") or el.get("center", {}).get("lon")
                results.append({
                    "name": el.get("tags", {}).get("name", "Unknown"),
                    "category": place_type,
                    "address": ", ".join([v for k, v in el.get("tags", {}).items() if k.startswith("addr:")]) or None,
                    "rating": None,
                    "location": {"lat": lat, "lng": lon},
                    "open_now": None,
                    "map_url": f"https://www.openstreetmap.org/?mlat={lat}&mlon={lon}#map=18/{lat}/{lon}",
                    "phone": el.get("tags", {}).get("phone"),
                    "distance_meters": None,
                })

            return results

        except Exception:
            # Fallback to a simpler Nominatim search if Overpass is unavailable.
            fallback_url = "https://nominatim.openstreetmap.org/search"
            fallback_params = {
                "q": f"{place_type} near {latitude},{longitude}",
                "format": "json",
                "limit": 20,
            }
            response = requests.get(fallback_url, params=fallback_params, timeout=15, headers=headers)
            response.raise_for_status()
            data = response.json()

            results = []
            for item in data:
                if not item.get("lat") or not item.get("lon"):
                    continue
                results.append({
                    "name": item.get("display_name"),
                    "category": place_type,
                    "address": item.get("display_name"),
                    "rating": None,
                    "location": {"lat": float(item.get("lat")), "lng": float(item.get("lon"))},
                    "open_now": None,
                    "map_url": f"https://www.openstreetmap.org/?mlat={item.get('lat')}&mlon={item.get('lon')}#map=18/{item.get('lat')}/{item.get('lon')}",
                    "phone": None,
                    "distance_meters": None,
                })

            return results

    def text_search(self, query):
        url = "https://nominatim.openstreetmap.org/search"
        response = requests.get(url, params={"q": query, "format": "json", "limit": 20}, timeout=15, headers={"User-Agent": "doc-ai-app/1.0"})
        response.raise_for_status()
        data = response.json()

        results = []
        for item in data:
            results.append({
                "name": item.get("display_name"),
                "category": "manual",
                "address": item.get("display_name"),
                "location": {"lat": float(item.get("lat")), "lng": float(item.get("lon"))},
                "map_url": f"https://www.openstreetmap.org/?mlat={item.get('lat')}&mlon={item.get('lon')}#map=18/{item.get('lat')}/{item.get('lon')}",
                "rating": None,
                "phone": None,
                "open_now": None,
                "distance_meters": None,
            })
        return results
