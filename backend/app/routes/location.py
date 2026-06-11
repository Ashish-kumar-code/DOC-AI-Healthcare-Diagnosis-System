from flask import Blueprint, request, jsonify

from ..services.location_service import LocationService

location_bp = Blueprint("location_bp", __name__)
service = LocationService()


@location_bp.route("/nearby", methods=["POST"])
def nearby():
    data = request.get_json() or {}
    latitude = data.get("latitude")
    longitude = data.get("longitude")
    place_type = data.get("type", "hospital")
    radius = data.get("radius")

    if latitude is None or longitude is None:
        return jsonify({"error": "latitude and longitude are required"}), 400

    try:
        results = service.nearby(latitude=float(latitude), longitude=float(longitude), search_type=place_type, radius=radius)
        return jsonify({"status": "ok", "data": results}), 200
    except Exception as exc:
        return jsonify({"error": "Unable to fetch nearby locations", "detail": str(exc)}), 500


@location_bp.route("/manual-search", methods=["POST"])
def manual_search():
    data = request.get_json() or {}
    query = data.get("query")

    if not query:
        return jsonify({"error": "query is required"}), 400

    try:
        results = service.manual_search(query_text=query)
        return jsonify({"status": "ok", "data": results}), 200
    except Exception as exc:
        return jsonify({"error": "Unable to perform manual search", "detail": str(exc)}), 500
