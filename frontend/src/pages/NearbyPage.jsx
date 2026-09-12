import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Building2, Stethoscope, Pill, Search, Navigation, Loader2, Clock, Phone, Globe } from 'lucide-react';
import DashboardLayout from '../components/layouts/DashboardLayout';
import PageTransition from '../components/layouts/PageTransition';
import { EmptyState } from '../components/data/EmptyState';
import { ErrorAlert } from '../components/UiComponents';
import { locationApi } from '../api/client';
import { staggerContainer, staggerItem } from '../utils/animations';

const PLACE_TYPES = [
  { value: 'hospital', label: 'Hospitals', icon: Building2, description: 'Find hospitals near your location', color: 'text-red-500', bg: 'bg-red-50' },
  { value: 'doctor', label: 'Doctors & Clinics', icon: Stethoscope, description: 'Find doctors and clinics nearby', color: 'text-blue-500', bg: 'bg-blue-50' },
  { value: 'pharmacy', label: 'Pharmacies', icon: Pill, description: 'Find pharmacies and chemists nearby', color: 'text-green-500', bg: 'bg-green-50' },
];

const formatDistance = (meters) => {
  if (!meters && meters !== 0) return null;
  if (meters < 1000) return `${meters}m`;
  return `${(meters / 1000).toFixed(1)} km`;
};

export default function NearbyPage() {
  const [placeType, setPlaceType] = useState('hospital');
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [manual, setManual] = useState('');
  const [locating, setLocating] = useState(false);
  const [userCoords, setUserCoords] = useState(null);

  const fetchNearby = useCallback(async (lat, lon, type) => {
    setLoading(true); setError('');
    try {
      const res = await locationApi.nearby(lat, lon, type);
      setPlaces(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Search failed. Please try again.');
    }
    setLoading(false);
  }, []);

  const handleGeoSearch = useCallback(() => {
    if (!navigator.geolocation) { setError('Geolocation is not supported by your browser'); return; }
    setLocating(true); setError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const coords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        setUserCoords(coords);
        fetchNearby(coords.lat, coords.lon, placeType);
      },
      () => { setError('Location access denied. Please enable GPS permissions.'); setLocating(false); },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }, [fetchNearby, placeType]);

  useEffect(() => {
    handleGeoSearch();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (userCoords && !locating) {
      fetchNearby(userCoords.lat, userCoords.lon, placeType);
    }
  }, [placeType]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleManualSearch = async (e) => {
    e.preventDefault();
    if (!manual.trim()) return;
    setLoading(true); setError('');
    setUserCoords(null);
    try {
      const res = await locationApi.manualSearch(manual);
      setPlaces(res.data.data || []);
    } catch (err) { setError(err.response?.data?.message || 'Search failed'); }
    setLoading(false);
  };

  const activeType = PLACE_TYPES.find(t => t.value === placeType) || PLACE_TYPES[0];
  const PlaceIcon = activeType.icon;

  return (
    <DashboardLayout>
      <PageTransition>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-3">
            <MapPin className="w-7 h-7 text-danger" /> Nearby Facilities
          </h1>
          <p className="text-text-secondary mt-1">Find hospitals, clinics, and pharmacies near you</p>
        </div>

        {error && <ErrorAlert message={error} onDismiss={() => setError('')} />}

        {/* Type Selection Cards */}
        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          {PLACE_TYPES.map((t) => {
            const Icon = t.icon;
            const isActive = placeType === t.value;
            return (
              <button key={t.value} onClick={() => setPlaceType(t.value)}
                className={`card-static text-left transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-lg group ${
                  isActive
                    ? 'border-primary bg-primary/5 shadow-md scale-[1.02] ring-2 ring-primary/20'
                    : 'hover:border-primary/40 hover:bg-white'
                }`}>
                <Icon className={`w-6 h-6 mb-2 transition-colors duration-300 ${isActive ? t.color : 'text-text-tertiary group-hover:text-primary'}`} />
                <div className="text-sm font-semibold text-text-primary">{t.label}</div>
                <div className="text-xs text-text-tertiary mt-1">{t.description}</div>
              </button>
            );
          })}
        </div>

        {/* Search Options & GPS Status */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <button onClick={handleGeoSearch} disabled={locating || loading} className="btn-primary btn-lg justify-center w-full md:w-auto">
              {locating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Navigation className="w-5 h-5" />}
              {locating ? 'Getting location...' : 'Refresh GPS'}
            </button>
            {userCoords && !locating && (
              <div className="flex items-center gap-2 text-sm text-success-800 bg-success-50 px-3 py-2 rounded-lg border border-success-200">
                <MapPin className="w-4 h-4" />
                <span className="font-medium">GPS Active</span>
                <span className="text-xs opacity-80 hidden sm:inline-block">({userCoords.lat.toFixed(4)}, {userCoords.lon.toFixed(4)})</span>
              </div>
            )}
          </div>
          <form onSubmit={handleManualSearch} className="flex gap-2 w-full md:w-1/3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <input type="text" value={manual} onChange={(e) => setManual(e.target.value)} placeholder="Search by location..."
                className="input pl-10 h-full w-full" />
            </div>
            <button type="submit" disabled={loading} className="btn-outline whitespace-nowrap">Search</button>
          </form>
        </div>

        {/* Result Count */}
        {!loading && places.length > 0 && (
          <div className="text-sm text-text-secondary mb-4">
            Found <span className="font-semibold text-text-primary">{places.length}</span> {activeType.label.toLowerCase()} near you
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}</div>
        ) : places.length > 0 ? (
          <motion.div className="space-y-3" variants={staggerContainer} initial="initial" animate="animate">
            {places.map((p, i) => {
              const distance = formatDistance(p.distance_meters);
              const mapUrl = p.map_url || (p.location ? `https://www.google.com/maps?q=${p.location.lat},${p.location.lng}` : null);
              return (
                <motion.div key={i} variants={staggerItem} className="card-static flex items-start gap-4 group hover:shadow-md transition-shadow">
                  <div className={`w-11 h-11 rounded-xl ${activeType.bg} flex items-center justify-center shrink-0`}>
                    <PlaceIcon className={`w-5 h-5 ${activeType.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-text-primary">{p.name}</h3>
                    {p.address && <p className="text-xs text-text-tertiary mt-1 truncate">{p.address}</p>}
                    <div className="flex flex-wrap gap-3 mt-2">
                      {distance && (
                        <span className="inline-flex items-center gap-1 text-xs text-primary font-medium bg-primary/5 px-2 py-0.5 rounded-full">
                          <MapPin className="w-3 h-3" /> {distance}
                        </span>
                      )}
                      {p.phone && (
                        <a href={`tel:${p.phone}`} className="inline-flex items-center gap-1 text-xs text-text-secondary hover:text-primary transition-colors">
                          <Phone className="w-3 h-3" /> {p.phone}
                        </a>
                      )}
                      {p.opening_hours && (
                        <span className="inline-flex items-center gap-1 text-xs text-text-tertiary">
                          <Clock className="w-3 h-3" /> {p.opening_hours}
                        </span>
                      )}
                      {p.website && (
                        <a href={p.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 transition-colors">
                          <Globe className="w-3 h-3" /> Website
                        </a>
                      )}
                      {p.rating && (
                        <span className="text-xs text-warning">★ {p.rating} {p.user_ratings_total ? `(${p.user_ratings_total})` : ''}</span>
                      )}
                    </div>
                  </div>
                  {mapUrl && (
                    <a href={mapUrl} target="_blank" rel="noopener noreferrer"
                      className="btn-ghost btn-sm shrink-0 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      <Navigation className="w-4 h-4" /> Directions
                    </a>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          !loading && <EmptyState icon={MapPin} title="No results" description={`No ${activeType.label.toLowerCase()} found nearby. Try using GPS or search by location name.`} />
        )}
      </PageTransition>
    </DashboardLayout>
  );
}