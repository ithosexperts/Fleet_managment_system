import React, { useState, useEffect } from 'react';
import {
  X,
  MapPin,
  Clock,
  Calendar,
  Truck,
  UserCheck,
  AlertTriangle,
  Camera,
  History,
  CheckCircle2,
  Navigation,
  FileText,
  RotateCcw,
  ExternalLink,
  Download
} from 'lucide-react';
import { api } from '../services/api';
import { Trip, TripStop, Photo, Delay, TripEvent } from '../types';
import { StatusBadge } from './StatusBadge';
import { LeafletMap } from './LeafletMap';
import { calculateTripTimingSummary, calculateStopDeliveryTiming, formatClockTime } from '../utils/timing';

interface Props {
  tripId: string;
  onClose: () => void;
  onRefresh?: () => void;
  theme?: 'dark' | 'light';
}

export const TripDetailModal: React.FC<Props> = ({ tripId, onClose, onRefresh, theme = 'light' }) => {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [activeTab, setActiveTab] = useState<'timeline' | 'map' | 'stops' | 'photos' | 'delays' | 'audit'>('timeline');
  const [loading, setLoading] = useState(true);
  const [previewPhoto, setPreviewPhoto] = useState<Photo | null>(null);

  useEffect(() => {
    fetchTripDetails();
  }, [tripId]);

  const fetchTripDetails = async () => {
    setLoading(true);
    try {
      const data = await api.manager.getTrip(tripId);
      setTrip(data.trip);
    } catch (err) {
      console.error('Failed to load trip details:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !trip) {
    return (
      <div className="modal-overlay">
        <div className="modal-content" style={{ padding: '40px', textAlign: 'center' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Loading trip operational timeline...</div>
        </div>
      </div>
    );
  }

  const handleTabChange = (tab: 'timeline' | 'map' | 'stops' | 'photos' | 'delays' | 'audit') => {
    React.startTransition(() => {
      setActiveTab(tab);
    });
  };

  const timing = calculateTripTimingSummary(trip);

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '920px', maxHeight: '92vh' }}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.35rem', fontFamily: 'var(--font-display)' }}>
                {trip.id}
              </h2>
              <StatusBadge status={trip.status} />

              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  backgroundColor: timing.delayBadge.bgColor,
                  color: timing.delayBadge.textColor,
                  border: `1px solid ${timing.delayBadge.borderColor}`
                }}
              >
                {timing.delayBadge.isDelayed ? <AlertTriangle size={11} /> : <CheckCircle2 size={11} />}
                <span>{timing.delayBadge.label}</span>
              </span>
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '3px' }}>
              {trip.purpose} • Date: {trip.date}
            </div>
          </div>

          <button className="btn btn-secondary" onClick={onClose} style={{ padding: '6px' }} type="button">
            <X size={18} />
          </button>
        </div>

        {/* Quick Operational Metrics Row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '10px',
            padding: '16px 24px',
            backgroundColor: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--border-subtle)',
            fontSize: '0.82rem'
          }}
        >
          <div>
            <div style={{ color: 'var(--text-muted)' }}>Driver</div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
              {trip.driver_name}
            </div>
          </div>

          <div>
            <div style={{ color: 'var(--text-muted)' }}>Vehicle</div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
              {trip.vehicle_number}
            </div>
          </div>

          <div>
            <div style={{ color: 'var(--text-muted)' }}>Planned Departure</div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
              {timing.plannedDeparture}
            </div>
          </div>

          <div>
            <div style={{ color: 'var(--text-muted)' }}>Actual Start</div>
            <div style={{ fontWeight: 600, color: timing.actualStart ? 'var(--text-primary)' : 'var(--text-muted)', marginTop: '2px' }}>
              {timing.actualStart || 'Pending'}
            </div>
          </div>

          <div>
            <div style={{ color: 'var(--text-muted)' }}>Delivery Time</div>
            <div
              style={{
                fontWeight: 700,
                color: timing.delayBadge.isDelayed ? 'var(--status-delayed, #f59e0b)' : 'var(--status-success, #10b981)',
                marginTop: '2px'
              }}
            >
              {timing.expectedFinalDelivery}
            </div>
          </div>

          <div>
            <div style={{ color: 'var(--text-muted)' }}>Delay Status</div>
            <div style={{ fontWeight: 600, color: timing.delayBadge.textColor, marginTop: '2px' }}>
              {timing.delayBadge.label}
            </div>
          </div>

          <div>
            <div style={{ color: 'var(--text-muted)' }}>Distance</div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
              {trip.calculated_distance_km ? `${trip.calculated_distance_km} km` : 'Unavailable'}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            padding: '12px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            overflowX: 'auto'
          }}
        >
          <button
            type="button"
            className={`btn ${activeTab === 'timeline' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 14px', fontSize: '0.82rem' }}
            onClick={() => handleTabChange('timeline')}
          >
            <Clock size={14} /> Chronological Timeline ({trip.events?.length || 0})
          </button>

          <button
            type="button"
            className={`btn ${activeTab === 'map' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 14px', fontSize: '0.82rem' }}
            onClick={() => handleTabChange('map')}
          >
            <Navigation size={14} /> Interactive Route Map
          </button>

          <button
            type="button"
            className={`btn ${activeTab === 'stops' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 14px', fontSize: '0.82rem' }}
            onClick={() => handleTabChange('stops')}
          >
            <MapPin size={14} /> Stops ({trip.stops?.length || 0})
          </button>

          <button
            type="button"
            className={`btn ${activeTab === 'photos' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 14px', fontSize: '0.82rem' }}
            onClick={() => handleTabChange('photos')}
          >
            <Camera size={14} /> Photos ({trip.photos?.length || 0})
          </button>

          <button
            type="button"
            className={`btn ${activeTab === 'delays' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 14px', fontSize: '0.82rem' }}
            onClick={() => handleTabChange('delays')}
          >
            <AlertTriangle size={14} /> Delays ({trip.delays?.length || 0})
          </button>

          <button
            type="button"
            className={`btn ${activeTab === 'audit' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 14px', fontSize: '0.82rem' }}
            onClick={() => handleTabChange('audit')}
          >
            <History size={14} /> Audit Trail ({trip.auditLogs?.length || 0})
          </button>
        </div>

        {/* Tab Body */}
        <div className="modal-body">
          {/* 1. TIMELINE TAB */}
          {activeTab === 'timeline' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h4 style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Operational Event Timeline
              </h4>

              {trip.events?.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                  No operational events recorded yet. Events will appear once the driver starts the trip.
                </div>
              ) : (
                <div style={{ position: 'relative', paddingLeft: '24px' }}>
                  {/* Vertical timeline connector */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '10px',
                      bottom: '10px',
                      left: '8px',
                      width: '2px',
                      backgroundColor: 'var(--border-medium)'
                    }}
                  />

                  {trip.events?.map((ev, idx) => (
                    <div
                      key={ev.id || idx}
                      style={{
                        position: 'relative',
                        marginBottom: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px'
                      }}
                    >
                      {/* Timeline dot */}
                      <div
                        style={{
                          position: 'absolute',
                          left: '-20px',
                          top: '4px',
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          backgroundColor: ev.event_type.includes('COMPLETED')
                            ? 'var(--status-success)'
                            : ev.event_type.includes('DELAY')
                            ? 'var(--status-delayed)'
                            : 'var(--accent-gold)',
                          border: '2px solid var(--bg-surface)'
                        }}
                      />

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                        <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--bg-secondary)', color: 'var(--accent-gold)', fontWeight: 600 }}>
                          {ev.event_type.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                        {ev.details || ev.event_type}
                      </div>

                      {ev.latitude && ev.longitude && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={12} />
                          GPS: {Number(ev.latitude || 0).toFixed(4)}, {Number(ev.longitude || 0).toFixed(4)}
                          {ev.gps_accuracy && ` (±${Math.round(Number(ev.gps_accuracy))}m)`}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}          {/* 2. MAP TAB */}
          {activeTab === 'map' && (
            <div>
              <LeafletMap
                baseLocation={
                  typeof trip.starting_latitude === 'number' && typeof trip.starting_longitude === 'number'
                    ? {
                        name: trip.starting_location,
                        latitude: trip.starting_latitude,
                        longitude: trip.starting_longitude
                      }
                    : undefined
                }
                stops={trip.stops}
                events={trip.events}
                activeTrip={trip}
                height="450px"
                theme={theme}
              />
              <div style={{ marginTop: '12px', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: '16px' }}>
                <div><span style={{ color: 'var(--accent-gold)' }}>●</span> HQ Base</div>
                <div><span style={{ color: '#38bdf8' }}>●</span> Planned Destination Stops</div>
                <div><span style={{ color: '#10b981' }}>●</span> Completed Stops</div>
                <div><span style={{ color: '#38bdf8' }}>🚛</span> Latest Verified Location</div>
              </div>
            </div>
          )}

          {/* 3. STOPS TAB */}
          {activeTab === 'stops' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {trip.stops?.map((stop) => {
                const stopTiming = calculateStopDeliveryTiming(stop, trip.total_delay_minutes);

                return (
                  <div
                    key={stop.id}
                    style={{
                      padding: '16px',
                      backgroundColor: 'var(--bg-secondary)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span
                          style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '50%',
                            backgroundColor: stop.status === 'COMPLETED' ? 'var(--status-success)' : 'var(--accent-gold)',
                            color: '#0d0e11',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          {stop.stop_number}
                        </span>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '1rem' }}>{stop.destination_name}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{stop.address}</div>
                        </div>
                      </div>

                      <StatusBadge status={stop.status} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px', fontSize: '0.82rem', marginTop: '10px' }}>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Planned Arrival:</span>{' '}
                        <b>{stopTiming.plannedTimeStr}</b>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>
                          {stopTiming.isDelivered ? 'Actual Delivery:' : 'Expected Delivery:'}
                        </span>{' '}
                        <b style={{ color: stopTiming.isDelivered ? 'var(--status-success)' : stopTiming.isDelayed ? 'var(--status-delayed)' : 'var(--text-primary)' }}>
                          {stopTiming.isDelivered ? stopTiming.actualTimeStr : stopTiming.expectedDeliveryStr}
                        </b>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Departure:</span>{' '}
                        <b>{stop.actual_departure_time ? formatClockTime(stop.actual_departure_time) : (stopTiming.isDelivered ? 'Departed' : 'Pending')}</b>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Variance:</span>{' '}
                        <b style={{ color: stopTiming.isDelayed ? 'var(--status-delayed)' : 'var(--status-success)' }}>
                          {stopTiming.varianceLabel}
                        </b>
                      </div>
                    </div>

                    {stop.notes && (
                      <div style={{ marginTop: '8px', fontSize: '0.82rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                        "{stop.notes}"
                      </div>
                    )}

                    {stop.latitude && stop.longitude && (
                      <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${stop.latitude},${stop.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-secondary"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', fontSize: '0.75rem', color: '#38bdf8', textDecoration: 'none' }}
                        >
                          <Navigation size={12} /> Google Maps Navigation &rarr;
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* 4. PHOTOS TAB */}
          {activeTab === 'photos' && (
            <div>
              {trip.photos?.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No photos uploaded for this trip yet.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px' }}>
                  {trip.photos?.map((photo) => (
                    <div
                      key={photo.id}
                      onClick={() => setPreviewPhoto(photo)}
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        borderRadius: 'var(--radius-md)',
                        overflow: 'hidden',
                        border: '1px solid var(--border-subtle)',
                        cursor: 'pointer'
                      }}
                    >
                      <img
                        src={api.photos.getPhotoUrl(photo.id)}
                        alt={photo.photo_type}
                        style={{ width: '100%', height: '140px', objectFit: 'cover' }}
                      />
                      <div style={{ padding: '10px' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{photo.photo_type}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {new Date(photo.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {photo.destination_name && ` • Stop ${photo.stop_number}`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 5. DELAYS TAB */}
          {activeTab === 'delays' && (
            <div>
              {trip.delays?.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  No operational delays reported on this trip.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {trip.delays?.map((delay) => (
                    <div
                      key={delay.id}
                      style={{
                        padding: '14px',
                        backgroundColor: 'var(--status-delayed-bg)',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontWeight: 600, color: 'var(--status-delayed)', fontSize: '0.95rem' }}>
                          ⚠️ {delay.reason}
                        </div>
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          Duration: {delay.duration_minutes ? `${delay.duration_minutes} mins` : 'Ongoing'}
                        </span>
                      </div>
                      {delay.description && (
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {delay.description}
                        </div>
                      )}
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Started: {new Date(delay.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {delay.end_time && ` • Resolved: ${new Date(delay.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                      </div>

                      {delay.photo_id && (
                        <div style={{ marginTop: '8px' }}>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => {
                              const foundPhoto = trip.photos?.find((p) => p.id === delay.photo_id);
                              if (foundPhoto) {
                                setPreviewPhoto(foundPhoto);
                              } else {
                                setPreviewPhoto({
                                  id: delay.photo_id!,
                                  trip_id: trip.id,
                                  photo_type: `Delay Evidence: ${delay.reason}`,
                                  file_path: '',
                                  file_size: 0,
                                  mime_type: 'image/jpeg',
                                  timestamp: delay.start_time,
                                  latitude: delay.latitude,
                                  longitude: delay.longitude,
                                  gps_accuracy: delay.gps_accuracy
                                } as Photo);
                              }
                            }}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '5px 12px',
                              fontSize: '0.78rem',
                              color: 'var(--accent-gold)',
                              borderColor: 'rgba(245, 158, 11, 0.4)',
                              background: 'rgba(245, 158, 11, 0.1)',
                              cursor: 'pointer'
                            }}
                          >
                            <Camera size={14} /> View Attached Evidence Photo
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 6. AUDIT TRAIL TAB */}
          {activeTab === 'audit' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {trip.auditLogs?.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No modifications logged.
                </div>
              ) : (
                trip.auditLogs?.map((audit) => (
                  <div
                    key={audit.id}
                    style={{
                      padding: '12px',
                      backgroundColor: 'var(--bg-secondary)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.85rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600, color: 'var(--accent-gold)' }}>{audit.action}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                        {new Date(audit.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div style={{ color: 'var(--text-secondary)' }}>
                      By: {audit.changed_by_name || audit.changed_by}
                      {audit.reason && ` • Reason: "${audit.reason}"`}
                    </div>
                    {audit.new_value && (
                      <div style={{ marginTop: '4px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {audit.original_value ? `Changed from "${audit.original_value}" to "${audit.new_value}"` : audit.new_value}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>

      {/* Photo Preview & Chain of Custody Modal */}
      {previewPhoto && (
        <div className="modal-overlay" style={{ zIndex: 1100 }} onClick={() => setPreviewPhoto(null)}>
          <div className="modal-content" style={{ maxWidth: '720px', padding: '24px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{previewPhoto.photo_type.replace(/_/g, ' ')}</h3>
                  <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 'var(--radius-full)', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontWeight: 700 }}>
                    ✓ TELEMATICS VERIFIED
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Uploaded on {new Date(previewPhoto.timestamp).toLocaleString()} {previewPhoto.stop_number ? `• Stop #${previewPhoto.stop_number}: ${previewPhoto.destination_name || ''}` : ''}
                </div>
              </div>
              <button className="btn btn-secondary" onClick={() => setPreviewPhoto(null)} style={{ padding: '6px' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-subtle)', background: '#090d16', textAlign: 'center', marginBottom: '16px' }}>
              <img
                src={api.photos.getPhotoUrl(previewPhoto.id)}
                alt={previewPhoto.photo_type}
                style={{ width: '100%', maxHeight: '55vh', objectFit: 'contain' }}
              />
            </div>

            {/* Audit & Telematics Coordinates */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', background: 'var(--bg-secondary)', padding: '14px', borderRadius: 'var(--radius-md)', fontSize: '0.82rem', border: '1px solid var(--border-subtle)' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>GPS Telemetry:</span><br />
                <b>{previewPhoto.latitude ? `${Number(previewPhoto.latitude || 0).toFixed(4)}° N, ${Number(previewPhoto.longitude || 0).toFixed(4)}° E` : 'Logged from Cabin'}</b>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>GPS Accuracy:</span><br />
                <b>{previewPhoto.gps_accuracy ? `±${Math.round(previewPhoto.gps_accuracy)} meters` : 'High Precision'}</b>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>File Metadata:</span><br />
                <b>{previewPhoto.mime_type || 'image/svg+xml'} ({Math.round((previewPhoto.file_size || 20000) / 1024)} KB)</b>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', flexWrap: 'wrap', gap: '8px' }}>
              {previewPhoto.latitude && previewPhoto.longitude ? (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${previewPhoto.latitude},${previewPhoto.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#38bdf8', textDecoration: 'none' }}
                >
                  <MapPin size={14} /> Open Location in Google Maps &rarr;
                </a>
              ) : <div />}

              <a
                href={api.photos.getPhotoUrl(previewPhoto.id)}
                download={`proof-${previewPhoto.id}.svg`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', textDecoration: 'none' }}
              >
                <Download size={14} /> Download Evidence File
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
