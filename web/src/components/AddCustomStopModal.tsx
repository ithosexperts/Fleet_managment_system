import React, { useState, useEffect } from 'react';
import { MapPin, X, Plus, Clock, Compass, AlertCircle, Check, Building2, Layers } from 'lucide-react';
import { api, getCurrentGpsPosition } from '../services/api';
import { TripStop, Destination } from '../types';
import { MapPicker } from './MapPicker';

interface Props {
  tripId: string;
  currentStopCount: number;
  initialDestination?: (Destination & { distanceKm?: number }) | null;
  currentDriverCoords?: { latitude: number; longitude: number };
  onSuccess: (newStop: TripStop) => void;
  onClose: () => void;
}

// Haversine Distance in Kilometers
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export const AddCustomStopModal: React.FC<Props> = ({
  tripId,
  currentStopCount,
  initialDestination,
  currentDriverCoords,
  onSuccess,
  onClose
}) => {
  const [name, setName] = useState(initialDestination?.name || '');
  const [address, setAddress] = useState(initialDestination?.address || '');
  const [latitude, setLatitude] = useState<number>(initialDestination?.latitude || currentDriverCoords?.latitude || 28.5355);
  const [longitude, setLongitude] = useState<number>(initialDestination?.longitude || currentDriverCoords?.longitude || 77.2680);
  const [geofenceRadius, setGeofenceRadius] = useState(initialDestination?.geofence_radius_meters || 150);
  const [plannedTime, setPlannedTime] = useState('');
  const [notes, setNotes] = useState(
    initialDestination
      ? `Nearest verified logistics facility (${initialDestination.distanceKm ? `${initialDestination.distanceKm} km away` : 'Selected via GPS radar'})`
      : ''
  );
  const [loadingGps, setLoadingGps] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [showMap, setShowMap] = useState(true);

  // Initialize planned time to 20 minutes from now and fetch fleet destinations
  useEffect(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 20);
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setPlannedTime(timeStr);

    // Fetch saved destinations to find nearest facilities
    api.fleet.getDestinations().then((res) => {
      if (res?.destinations) {
        setDestinations(res.destinations);
      }
    }).catch(() => {});

    // Only auto-fetch GPS if not already seeded by initial destination
    if (!initialDestination) {
      fetchCurrentPosition();
    }
  }, [initialDestination]);

  const fetchCurrentPosition = async () => {
    setLoadingGps(true);
    try {
      const coords = await getCurrentGpsPosition();
      if (coords.latitude && coords.longitude) {
        setLatitude(coords.latitude);
        setLongitude(coords.longitude);
        if (!address) {
          setAddress(`Current GPS Fix: ${Number(coords.latitude || 0).toFixed(4)}, ${Number(coords.longitude || 0).toFixed(4)} (±${coords.gps_accuracy}m)`);
        }
      }
    } catch {
      // Fallback already set
    } finally {
      setLoadingGps(false);
    }
  };

  const originLat = currentDriverCoords?.latitude ?? latitude;
  const originLng = currentDriverCoords?.longitude ?? longitude;

  // Rank nearest destinations by distance from driver vehicle GPS
  const rankedDestinations = destinations
    .filter((d) => d.latitude && d.longitude)
    .map((d) => ({
      ...d,
      distanceKm: calculateDistanceKm(originLat, originLng, d.latitude, d.longitude)
    }))
    .filter((d) => d.distanceKm > 0.05) // Filter out current facility if driver is already at depot/location
    .sort((a, b) => a.distanceKm - b.distanceKm);

  const selectDestination = (dest: Destination & { distanceKm: number }) => {
    setName(dest.name);
    setAddress(dest.address || '');
    setLatitude(dest.latitude);
    setLongitude(dest.longitude);
    setGeofenceRadius(dest.geofence_radius_meters || 150);
    if (!notes) {
      setNotes(`Nearest verified hub (${dest.distanceKm} km from GPS position)`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a name or landmark for this custom stop.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const stopPayload = {
      destination_name: name.trim(),
      address: address.trim() || 'Driver Custom Designated Stop',
      latitude: Number(latitude),
      longitude: Number(longitude),
      geofence_radius_meters: Number(geofenceRadius),
      planned_arrival_time: plannedTime,
      notes: notes.trim() ? `[Driver Custom Stop] ${notes.trim()}` : '[Driver Custom Stop added during transit]',
      stop_number: currentStopCount + 1
    };

    try {
      const res = await api.driver.addCustomStop(tripId, stopPayload);
      onSuccess(res.stop);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to add custom stop');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '540px', maxHeight: '92vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'rgba(37, 211, 102, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-whatsapp)'
              }}
            >
              <Plus size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0 }}>Add Custom Route Stop</h3>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>
                Drop a pin on map or select nearest verified logistics hub
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            style={{ padding: '6px', borderRadius: 'var(--radius-full)' }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {error && (
              <div
                style={{
                  padding: '10px 12px',
                  backgroundColor: 'var(--status-danger-bg)',
                  border: '1px solid var(--status-danger-border)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--status-danger)',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* NEAREST LOCATIONS TRACKED VIA GPS */}
            {rankedDestinations.length > 0 && (
              <div
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-whatsapp)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Compass size={13} /> Nearest Verified Hubs (Auto-Tracked via GPS)
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Tap to quick-fill</span>
                </div>

                <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
                  {rankedDestinations.slice(0, 4).map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => selectDestination(d)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 10px',
                        backgroundColor: name === d.name ? 'var(--accent-whatsapp)' : 'var(--bg-surface)',
                        color: name === d.name ? '#0b141a' : 'var(--text-primary)',
                        border: '1px solid var(--border-medium)',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.72rem',
                        fontWeight: name === d.name ? 700 : 500,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        flexShrink: 0
                      }}
                    >
                      <MapPin size={11} color={name === d.name ? '#0b141a' : 'var(--accent-whatsapp)'} />
                      <span>{d.name.length > 20 ? `${d.name.slice(0, 18)}...` : d.name}</span>
                      <span style={{ opacity: 0.8, fontWeight: 700 }}>({d.distanceKm} km)</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Interactive Map Picker with Click-to-Pin */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: 0 }}>
                  Pinpoint Location on Map
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={fetchCurrentPosition}
                    disabled={loadingGps}
                    style={{ padding: '2px 8px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Compass size={11} />
                    <span>{loadingGps ? 'Locating...' : 'My GPS'}</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setShowMap(!showMap)}
                    style={{ padding: '2px 8px', fontSize: '0.72rem' }}
                  >
                    {showMap ? 'Hide Map' : 'Show Map'}
                  </button>
                </div>
              </div>

              {showMap && (
                <MapPicker
                  initialLat={latitude}
                  initialLng={longitude}
                  initialRadius={geofenceRadius}
                  height="220px"
                  onChange={(data) => {
                    setLatitude(data.latitude);
                    setLongitude(data.longitude);
                    setGeofenceRadius(data.radiusMeters);
                  }}
                />
              )}
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                Stop Title / Location Name <span style={{ color: 'var(--status-danger)' }}>*</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Shell Petrol Pump, Client Annex Bay 3"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                Address / Landmark
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="Road name, sector, or landmark"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                  Planned Arrival (ETA)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="time"
                    className="form-input"
                    value={plannedTime}
                    onChange={(e) => setPlannedTime(e.target.value)}
                    required
                  />
                  <Clock
                    size={14}
                    style={{ position: 'absolute', right: '10px', top: '10px', pointerEvents: 'none', color: 'var(--text-muted)' }}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                  Stop Sequence
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={`Stop #${currentStopCount + 1}`}
                  disabled
                  style={{ opacity: 0.7 }}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                Reason / Special Instructions
              </label>
              <textarea
                className="form-input"
                rows={2}
                placeholder="e.g. Emergency tire refill, client requested immediate cargo drop, toll bottleneck"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '14px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
              style={{
                backgroundColor: 'var(--accent-whatsapp)',
                borderColor: 'var(--accent-whatsapp)',
                color: '#0b141a',
                fontWeight: 600
              }}
            >
              {submitting ? (
                'Adding Stop...'
              ) : (
                <>
                  <Check size={16} /> Add to Active Route
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
