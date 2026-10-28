import os
import logging
from ..models import NearbySearchCache
from ..extensions import db
from .google_places_provider import GooglePlacesProvider
from .osm_provider import OSMProvider

logger = logging.getLogger(__name__)

DEFAULT_RADIUS = int(os.getenv("LOCATION_DEFAULT_RADIUS", 5000))
LOCATION_PROVIDER = os.getenv("LOCATION_PROVIDER", "osm").lower()


class LocationService:
    def __init__(self, provider=None):
        self.provider = provider or (OSMProvider() if LOCATION_PROVIDER == "osm" else GooglePlacesProvider())

    def nearby(self, latitude, longitude, search_type="hospital", radius=None, user_id=None):
        radius = radius or DEFAULT_RADIUS

        # Check cache, but ONLY return if the cached response has valid results
        query = NearbySearchCache.query.filter_by(
            user_id=user_id,
            latitude=latitude,
            longitude=longitude,
            search_type=search_type,
        ).order_by(NearbySearchCache.created_at.desc()).first()

        if query and query.response_json and isinstance(query.response_json, list) and len(query.response_json) > 0:
            return query.response_json

        try:
            data = self.provider.nearby_search(latitude, longitude, place_type=search_type, radius=radius)
        except Exception as e:
            logger.warning(f"Primary location provider failed: {e}. Falling back to OSM.")
            try:
                data = OSMProvider().nearby_search(latitude, longitude, place_type=search_type, radius=radius)
            except Exception as e2:
                logger.error(f"Fallback location provider failed: {e2}")
                data = []

        # Only store in cache if we actually found results
        if data and isinstance(data, list) and len(data) > 0:
            try:
                cache = NearbySearchCache(
                    user_id=user_id,
                    latitude=latitude,
                    longitude=longitude,
                    search_type=search_type,
                    response_json=data,
                )
                db.session.add(cache)
                db.session.commit()
            except Exception as ce:
                logger.warning(f"Failed to cache nearby search: {ce}")
                db.session.rollback()

        return data

    def manual_search(self, query_text, user_id=None):
        try:
            data = self.provider.text_search(query_text)
        except Exception:
            data = OSMProvider().text_search(query_text)

        return data
