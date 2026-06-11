import os
from ..models import NearbySearchCache
from ..extensions import db
from .google_places_provider import GooglePlacesProvider
from .osm_provider import OSMProvider

DEFAULT_RADIUS = int(os.getenv("LOCATION_DEFAULT_RADIUS", 5000))
LOCATION_PROVIDER = os.getenv("LOCATION_PROVIDER", "osm").lower()


class LocationService:
    def __init__(self, provider=None):
        self.provider = provider or (OSMProvider() if LOCATION_PROVIDER == "osm" else GooglePlacesProvider())

    def nearby(self, latitude, longitude, search_type="hospital", radius=None, user_id=None):
        radius = radius or DEFAULT_RADIUS
        cache_key = (user_id, latitude, longitude, search_type, radius)

        # simple cache lookup by exact values
        query = NearbySearchCache.query.filter_by(
            user_id=user_id,
            latitude=latitude,
            longitude=longitude,
            search_type=search_type,
        ).order_by(NearbySearchCache.created_at.desc()).first()

        if query:
            return query.response_json

        try:
            data = self.provider.nearby_search(latitude, longitude, place_type=search_type, radius=radius)
        except Exception:
            # fallback provider
            data = OSMProvider().nearby_search(latitude, longitude, place_type=search_type, radius=radius)

        cache = NearbySearchCache(
            user_id=user_id,
            latitude=latitude,
            longitude=longitude,
            search_type=search_type,
            response_json=data,
        )
        db.session.add(cache)
        db.session.commit()

        return data

    def manual_search(self, query_text, user_id=None):
        try:
            data = self.provider.text_search(query_text)
        except Exception:
            data = OSMProvider().text_search(query_text)

        # do not cache manual search by default (or optional)
        return data
