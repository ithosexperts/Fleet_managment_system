import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, ArrowUp, ArrowDown, MapPin, Calendar, Clock, Truck, UserCheck, Shield } from 'lucide-react';
import { api } from '../services/api';
import { Driver, Vehicle, Destination } from '../types';
import { MapPicker } from './MapPicker';
import { SearchableDropdown } from './common/SearchableDropdown';
import { LocationSearchInput } from './common/LocationSearchInput';

interface Props {
  onSuccess: (tripId: string) => void;
  onClose: () => void;
}

interface NewStopItem {
  id: string;
  destination_id?: string;
  destination_name: string;
  address: string;
  latitude: number;
  longitude: number;
  geofence_radius_meters: number;
  planned_arrival_time: string;
  notes?: string;
}

export const TripCreatorModal: React.FC<Props> = ({ onSuccess, onClose }) => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [activeMapPickerStopIdx, setActiveMapPickerStopIdx] = useState<number | null>(null);
  const [tempPickerCoords, setTempPickerCoords] = useState<{ latitude: number; longitude: number; radiusMeters: number } | null>(null);
  const [saveToFleetHubs, setSaveToFleetHubs] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const [date, setDate] = useState(today);
  const [driverId, setDriverId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [startingLocation, setStartingLocation] = useState('Company Central Depot');
  const [plannedDepartureTime, setPlannedDepartureTime] = useState('08:00');
  const [purpose, setPurpose] = useState('Retail Restock & Wholesale Orders');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');

  const [stops, setStops] = useState<NewStopItem[]>([
    {
      id: '1',
      destination_name: '',
      address: '',
      latitude: 23.2599,
      longitude: 77.4126,
      geofence_radius_meters: 150,
      planned_arrival_time: '09:00'
    }
  ]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFleetData();
  }, []);

  const fetchFleetData = async () => {
    try {
      const [vRes, dRes, destRes] = await Promise.all([
        api.fleet.getVehicles(),
        api.fleet.getDrivers(),
        api.fleet.getDestinations()
      ]);

      setVehicles(vRes.vehicles);
      setDrivers(dRes.drivers);
      setDestinations(destRes.destinations);

      // Default select first available vehicle and driver
      const availV = vRes.vehicles.find((v: Vehicle) => v.status === 'AVAILABLE') || vRes.vehicles[0];
      if (availV) setVehicleId(availV.id);

      const availD = dRes.drivers.find((d: Driver) => d.status === 'AVAILABLE') || dRes.drivers[0];
      if (availD) setDriverId(availD.user_id);

      // Pre-fill first stop with a saved destination if available
      if (destRes.destinations.length > 0) {
        const first = destRes.destinations[0];
        setStops([
          {
            id: '1',
            destination_id: first.id,
            destination_name: first.name,
            address: first.address,
            latitude: first.latitude,
            longitude: first.longitude,
            geofence_radius_meters: first.geofence_radius_meters,
            planned_arrival_time: '09:00'
          }
        ]);
      }
    } catch (err: any) {
      console.error('Fleet fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSavedDestinationSelect = (index: number, destId: string) => {
    const found = destinations.find((d) => d.id === destId);
    if (!found) return;

    setStops((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        destination_id: found.id,
        destination_name: found.name,
        address: found.address,
        latitude: found.latitude,
        longitude: found.longitude,
        geofence_radius_meters: found.geofence_radius_meters
      };
      return copy;
    });
  };

  const addStop = () => {
    const nextNum = stops.length + 1;
    let nextDest: Destination | undefined;
    if (destinations.length >= nextNum) {
      nextDest = destinations[nextNum - 1];
    } else if (destinations.length > 0) {
      nextDest = destinations[0];
    }

    setStops((prev) => [
      ...prev,
      {
        id: `stop_${Date.now()}`,
        destination_id: nextDest?.id,
        destination_name: nextDest?.name || `Destination ${nextNum}`,
        address: nextDest?.address || '',
        latitude: nextDest?.latitude || 23.25,
        longitude: nextDest?.longitude || 77.41,
        geofence_radius_meters: nextDest?.geofence_radius_meters || 150,
        planned_arrival_time: `${10 + nextNum}:00`
      }
    ]);
  };

  const removeStop = (index: number) => {
    if (stops.length <= 1) {
      alert('A trip must have at least 1 destination stop.');
      return;
    }
    setStops((prev) => prev.filter((_, i) => i !== index));
  };

  const moveStop = (index: number, direction: 'UP' | 'DOWN') => {
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= stops.length) return;

    setStops((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    if (!driverId || !vehicleId || stops.length === 0) {
      setError('Please select a driver, vehicle, and at least 1 destination stop.');
      setSubmitting(false);
      return;
    }

    try {
      const res = await api.manager.createTrip({
        date,
        driver_id: driverId,
        vehicle_id: vehicleId,
        starting_location: startingLocation,
        starting_latitude: 28.5355,
        starting_longitude: 77.2680,
        planned_departure_time: plannedDepartureTime,
        purpose,
        reference_number: referenceNumber || undefined,
        notes: notes || undefined,
        stops: stops.map((s, idx) => ({
          destination_id: s.destination_id || undefined,
          stop_number: idx + 1,
          destination_name: s.destination_name,
          address: s.address,
          latitude: Number(s.latitude || 28.5355),
          longitude: Number(s.longitude || 77.2680),
          geofence_radius_meters: Number(s.geofence_radius_meters || 150),
          planned_arrival_time: s.planned_arrival_time,
          notes: s.notes
        }))
      });

      onSuccess(res.tripId);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create trip');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <style>{`
        @media (max-width: 640px) {
          .trip-modal-grid-2 {
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }
          .trip-modal-stop-grid {
            grid-template-columns: 1fr !important;
            gap: 8px !important;
          }
        }
      `}</style>
      <div className="modal-content" style={{ maxWidth: '680px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Truck size={22} color="var(--accent-gold)" />
            <h3 style={{ fontSize: '1.2rem' }}>Create New Logistics Trip</h3>
          </div>
          <button className="btn btn-secondary" onClick={onClose} style={{ padding: '6px' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {error && (
              <div style={{ padding: '12px', background: 'var(--status-danger-bg)', color: 'var(--status-danger)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
                {error}
              </div>
            )}

            {/* Row 1: Date & Departure Time */}
            <div className="trip-modal-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">
                  <Calendar size={13} style={{ display: 'inline', marginRight: '4px' }} />
                  Trip Date
                </label>
                <input
                  type="date"
                  className="form-input"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">
                  <Clock size={13} style={{ display: 'inline', marginRight: '4px' }} />
                  Planned Departure
                </label>
                <input
                  type="time"
                  className="form-input"
                  value={plannedDepartureTime}
                  onChange={(e) => setPlannedDepartureTime(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Row 2: Driver & Vehicle Selection */}
            <div className="trip-modal-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">
                  <UserCheck size={13} style={{ display: 'inline', marginRight: '4px' }} />
                  Assign Driver
                </label>
                <SearchableDropdown
                  value={driverId}
                  onChange={(value) => setDriverId(value as string)}
                  required
                  placeholder="Select Company Driver"
                  options={drivers.map((d) => ({ value: d.user_id, label: `${d.name} (${d.employee_id}) — ${d.status}` }))}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">
                  <Truck size={13} style={{ display: 'inline', marginRight: '4px' }} />
                  Assign Vehicle
                </label>
                <SearchableDropdown
                  value={vehicleId}
                  onChange={(value) => setVehicleId(value as string)}
                  required
                  placeholder="Select Company Vehicle"
                  options={vehicles.map((v) => ({ value: v.id, label: `${v.vehicle_number} (${v.model}) — ${v.status}` }))}
                />
              </div>
            </div>

            {/* Row 3: Starting Location & Purpose */}
            <div className="trip-modal-grid-2" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Starting Base / Depot</label>
                <input
                  type="text"
                  className="form-input"
                  value={startingLocation}
                  onChange={(e) => setStartingLocation(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Order / Reference #</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="PO-2026-XXXX"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                />
              </div>
            </div>

            {/* MULTI-DESTINATION STOP BUILDER */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div>
                  <h4 style={{ fontSize: '1rem', color: 'var(--accent-gold)' }}>
                    Destination Route Stops ({stops.length})
                  </h4>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Add, reorder, or pick from saved company locations. This entire route is ONE trip.
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '0.82rem' }}
                  onClick={addStop}
                >
                  <Plus size={14} /> Add Destination
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {stops.map((stop, idx) => (
                  <div
                    key={stop.id}
                    style={{
                      padding: '14px',
                      backgroundColor: 'var(--bg-secondary)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--accent-gold)',
                            color: '#0d0e11',
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          {idx + 1}
                        </span>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                          Stop #{idx + 1}
                        </span>
                      </div>

                      {/* Stop Controls: Reorder Up/Down and Delete */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ padding: '4px 6px' }}
                          onClick={() => moveStop(idx, 'UP')}
                          disabled={idx === 0}
                          title="Move earlier"
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ padding: '4px 6px' }}
                          onClick={() => moveStop(idx, 'DOWN')}
                          disabled={idx === stops.length - 1}
                          title="Move later"
                        >
                          <ArrowDown size={14} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger"
                          style={{ padding: '4px 6px' }}
                          onClick={() => removeStop(idx)}
                          disabled={stops.length <= 1}
                          title="Remove stop"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Pick from saved destination */}
                    {destinations.length > 0 && (
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <SearchableDropdown
                          value={stop.destination_id || ''}
                          onChange={(value) => handleSavedDestinationSelect(idx, value as string)}
                          placeholder="Choose from saved company destinations"
                          options={destinations.map((d) => ({ value: d.id, label: `${d.name} (${d.address})` }))}
                        />
                      </div>
                    )}

                    <div className="trip-modal-stop-grid" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '10px' }}>
                      <div>
                        <LocationSearchInput
                          placeholder="Search place, landmark, or database hub..."
                          initialValue={stop.destination_name}
                          savedDestinations={destinations.map(d => ({ id: d.id, name: d.name, address: d.address, latitude: d.latitude, longitude: d.longitude }))}
                          proximity={{ latitude: stop.latitude || 28.5355, longitude: stop.longitude || 77.2680 }}
                          onSelect={(place) => {
                            setStops((prev) => {
                              const c = [...prev];
                              c[idx] = {
                                ...c[idx],
                                destination_name: place.name,
                                address: place.address,
                                latitude: place.latitude,
                                longitude: place.longitude,
                                destination_id: place.isSavedDestination ? place.id.replace('saved-', '') : undefined
                              };
                              return c;
                            });
                          }}
                        />
                      </div>

                      <input
                        type="time"
                        className="form-input"
                        title="Planned Arrival Time"
                        value={stop.planned_arrival_time}
                        onChange={(e) => {
                          const val = e.target.value;
                          setStops((prev) => {
                            const c = [...prev];
                            c[idx].planned_arrival_time = val;
                            return c;
                          });
                        }}
                        required
                      />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                      <input
                        type="text"
                        className="form-input"
                        style={{ flex: '1 1 180px', minWidth: '0' }}
                        placeholder="Destination address"
                        value={stop.address}
                        onChange={(e) => {
                          const val = e.target.value;
                          setStops((prev) => {
                            const c = [...prev];
                            c[idx].address = val;
                            return c;
                          });
                        }}
                        required
                      />

                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          setActiveMapPickerStopIdx(idx);
                          setTempPickerCoords({
                            latitude: stop.latitude || 28.5355,
                            longitude: stop.longitude || 77.2680,
                            radiusMeters: stop.geofence_radius_meters || 150
                          });
                        }}
                        style={{
                          fontSize: '0.76rem',
                          padding: '6px 12px',
                          color: 'var(--accent-whatsapp)',
                          borderColor: 'rgba(37, 211, 102, 0.4)',
                          whiteSpace: 'nowrap',
                          gap: '5px'
                        }}
                      >
                        <MapPin size={13} />
                        <span>📍 Pick on Map</span>
                      </button>
                    </div>

                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      GPS: <b>{Number(stop.latitude || 0).toFixed(4)}° N, {Number(stop.longitude || 0).toFixed(4)}° E</b> &bull; Geofence: <b>{stop.geofence_radius_meters}m</b>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Creating Trip...' : 'Create & Schedule Trip'}
            </button>
          </div>
        </form>
      </div>

      {/* Interactive Map Picker Sub-Modal */}
      {activeMapPickerStopIdx !== null && (
        <div
          className="modal-overlay"
          style={{ zIndex: 1200, backgroundColor: 'rgba(11, 16, 27, 0.65)', backdropFilter: 'blur(5px)' }}
          onClick={() => setActiveMapPickerStopIdx(null)}
        >
          <div
            className="modal-content"
            style={{ maxWidth: '620px', maxHeight: '92vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
                  📍 Choose Stop Location on Live Map
                </h3>
                <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                  Click anywhere on the map or search to drop a pinpoint location for Stop #{activeMapPickerStopIdx + 1}
                </p>
              </div>
              <button
                type="button"
                className="btn btn-subtle"
                onClick={() => setActiveMapPickerStopIdx(null)}
                style={{ padding: '6px' }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <MapPicker
                initialLat={stops[activeMapPickerStopIdx].latitude || 28.5355}
                initialLng={stops[activeMapPickerStopIdx].longitude || 77.2680}
                initialRadius={stops[activeMapPickerStopIdx].geofence_radius_meters || 150}
                height="340px"
                savedDestinations={destinations.map((d) => ({ id: d.id, name: d.name, address: d.address, latitude: d.latitude, longitude: d.longitude }))}
                onChange={(coords) => setTempPickerCoords(coords)}
                onPlaceSelect={(place) => {
                  setTempPickerCoords({
                    latitude: place.latitude,
                    longitude: place.longitude,
                    radiusMeters: stops[activeMapPickerStopIdx].geofence_radius_meters || 150
                  });
                  setStops((prev) => {
                    const copy = [...prev];
                    copy[activeMapPickerStopIdx] = {
                      ...copy[activeMapPickerStopIdx],
                      destination_name: place.name,
                      address: place.address,
                      latitude: place.latitude,
                      longitude: place.longitude,
                      destination_id: place.isSavedDestination ? place.id.replace('saved-', '') : undefined
                    };
                    return copy;
                  });
                }}
              />

              <div style={{ padding: '10px 12px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', fontSize: '0.8rem' }}>
                <div>Selected Coordinates: <b>{tempPickerCoords ? `${Number(tempPickerCoords.latitude || 0).toFixed(4)}°, ${Number(tempPickerCoords.longitude || 0).toFixed(4)}°` : 'Default Depot'}</b></div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.74rem', marginTop: '2px' }}>
                  Geofence Arrival Detection: <b>&plusmn;{tempPickerCoords?.radiusMeters || 150} meters</b>
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                <input
                  type="checkbox"
                  checked={saveToFleetHubs}
                  onChange={(e) => setSaveToFleetHubs(e.target.checked)}
                />
                <span>Also save this custom location into Company Fleet Hubs for future trips</span>
              </label>
            </div>

            <div className="modal-footer" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setActiveMapPickerStopIdx(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                style={{
                  backgroundColor: 'var(--accent-whatsapp)',
                  borderColor: 'var(--accent-whatsapp)',
                  color: '#0b141a',
                  fontWeight: 700
                }}
                onClick={async () => {
                  if (activeMapPickerStopIdx !== null && tempPickerCoords) {
                    const idx = activeMapPickerStopIdx;
                    const lat = tempPickerCoords.latitude;
                    const lng = tempPickerCoords.longitude;
                    const radius = tempPickerCoords.radiusMeters;

                    setStops((prev) => {
                      const copy = [...prev];
                      copy[idx] = {
                        ...copy[idx],
                        latitude: lat,
                        longitude: lng,
                        geofence_radius_meters: radius,
                        address: copy[idx].address || `Location @ ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
                        destination_name: copy[idx].destination_name || `Custom Stop #${idx + 1}`
                      };
                      return copy;
                    });

                    if (saveToFleetHubs) {
                      try {
                        const newDest = await api.fleet.createDestination({
                          name: stops[idx].destination_name || `Custom Stop Location`,
                          address: stops[idx].address || `Delhi-NCR Route Stop`,
                          latitude: lat,
                          longitude: lng,
                          geofence_radius_meters: radius
                        });
                        if (newDest?.destination) {
                          setDestinations((prev) => [newDest.destination, ...prev]);
                        }
                      } catch (err) {
                        console.error('Failed to save to hubs:', err);
                      }
                    }

                    setActiveMapPickerStopIdx(null);
                  }
                }}
              >
                Apply Location to Stop #{activeMapPickerStopIdx + 1}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
