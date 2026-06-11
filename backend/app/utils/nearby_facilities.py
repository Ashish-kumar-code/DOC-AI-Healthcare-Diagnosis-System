"""
Nearby medical facilities using OpenStreetMap Overpass API (Completely Free)
No API key required. Works well for India.
"""

import requests
from typing import List, Dict, Any
import time
from app.utils.logger import get_logger, ErrorLogger

logger = get_logger(__name__)

OVERPASS_URL = "https://overpass-api.de/api/interpreter"


def get_nearby_medical_facilities(
    lat: float, 
    lon: float, 
    radius: int = 5000,   # meters
    limit: int = 15
) -> List[Dict[str, Any]]:
    """
    Find nearby hospitals, clinics, doctors, and pharmacies using Overpass API.
    """
    if not (-90 <= lat <= 90) or not (-180 <= lon <= 180):
        logger.warning(f"Invalid coordinates provided: lat={lat}, lon={lon}")
        return []

    # Improved Overpass QL Query
    overpass_query = f"""
    [out:json][timeout:30][maxsize:2048];
    (
      node["amenity"~"hospital|clinic|doctors|pharmacy|healthcare"](around:{radius},{lat},{lon});
      way["amenity"~"hospital|clinic|doctors|pharmacy|healthcare"](around:{radius},{lat},{lon});
      rel["amenity"~"hospital|clinic|doctors|pharmacy|healthcare"](around:{radius},{lat},{lon});
    );
    out center tags;
    """

    try:
        response = requests.get(
            OVERPASS_URL, 
            params={'data': overpass_query},
            timeout=35
        )

        if response.status_code != 200:
            logger.warning(f"Overpass API returned status {response.status_code}")
            return []

        data = response.json()
        facilities = []

        for element in data.get('elements', []):
            tags = element.get('tags', {})
            center = element.get('center') or element

            name = (
                tags.get('name') or 
                tags.get('brand') or 
                tags.get('operator') or 
                "Unnamed Medical Facility"
            )
            
            amenity = tags.get('amenity', 'healthcare')
            facility_type = amenity.replace('_', ' ').title()

            facility_lat = center.get('lat') or element.get('lat')
            facility_lon = center.get('lon') or element.get('lon')

            if not facility_lat or not facility_lon:
                continue

            # Rough distance calculation (good enough for sorting)
            distance_meters = int(
                ((facility_lat - lat)**2 + (facility_lon - lon)**2)**0.5 * 111_000
            )

            facility = {
                "id": str(element.get('id')),
                "name": name,
                "type": facility_type,
                "latitude": float(facility_lat),
                "longitude": float(facility_lon),
                "distance_meters": distance_meters,
                "address": tags.get('addr:full') or 
                           f"{tags.get('addr:street', '')}, {tags.get('addr:city', '')}".strip(', '),
                "phone": tags.get('phone') or tags.get('contact:phone'),
                "website": tags.get('website') or tags.get('contact:website'),
                "opening_hours": tags.get('opening_hours'),
                "source": "OpenStreetMap"
            }
            
            facilities.append(facility)

        # Sort by closest first and limit results
        facilities.sort(key=lambda x: x['distance_meters'])
        return facilities[:limit]

    except requests.exceptions.Timeout:
        logger.warning("Overpass API request timed out")
        return []
    except requests.exceptions.RequestException as e:
        ErrorLogger.log_error(e, context="nearby_facilities_overpass")
        logger.error(f"Overpass API request failed: {e}")
        return []
    except Exception as e:
        ErrorLogger.log_error(e, context="nearby_facilities")
        logger.error(f"Unexpected error in get_nearby_medical_facilities: {e}")
        return []


def get_user_location_from_ip() -> Dict[str, Any]:
    """
    Get approximate user location from IP address (free fallback).
    Returns Patna coordinates as default (your location).
    """
    try:
        response = requests.get('https://ipapi.co/json/', timeout=8)
        if response.status_code == 200:
            data = response.json()
            return {
                "latitude": data.get('latitude'),
                "longitude": data.get('longitude'),
                "city": data.get('city', 'Unknown'),
                "country": data.get('country_name', 'India'),
                "source": "ipapi.co"
            }
    except Exception as e:
        logger.debug(f"IP location lookup failed: {e}")

    # Default fallback: Patna, Bihar
    return {
        "latitude": 25.5941,
        "longitude": 85.1376,
        "city": "Patna",
        "country": "India",
        "source": "default"
    }