import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Building2, Stethoscope, Pill, Search, Navigation, Loader2, ExternalLink } from 'lucide-react';
import DashboardLayout from '../components/layouts/DashboardLayout';
import PageTransition from '../components/layouts/PageTransition';
import { EmptyState } from '../components/data/EmptyState';
import { ErrorAlert } from '../components/UiComponents';
import { locationApi } from '../api/client';
import { PLACE_TYPES } from '../utils/constants';
import { staggerContainer, staggerItem } from '../utils/animations';

const ICONS = { hospital: Building2, doctor: Stethoscope, pharmacy: Pill };

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(1);
};

export default function NearbyPage() {
  const [placeType, setPlaceType] = useState('hospital');
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [manual, setManual] = useState('');
  const [locating, setLocating] = useState(false);
  const [userCoords, setUserCoords] = useState(null);

  const handleGeoSearch = () => {
    if (!navigator.geolocation) { setError('Geolocation is not supported'); return; }
    setLocating(true); setError('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setLoading(true); setLocating(false);
        setUserCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        try {
          const res = await locationApi.nearby(pos.coords.latitude, pos.coords.longitude, placeType);
          setPlaces(res.data.data || []);
        } catch (err) { setError(err.response?.data?.message || 'Search failed'); }
        setLoading(false);
      },
      () => { setError('Location access denied'); setLocating(false); },
      { timeout: 10000 }
    );
  };

  const handleManualSearch = async (e) => {
    e.preventDefault();
    if (!manual.trim()) return;
    setLoading(true); setError('');
    try {
      const res = await locationApi.manualSearch(manual);
      setPlaces(res.data.data || []);
    } catch (err) { setError(err.response?.data?.message || 'Search failed'); }
    setLoading(false);
  };

  const PlaceIcon = ICONS[placeType] || MapPin;

  return (
    <DashboardLayout>
      <PageTransition>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-3"><MapPin className="w-7 h-7 text-danger" /> Nearby Facilities</h1>
          <p className="text-text-secondary mt-1">Find hospitals, clinics, and pharmacies near you</p>
        </div>

        {error && <ErrorAlert message={error} onDismiss={() => setError('')} />}

        {/* Type Selection */}
        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          {PLACE_TYPES.map((t) => {
            const Icon = ICONS[t.value] || MapPin;
            return (
              <button key={t.value} onClick={() => setPlaceType(t.value)}
                className={`card-static text-left transition-all ${placeType === t.value ? 'border-primary/40 bg-primary/5' : 'hover:border-border-hover'}`}>
                <Icon className={`w-6 h-6 mb-2 ${placeType === t.value ? 'text-primary' : 'text-text-tertiary'}`} />
                <div className="text-sm font-semibold text-text-primary">{t.label}</div>
              </button>
            );
          })}
        </div>

        {/* Search Options */}
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <button onClick={handleGeoSearch} disabled={locating || loading} className="btn-primary btn-lg justify-center">
            {locating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Navigation className="w-5 h-5" />}
            {locating ? 'Getting location...' : 'Use My Location'}
          </button>
          <form onSubmit={handleManualSearch} className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <input type="text" value={manual} onChange={(e) => setManual(e.target.value)} placeholder="Search by location..."
                className="input pl-10 h-full" />
            </div>
            <button type="submit" disabled={loading} className="btn-outline">Search</button>
          </form>
        </div>

        {/* Results */}
        {loading ? (
          <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}</div>
        ) : places.length > 0 ? (
          <motion.div className="space-y-3" variants={staggerContainer} initial="initial" animate="animate">
            {places.map((p, i) => {
              const distance = userCoords && p.location ? calculateDistance(userCoords.lat, userCoords.lon, p.location.lat || p.location.latitude, p.location.lng || p.location.longitude) : null;
              const mapUrl = p.map_url || (p.place_id ? `https://www.google.com/maps/place/?q=place_id:${p.place_id}` : (p.location ? `https://www.google.com/maps?q=${p.location.lat || p.location.latitude},${p.location.lng || p.location.longitude}` : null));
              return (
                <motion.div key={i} variants={staggerItem} className="card-static flex items-start gap-4 group">
                  <div className="w-11 h-11 rounded-xl bg-danger/10 flex items-center justify-center shrink-0">
                    <PlaceIcon className="w-5 h-5 text-danger" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-text-primary">{p.name}</h3>
                    <p className="text-xs text-text-tertiary mt-1">{p.address || p.vicinity || p.formatted_address || 'No address'}</p>
                    <div className="flex flex-wrap gap-3 mt-2">
                      {distance && <p className="text-xs text-primary font-medium">📍 {distance} km away</p>}
                      {p.phone && <p className="text-xs text-text-tertiary">📞 {p.phone}</p>}
                      {p.rating && <p className="text-xs text-warning">★ {p.rating} {p.user_ratings_total ? `(${p.user_ratings_total})` : ''}</p>}
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
          !loading && <EmptyState icon={MapPin} title="No results" description="Search or use your location to find nearby facilities." />
        )}
      </PageTransition>
    </DashboardLayout>
  );
}