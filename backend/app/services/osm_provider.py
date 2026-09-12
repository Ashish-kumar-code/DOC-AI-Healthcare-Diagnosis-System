import requests
from .location_provider import LocationProvider


class OSMProvider(LocationProvider):
    OVERPASS_URL = "https://overpass-api.de/api/interpreter"

    def nearby_search(self, latitude, longitude, place_type="hospital", radius=5000):
        import math

        # Map each type to multiple OSM tags for comprehensive results
        type_to_tags = {
            "hospital": [
                'amenity=hospital',
            ],
            "doctor": [
                'amenity=doctors',
                'amenity=clinic',
                'healthcare=doctor',
                'healthcare=centre',
            ],
            "pharmacy": [
                'amenity=pharmacy',
                'shop=chemist',
                'healthcare=pharmacy',
            ],
        }

        tags = type_to_tags.get(place_type, ['amenity=hospital'])

        # Build Overpass query with multiple tags (union)
        queries = []
        for tag in tags:
            queries.append(f'node[{tag}](around:{radius},{latitude},{longitude});')
            queries.append(f'way[{tag}](around:{radius},{latitude},{longitude});')
            queries.append(f'relation[{tag}](around:{radius},{latitude},{longitude});')

        overpass_query = f'[out:json][timeout:15];({" ".join(queries)});out center;'

        headers = {
            "User-Agent": "doc-ai-app/2.0",
            "Accept": "application/json"
        }

        def _haversine(lat1, lon1, lat2, lon2):
            """Calculate distance in meters between two coordinates."""
            R = 6371000  # Earth radius in meters
            phi1, phi2 = math.radians(lat1), math.radians(lat2)
            dphi = math.radians(lat2 - lat1)
            dlam = math.radians(lon2 - lon1)
            a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
            return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

        try:
            response = requests.get(self.OVERPASS_URL, params={"data": overpass_query}, timeout=15, headers=headers)
            response.raise_for_status()
            data = response.json()

            results = []
            seen_names = set()  # Deduplicate by name

            for el in data.get("elements", []):
                tags_data = el.get("tags", {})
                name = tags_data.get("name")

                # Skip unnamed places
                if not name or name == "Unknown":
                    continue

                # Deduplicate
                name_lower = name.lower().strip()
                if name_lower in seen_names:
                    continue
                seen_names.add(name_lower)

                lat = el.get("lat") or el.get("center", {}).get("lat")
                lon = el.get("lon") or el.get("center", {}).get("lon")

                if not lat or not lon:
                    continue

                # Calculate distance
                dist_m = _haversine(float(latitude), float(longitude), float(lat), float(lon))

                # Build address from addr: tags
                addr_parts = []
                for key in ('addr:housenumber', 'addr:street', 'addr:suburb', 'addr:city', 'addr:postcode'):
                    if key in tags_data:
                        addr_parts.append(tags_data[key])
                address = ", ".join(addr_parts) if addr_parts else tags_data.get('address', None)

                # Opening hours
                opening_hours = tags_data.get('opening_hours')

                results.append({
                    "name": name,
                    "category": place_type,
                    "address": address,
                    "rating": None,
                    "location": {"lat": float(lat), "lng": float(lon)},
                    "open_now": None,
                    "opening_hours": opening_hours,
                    "map_url": f"https://www.openstreetmap.org/?mlat={lat}&mlon={lon}#map=18/{lat}/{lon}",
                    "phone": tags_data.get("phone") or tags_data.get("contact:phone"),
                    "website": tags_data.get("website") or tags_data.get("contact:website"),
                    "distance_meters": round(dist_m),
                })

            # Sort by distance and limit to 20
            results.sort(key=lambda x: x.get("distance_meters", float('inf')))
            return results[:20]

        except Exception:
            # Fallback to Nominatim
            fallback_url = "https://nominatim.openstreetmap.org/search"
            type_query_map = {
                "hospital": "hospital",
                "doctor": "clinic doctor",
                "pharmacy": "pharmacy chemist",
            }
            fallback_params = {
                "q": f"{type_query_map.get(place_type, place_type)} near {latitude},{longitude}",
                "format": "json",
                "limit": 20,
                "addressdetails": 1
            }
            response = requests.get(fallback_url, params=fallback_params, timeout=15, headers=headers)
            response.raise_for_status()
            data = response.json()

            results = []
            for item in data:
                if not item.get("lat") or not item.get("lon"):
                    continue
                dist_m = _haversine(float(latitude), float(longitude), float(item["lat"]), float(item["lon"]))
                results.append({
                    "name": item.get("display_name", "").split(",")[0],
                    "category": place_type,
                    "address": item.get("display_name"),
                    "rating": None,
                    "location": {"lat": float(item["lat"]), "lng": float(item["lon"])},
                    "open_now": None,
                    "map_url": f"https://www.openstreetmap.org/?mlat={item['lat']}&mlon={item['lon']}#map=18/{item['lat']}/{item['lon']}",
                    "phone": None,
                    "distance_meters": round(dist_m),
                })

            results.sort(key=lambda x: x.get("distance_meters", float('inf')))
            return results[:20]

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
