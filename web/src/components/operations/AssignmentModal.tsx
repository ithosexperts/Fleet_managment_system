import React, { useState, useMemo } from 'react';
import {
  Truck,
  Users,
  Calendar,
  Clock,
  MapPin,
  AlertTriangle,
  CheckCircle,
  X,
  ShieldCheck,
  ArrowRight,
  UserCheck,
  Search
} from 'lucide-react';
import { Trip, Driver, Vehicle } from '../../types';

interface AssignmentModalProps {
  trip: Trip;
  drivers: Driver[];
  vehicles: Vehicle[];
  onConfirmAssignment: (tripId: string, driverId: string, vehicleId: string) => Promise<void>;
  onClose: () => void;
}

export const AssignmentModal: React.FC<AssignmentModalProps> = ({
  trip,
  drivers,
  vehicles,
  onConfirmAssignment,
  onClose
}) => {
  const [selectedDriverId, setSelectedDriverId] = useState<string>(trip.driver_id || '');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(trip.vehicle_id || '');
  const [driverSearch, setDriverSearch] = useState('');
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Selected driver object
  const selectedDriver = useMemo(
    () => drivers.find((d) => d.user_id === selectedDriverId || d.id === selectedDriverId),
    [drivers, selectedDriverId]
  );

  // Selected vehicle object
  const selectedVehicle = useMemo(
    () => vehicles.find((v) => v.id === selectedVehicleId),
    [vehicles, selectedVehicleId]
  );

  // Filtered available/eligible drivers
  const filteredDrivers = useMemo(() => {
    return drivers.filter((d) => {
      const matchesSearch =
        d.name.toLowerCase().includes(driverSearch.toLowerCase()) ||
        (d.phone && d.phone.includes(driverSearch)) ||
        d.employee_id.toLowerCase().includes(driverSearch.toLowerCase());
      return matchesSearch;
    });
  }, [drivers, driverSearch]);

  // Filtered available/eligible vehicles
  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      const matchesSearch =
        v.vehicle_number.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
        v.model.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
        v.vehicle_type.toLowerCase().includes(vehicleSearch.toLowerCase());
      return matchesSearch;
    });
  }, [vehicles, vehicleSearch]);

  // Conflict detection
  const hasDriverConflict = useMemo(() => {
    if (!selectedDriver) return false;
    return selectedDriver.status === 'ON_TRIP' && selectedDriver.active_trip_id !== trip.id;
  }, [selectedDriver, trip.id]);

  const hasVehicleConflict = useMemo(() => {
    if (!selectedVehicle) return false;
    return selectedVehicle.status === 'ON_TRIP' && selectedVehicle.active_trip_id !== trip.id;
  }, [selectedVehicle, trip.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDriverId) {
      setError('Please select an eligible driver for dispatch');
      return;
    }
    if (!selectedVehicleId) {
      setError('Please select an eligible vehicle for dispatch');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onConfirmAssignment(trip.id, selectedDriverId, selectedVehicleId);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to assign trip');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.72)',
        backdropFilter: 'blur(4px)',
        zIndex: 1200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        className="card-elevation-2"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
          width: '100%',
          maxWidth: '840px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-lg)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-card)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(23, 100, 168, 0.12)',
                color: 'var(--brand-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <UserCheck size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Dispatch Assignment Workflow
              </h2>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Trip Reference: <strong style={{ color: 'var(--brand-primary)' }}>{trip.id}</strong> • Departure:{' '}
                {trip.planned_departure_time || '08:00'} ({trip.date})
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              padding: '6px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {error && (
            <div
              style={{
                padding: '12px 16px',
                backgroundColor: 'var(--badge-delayed-bg)',
                border: '1px solid var(--badge-delayed-border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--badge-delayed-text)',
                fontSize: '0.86rem',
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              <AlertTriangle size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* Trip Summary Card */}
          <div
            style={{
              padding: '14px 18px',
              backgroundColor: 'var(--bg-card)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              marginBottom: '20px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '14px',
              fontSize: '0.86rem'
            }}
          >
            <div>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', display: 'block' }}>ORIGIN</span>
              <strong style={{ color: 'var(--text-primary)' }}>{trip.starting_location || 'Central Depot'}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', display: 'block' }}>DESTINATION(S)</span>
              <strong style={{ color: 'var(--text-primary)' }}>
                {trip.stops && trip.stops.length > 0
                  ? trip.stops.map((s) => s.destination_name).join(' → ')
                  : 'Multiple Delivery Stops'}
              </strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', display: 'block' }}>PURPOSE / ORDER</span>
              <strong style={{ color: 'var(--text-primary)' }}>{trip.purpose || 'Client Logistics'}</strong>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {/* 1. SELECT DRIVER */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={16} color="var(--brand-primary)" />
                  1. Eligible Drivers ({filteredDrivers.length})
                </label>
              </div>

              {/* Driver search input */}
              <div style={{ position: 'relative' }}>
                <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input
                  type="text"
                  placeholder="Search driver by name or ID..."
                  value={driverSearch}
                  onChange={(e) => setDriverSearch(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', paddingLeft: '32px', fontSize: '0.84rem' }}
                />
              </div>

              {/* Drivers Scrollable List */}
              <div
                style={{
                  maxHeight: '260px',
                  overflowY: 'auto',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-card)',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {filteredDrivers.map((driver) => {
                  const isSelected = (selectedDriverId === driver.user_id || selectedDriverId === driver.id);
                  const isAvailable = driver.status === 'AVAILABLE';
                  const isOnTrip = driver.status === 'ON_TRIP';

                  return (
                    <div
                      key={driver.id}
                      onClick={() => setSelectedDriverId(driver.user_id || driver.id)}
                      style={{
                        padding: '12px 14px',
                        borderBottom: '1px solid var(--border-subtle)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: isSelected ? 'rgba(23, 100, 168, 0.12)' : 'transparent',
                        borderLeft: isSelected ? '3px solid var(--brand-primary)' : '3px solid transparent'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: isSelected ? 'var(--brand-primary)' : 'var(--text-primary)' }}>
                          {driver.name}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          ID: {driver.employee_id} • Ph: {driver.phone || 'N/A'}
                        </div>
                      </div>

                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          backgroundColor: isAvailable
                            ? 'var(--badge-completed-bg)'
                            : isOnTrip
                            ? 'var(--badge-delayed-bg)'
                            : 'var(--bg-surface)',
                          color: isAvailable
                            ? 'var(--badge-completed-text)'
                            : isOnTrip
                            ? 'var(--badge-delayed-text)'
                            : 'var(--text-secondary)',
                          border: `1px solid ${
                            isAvailable
                              ? 'var(--badge-completed-border)'
                              : isOnTrip
                              ? 'var(--badge-delayed-border)'
                              : 'var(--border-subtle)'
                          }`
                        }}
                      >
                        {driver.status}
                      </span>
                    </div>
                  );
                })}
              </div>

              {hasDriverConflict && (
                <div
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--badge-delayed-bg)',
                    border: '1px solid var(--badge-delayed-border)',
                    color: 'var(--badge-delayed-text)',
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <AlertTriangle size={14} />
                  <span>Conflict: This driver is currently engaged on an active trip.</span>
                </div>
              )}
            </div>

            {/* 2. SELECT VEHICLE */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Truck size={16} color="var(--brand-primary)" />
                  2. Eligible Vehicles ({filteredVehicles.length})
                </label>
              </div>

              {/* Vehicle search input */}
              <div style={{ position: 'relative' }}>
                <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input
                  type="text"
                  placeholder="Search vehicle plate or model..."
                  value={vehicleSearch}
                  onChange={(e) => setVehicleSearch(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', paddingLeft: '32px', fontSize: '0.84rem' }}
                />
              </div>

              {/* Vehicles Scrollable List */}
              <div
                style={{
                  maxHeight: '260px',
                  overflowY: 'auto',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-card)',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {filteredVehicles.map((vehicle) => {
                  const isSelected = selectedVehicleId === vehicle.id;
                  const isAvailable = vehicle.status === 'AVAILABLE';
                  const isOnTrip = vehicle.status === 'ON_TRIP';

                  return (
                    <div
                      key={vehicle.id}
                      onClick={() => setSelectedVehicleId(vehicle.id)}
                      style={{
                        padding: '12px 14px',
                        borderBottom: '1px solid var(--border-subtle)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: isSelected ? 'rgba(23, 100, 168, 0.12)' : 'transparent',
                        borderLeft: isSelected ? '3px solid var(--brand-primary)' : '3px solid transparent'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: isSelected ? 'var(--brand-primary)' : 'var(--text-primary)' }}>
                          {vehicle.vehicle_number}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          {vehicle.model} • {vehicle.vehicle_type}
                        </div>
                      </div>

                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          backgroundColor: isAvailable
                            ? 'var(--badge-completed-bg)'
                            : isOnTrip
                            ? 'var(--badge-delayed-bg)'
                            : 'var(--bg-surface)',
                          color: isAvailable
                            ? 'var(--badge-completed-text)'
                            : isOnTrip
                            ? 'var(--badge-delayed-text)'
                            : 'var(--text-secondary)',
                          border: `1px solid ${
                            isAvailable
                              ? 'var(--badge-completed-border)'
                              : isOnTrip
                              ? 'var(--badge-delayed-border)'
                              : 'var(--border-subtle)'
                          }`
                        }}
                      >
                        {vehicle.status}
                      </span>
                    </div>
                  );
                })}
              </div>

              {hasVehicleConflict && (
                <div
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--badge-delayed-bg)',
                    border: '1px solid var(--badge-delayed-border)',
                    color: 'var(--badge-delayed-text)',
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <AlertTriangle size={14} />
                  <span>Conflict: This vehicle is currently on road or under maintenance.</span>
                </div>
              )}
            </div>
          </div>

          {/* 3. ASSIGNMENT CONFIRMATION SUMMARY */}
          {selectedDriver && selectedVehicle && (
            <div
              style={{
                marginTop: '20px',
                padding: '14px 18px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(23, 100, 168, 0.06)',
                border: '1px solid rgba(23, 100, 168, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <ShieldCheck size={26} color="var(--brand-primary)" />
                <div>
                  <div style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Ready for Dispatch Confirmation
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Assigned Driver: <strong>{selectedDriver.name}</strong> • Vehicle: <strong>{selectedVehicle.vehicle_number}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div
            style={{
              marginTop: '24px',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              borderTop: '1px solid var(--border-subtle)',
              paddingTop: '16px'
            }}
          >
            <button
              type="button"
              className="btn btn-outline"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving || !selectedDriverId || !selectedVehicleId}
              style={{ minWidth: '160px' }}
            >
              {saving ? 'Assigning...' : 'Confirm Dispatch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
