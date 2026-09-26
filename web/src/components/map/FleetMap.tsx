import React, { useEffect, useRef, useState, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import { MapView } from './MapView';
import { MapMarker } from './MapMarker';
import { VehicleMarker } from './VehicleMarker';
import { RouteLayer } from './RouteLayer';
import { MapControls } from './MapControls';
import {
  NormalizedCoord,
  toNormalizedCoord,
  toLngLat,
  VehicleMarkerData,
  StopMarkerData,
  MapTheme
} from './types';
import { TripStop, TripEvent, Vehicle, Trip } from '../../types';
import { fetchRoadRoute, RouteGeometryResult } from '../../services/routing';
import { reverseGeocodeLocation } from '../../services/geocoding';
import {
  computeRealtimeDeliveryTime,
  calculateStopDeliveryTiming,
  getDelayBadgeInfo,
  formatClockTime
} from '../../utils/timing';
import {
  Play,
  Pause,
  RotateCcw,
  Navigation,
  Building2,
  ChevronDown,
  ChevronUp,
  Gauge,
  CheckCircle2,
  MapPin,
  Clock,
  Radio,
  Crosshair,
  User,
  X,
  AlertTriangle
} from 'lucide-react';

export interface FleetMapProps {
  baseLocation?: { name: string; latitude?: number; longitude?: number };
  stops?: TripStop[];
  events?: TripEvent[];
  driverLocation?: { latitude: number; longitude: number; heading?: number; accuracy?: number };
  userLocation?: { latitude: number; longitude: number; accuracy?: number } | null;
  fleetVehicles?: Vehicle[];
  selectedVehicle?: Vehicle | null;
  activeTrip?: Trip | null;
  onSelectVehicle?: (vehicle: Vehicle) => void;
  onClearSelectedVehicle?: () => void;
  focusedLocation?: { latitude: number; longitude: number } | null;
  height?: string;
  theme?: 'dark' | 'light' | 'streets' | 'satellite';
  showGoogleMapsButton?: boolean;
  showToolbar?: boolean;
}

export const FleetMap: React.FC<FleetMapProps> = ({
  baseLocation,
  stops = [],
  events = [],
  driverLocation,
  userLocation: propUserLocation,
  fleetVehicles = [],
  selectedVehicle,
  activeTrip,
  onSelectVehicle,
  onClearSelectedVehicle,
  focusedLocation,
  height = '460px',
  theme,
  showGoogleMapsButton = true,
  showToolbar = true
}) => {
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null);

  // Road Route Geometry state
  const [routeResult, setRouteResult] = useState<RouteGeometryResult | null>(null);
  const [isFetchingRoute, setIsFetchingRoute] = useState(false);

  // Simulation / Drive Playback State
  const [isSimulating, setIsSimulating] = useState(false);
  const [simProgress, setSimProgress] = useState(0); // 0 to 1
  const [simSpeed, setSimSpeed] = useState<1 | 2 | 4>(1);
  const [simSpeedKmh, setSimSpeedKmh] = useState(0);
  const [followVehicle, setFollowVehicle] = useState(false);
  const [showWaypoints, setShowWaypoints] = useState(false);
  const [showHud, setShowHud] = useState(true);

  // Reverse geocoded place name for tracked vehicle / driver
  const [livePlaceName, setLivePlaceName] = useState<string>('');

  // Manager / Browser user location detection
  const [detectedUserLocation, setDetectedUserLocation] = useState<NormalizedCoord | null>(null);

  // Detect user's browser location on mount if not supplied by prop
  useEffect(() => {
    if (propUserLocation?.latitude && propUserLocation?.longitude) {
      setDetectedUserLocation({ lat: propUserLocation.latitude, lng: propUserLocation.longitude });
      return;
    }

    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setDetectedUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
        },
        (err) => {
          console.debug('[FleetMap] Browser geolocation notice:', err.message);
        },
        { timeout: 8000, enableHighAccuracy: true }
      );
    }
  }, [propUserLocation?.latitude, propUserLocation?.longitude]);

  const activeUserCoord = useMemo<NormalizedCoord | null>(() => {
    if (propUserLocation?.latitude && propUserLocation?.longitude) {
      return { lat: propUserLocation.latitude, lng: propUserLocation.longitude };
    }
    return detectedUserLocation;
  }, [propUserLocation, detectedUserLocation]);

  // Dynamic Map Basemap Style (Default: streets)
  const initialThemeMap: MapTheme = theme === 'dark' ? 'dark' : theme === 'satellite' ? 'satellite' : 'streets';
  const [currentTheme, setCurrentTheme] = useState<MapTheme>(initialThemeMap);

  useEffect(() => {
    if (theme) {
      setCurrentTheme(theme === 'dark' ? 'dark' : theme === 'satellite' ? 'satellite' : 'streets');
    }
  }, [theme]);

  // Normalized Base Coordinate (only when a valid baseLocation prop is provided)
  const baseCoord = useMemo<NormalizedCoord | null>(() => {
    return toNormalizedCoord(baseLocation);
  }, [baseLocation?.latitude, baseLocation?.longitude]);

  // Normalized Stops
  const normalizedStops = useMemo<StopMarkerData[]>(() => {
    return stops
      .filter((s) => typeof s.latitude === 'number' && typeof s.longitude === 'number')
      .map((s) => ({
        id: s.id,
        stopNumber: s.stop_number,
        name: s.destination_name,
        address: s.address,
        coord: { lat: s.latitude, lng: s.longitude },
        status: s.status,
        plannedTime: s.planned_arrival_time,
        actualTime: s.actual_arrival_time,
        geofenceRadiusMeters: s.geofence_radius_meters || 150
      }));
  }, [stops]);

  // Normalized Driver Location
  const driverCoord = useMemo<NormalizedCoord | null>(() => {
    return toNormalizedCoord(driverLocation);
  }, [driverLocation?.latitude, driverLocation?.longitude]);

  // Normalized Fleet Vehicles with spatial de-duplication and live event tracking
  const normalizedVehicles = useMemo<VehicleMarkerData[]>(() => {
    const activeVehicles = fleetVehicles.filter((v) => v.status !== 'INACTIVE');
    const result: VehicleMarkerData[] = [];

    for (const v of activeVehicles) {
      // 1. Most recent trip event with coords
      const matchingEvents = events.filter(
        (e) => e.vehicle_id === v.id && typeof e.latitude === 'number' && typeof e.longitude === 'number'
      );
      const latestEvt = matchingEvents.length > 0 ? matchingEvents[matchingEvents.length - 1] : null;

      // 2. Direct vehicle coords from real GPS fix
      const lat: number | undefined = latestEvt?.latitude ?? (typeof (v as any).latitude === 'number' ? (v as any).latitude : undefined);
      const lng: number | undefined = latestEvt?.longitude ?? (typeof (v as any).longitude === 'number' ? (v as any).longitude : undefined);

      // Only plot vehicle if it has valid numeric GPS coordinates (do NOT invent fallback dummy coords)
      if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
        continue;
      }

      const speedVal = (v as any).speed_kmh || 0;

      result.push({
        id: v.id,
        vehicle_number: v.vehicle_number,
        model: v.model,
        status: v.status as any,
        coord: { lat, lng },
        heading: (v as any).heading_deg ?? (v as any).heading ?? 0,
        speedKmh: speedVal,
        driverName: (v as any).assigned_driver_name || (v as any).driver_name || ''
      });
    }

    return result;
  }, [fleetVehicles, events]);

  // Active tracked vehicle data: only if selected or actively ON_TRIP
  const trackedVehicle = useMemo(() => {
    if (selectedVehicle) {
      const match = normalizedVehicles.find((nv) => nv.id === selectedVehicle.id || nv.vehicle_number === selectedVehicle.vehicle_number);
      if (match) return match;
      if (typeof selectedVehicle.latitude === 'number' && typeof selectedVehicle.longitude === 'number') {
        return {
          id: selectedVehicle.id,
          vehicle_number: selectedVehicle.vehicle_number,
          model: selectedVehicle.model,
          status: selectedVehicle.status as any,
          coord: { lat: selectedVehicle.latitude, lng: selectedVehicle.longitude },
          heading: (selectedVehicle as any).heading_deg || 0,
          speedKmh: selectedVehicle.speed_kmh || 0,
          driverName: (selectedVehicle as any).assigned_driver_name || ''
        };
      }
    }
    // Or pick the first vehicle that is currently ON_TRIP
    const onTripVehicle = normalizedVehicles.find((v) => v.status === 'ON_TRIP');
    if (onTripVehicle) return onTripVehicle;

    return null;
  }, [selectedVehicle, normalizedVehicles]);

  // Reverse geocode the active vehicle or driver's live coordinate for human-readable place name
  useEffect(() => {
    const targetCoord = trackedVehicle?.coord || driverCoord;
    if (!targetCoord) {
      setLivePlaceName('');
      return;
    }

    let isSubscribed = true;
    reverseGeocodeLocation(targetCoord).then((place) => {
      if (isSubscribed && place) {
        setLivePlaceName(place);
      }
    });

    return () => {
      isSubscribed = false;
    };
  }, [trackedVehicle?.coord?.lat, trackedVehicle?.coord?.lng, driverCoord?.lat, driverCoord?.lng]);

  // Determine Ola / Rapido / Swiggy dynamic route origin:
  // Starts directly at the LIVE vehicle position (or driver GPS position) to upcoming stops!
  const routeOriginCoord = useMemo<NormalizedCoord | null>(() => {
    if (trackedVehicle && trackedVehicle.coord) {
      return trackedVehicle.coord;
    }
    if (driverCoord) {
      return driverCoord;
    }
    return baseCoord;
  }, [trackedVehicle?.coord, driverCoord, baseCoord]);

  // Identify next stop and pending remaining stops
  const upcomingStops = useMemo<StopMarkerData[]>(() => {
    const pending = normalizedStops.filter((s) => s.status !== 'COMPLETED');
    return pending.length > 0 ? pending : normalizedStops;
  }, [normalizedStops]);

  const nextStop = useMemo<StopMarkerData | null>(() => {
    return upcomingStops[0] || null;
  }, [upcomingStops]);

  // Real-Time Delivery & Delay Timing Computations
  const realtimeDelivery = useMemo(() => {
    if (!routeResult || typeof routeResult.durationMinutes !== 'number') return null;
    return computeRealtimeDeliveryTime(routeResult.durationMinutes);
  }, [routeResult?.durationMinutes]);

  const tripDelayMinutes = useMemo(() => {
    if (typeof activeTrip?.total_delay_minutes === 'number') {
      return activeTrip.total_delay_minutes;
    }
    if (typeof (trackedVehicle as any)?.delayMinutes === 'number') {
      return (trackedVehicle as any).delayMinutes;
    }
    return trackedVehicle?.status === 'DELAYED' ? 22 : 0;
  }, [activeTrip?.total_delay_minutes, (trackedVehicle as any)?.delayMinutes, trackedVehicle?.status]);

  const activeDelayReason = useMemo(() => {
    return (
      activeTrip?.delays?.find((d) => !d.is_resolved)?.reason ||
      (activeTrip?.status === 'DELAYED' ? 'Traffic Bottleneck' : undefined) ||
      (tripDelayMinutes > 0 ? 'Traffic Bottleneck' : undefined)
    );
  }, [activeTrip?.delays, activeTrip?.status, tripDelayMinutes]);

  const delayBadge = useMemo(() => {
    return getDelayBadgeInfo(tripDelayMinutes, activeDelayReason);
  }, [tripDelayMinutes, activeDelayReason]);

  // Stable waypoint signature to prevent redundant Mapbox Directions API fetch loops
  const waypointsKey = useMemo(() => {
    const coords: string[] = [];
    if (routeOriginCoord) {
      coords.push(`${routeOriginCoord.lat.toFixed(5)},${routeOriginCoord.lng.toFixed(5)}`);
    }
    for (const s of upcomingStops) {
      coords.push(`${s.coord.lat.toFixed(5)},${s.coord.lng.toFixed(5)}`);
    }
    return coords.join(';');
  }, [routeOriginCoord, upcomingStops]);

  // Fetch real road route geometry along actual streets
  useEffect(() => {
    const waypoints: NormalizedCoord[] = [];
    if (routeOriginCoord) waypoints.push(routeOriginCoord);
    for (const s of upcomingStops) {
      waypoints.push(s.coord);
    }

    if (waypoints.length < 2) {
      setRouteResult(null);
      return;
    }

    let isSubscribed = true;
    setIsFetchingRoute(true);

    fetchRoadRoute(waypoints)
      .then((res) => {
        if (!isSubscribed) return;
        setRouteResult(res);
      })
      .catch((err) => {
        console.warn('[Routing Error]', err);
      })
      .finally(() => {
        if (isSubscribed) setIsFetchingRoute(false);
      });

    return () => {
      isSubscribed = false;
    };
  }, [waypointsKey]);

  // Focus location change handler
  useEffect(() => {
    if (!mapInstanceRef.current || !focusedLocation) return;
    const pt = toNormalizedCoord(focusedLocation);
    if (pt) {
      mapInstanceRef.current.flyTo({
        center: toLngLat(pt),
        zoom: 15,
        duration: 900
      });
    }
  }, [focusedLocation?.latitude, focusedLocation?.longitude]);

  // Follow vehicle camera pan
  useEffect(() => {
    if (followVehicle && trackedVehicle?.coord && mapInstanceRef.current) {
      mapInstanceRef.current.panTo(toLngLat(trackedVehicle.coord), { duration: 300 });
    }
  }, [followVehicle, trackedVehicle?.coord?.lat, trackedVehicle?.coord?.lng]);

  // Drive simulation tick loop
  useEffect(() => {
    if (!isSimulating || !routeResult || routeResult.coordinates.length < 2) return;

    const interval = setInterval(() => {
      setSimProgress((prev) => {
        const step = 0.004 * simSpeed;
        const next = prev + step;
        if (next >= 1) {
          setIsSimulating(false);
          return 1;
        }
        return next;
      });

      setSimSpeedKmh((prev) => {
        const delta = (Math.random() - 0.48) * 3;
        return Math.max(32, Math.min(65, Math.round(prev + delta)));
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isSimulating, routeResult, simSpeed]);

  // Current simulation vehicle coordinate
  const currentSimCoord = useMemo<NormalizedCoord | null>(() => {
    if (!routeResult || routeResult.coordinates.length < 2) return null;
    const coords = routeResult.coordinates;
    const totalPoints = coords.length - 1;
    const exactIndex = simProgress * totalPoints;
    const lowerIdx = Math.floor(exactIndex);
    const upperIdx = Math.min(coords.length - 1, lowerIdx + 1);
    const fraction = exactIndex - lowerIdx;

    const p1 = coords[lowerIdx];
    const p2 = coords[upperIdx];

    return {
      lat: p1.lat + (p2.lat - p1.lat) * fraction,
      lng: p1.lng + (p2.lng - p1.lng) * fraction
    };
  }, [routeResult, simProgress]);

  // Build external Google Maps Multi-Stop Directions URL
  const googleMapsUrl = useMemo(() => {
    const origin = routeOriginCoord || baseCoord;
    if (!origin) return '';
    const valid = normalizedStops;
    if (valid.length === 0) {
      return `https://www.google.com/maps/search/?api=1&query=${origin.lat},${origin.lng}`;
    }
    const last = valid[valid.length - 1];
    const waypointsStr = valid
      .slice(0, -1)
      .map((s) => `${s.coord.lat},${s.coord.lng}`)
      .join('|');

    let url = `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${last.coord.lat},${last.coord.lng}`;
    if (waypointsStr) {
      url += `&waypoints=${encodeURIComponent(waypointsStr)}`;
    }
    return url;
  }, [routeOriginCoord, baseCoord, normalizedStops]);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: height || '460px',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid var(--border-subtle, rgba(51, 65, 85, 0.5))',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)'
      }}
    >
      <MapView
        initialCenter={routeOriginCoord || baseCoord || activeUserCoord || { lat: 28.6139, lng: 77.2090 }}
        initialZoom={13}
        height="100%"
        theme={currentTheme}
        onMapReady={(map) => {
          mapInstanceRef.current = map;
        }}
      >
        {/* Base / Central Logistics Hub Marker (only when explicit baseLocation with coords is supplied) */}
        {baseCoord && baseLocation && (
          <MapMarker
            map={mapInstanceRef.current}
            coord={baseCoord}
            popupHtml={`
              <div style="font-family: inherit; padding: 6px 2px; color: #0f172a;">
                <div style="font-weight: 800; font-size: 13px; color: #0f172a;">${baseLocation?.name || 'HoseXperts Central Depot'}</div>
                <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Primary Logistics Departure & Return Hub</div>
              </div>
            `}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                transform: 'translate(-50%, -100%)',
                cursor: 'pointer'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  backgroundColor: '#0f172a',
                  border: '2px solid #00e5ff',
                  color: '#00e5ff',
                  boxShadow: '0 4px 14px rgba(0, 229, 255, 0.4)'
                }}
              >
                <Building2 size={16} />
              </div>
              <div
                style={{
                  width: '3px',
                  height: '6px',
                  backgroundColor: '#00e5ff',
                  borderRadius: '0 0 2px 2px'
                }}
              />
            </div>
          </MapMarker>
        )}

        {/* Manager / Dashboard User Location Indicator (Pulsing Blue Beacon) */}
        {activeUserCoord && (
          <MapMarker
            map={mapInstanceRef.current}
            coord={activeUserCoord}
            popupHtml={`
              <div style="font-family: inherit; padding: 6px 2px; color: #0f172a;">
                <div style="font-weight: 800; font-size: 12px; color: #1d4ed8;">📍 Your Location (Operations Manager)</div>
                <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Dashboard Command Terminal</div>
                <div style="font-size: 10px; color: #94a3b8; margin-top: 4px; font-family: monospace;">${activeUserCoord.lat.toFixed(5)}°, ${activeUserCoord.lng.toFixed(5)}°</div>
              </div>
            `}
          >
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: 'translate(-50%, -50%)',
                cursor: 'pointer'
              }}
            >
              {/* Outer pulsing blue aura */}
              <div
                style={{
                  position: 'absolute',
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(37, 99, 235, 0.25)',
                  border: '1.5px solid rgba(37, 99, 235, 0.6)',
                  animation: 'pulse 2s infinite ease-out'
                }}
              />
              {/* Blue Core Dot */}
              <div
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  backgroundColor: '#2563eb',
                  border: '3px solid #ffffff',
                  boxShadow: '0 3px 10px rgba(0, 0, 0, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              />
            </div>
          </MapMarker>
        )}

        {/* Numbered Stops Markers */}
        {normalizedStops.map((stop) => {
          const isDone = stop.status === 'COMPLETED';
          const isCurrent = stop.status === 'ARRIVED' || stop.status === 'IN_PROGRESS';

          const bgColor = isDone ? '#10B981' : isCurrent ? '#00e5ff' : '#EF4444';
          const borderColor = isDone ? '#6EE7B7' : isCurrent ? '#38BDF8' : '#FCA5A5';

          return (
            <MapMarker
              key={stop.id}
              map={mapInstanceRef.current}
              coord={stop.coord}
              popupHtml={`
                <div style="font-family: inherit; min-width: 180px; padding: 6px 2px; color: #0f172a;">
                  <div style="font-weight: 800; font-size: 12px; color: #0f172a; margin-bottom: 2px;">
                    Stop #${stop.stopNumber}: ${stop.name}
                  </div>
                  <div style="font-size: 11px; color: #64748b; margin-bottom: 6px;">
                    ${stop.address}
                  </div>
                  <div style="display: flex; align-items: center; justify-content: space-between; font-size: 10px; font-weight: 700; text-transform: uppercase; padding: 3px 6px; background: #f1f5f9; border-radius: 4px;">
                    <span>Status:</span>
                    <span style="color: ${isDone ? '#059669' : isCurrent ? '#0284c7' : '#dc2626'};">${stop.status}</span>
                  </div>
                  ${stop.plannedTime ? `<div style="font-size: 10px; color: #475569; margin-top: 4px;">ETA: <strong>${stop.plannedTime}</strong></div>` : ''}
                </div>
              `}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  transform: 'translate(-50%, -100%)',
                  cursor: 'pointer'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: bgColor,
                    border: `2px solid ${borderColor}`,
                    color: isCurrent ? '#0f172a' : '#ffffff',
                    fontSize: '11px',
                    fontWeight: 800,
                    boxShadow: isCurrent ? '0 0 12px rgba(0, 229, 255, 0.7)' : '0 3px 8px rgba(0, 0, 0, 0.35)'
                  }}
                >
                  {isDone ? <CheckCircle2 size={14} /> : stop.stopNumber}
                </div>
                <div
                  style={{
                    width: '3px',
                    height: '5px',
                    backgroundColor: bgColor,
                    borderRadius: '0 0 2px 2px'
                  }}
                />
              </div>
            </MapMarker>
          );
        })}

        {/* Live Fleet Vehicles */}
        {normalizedVehicles.map((v) => (
          <VehicleMarker
            key={v.id}
            map={mapInstanceRef.current}
            vehicle={v}
            isSelected={trackedVehicle?.id === v.id}
            onClick={() => {
              const original = fleetVehicles.find((fv) => fv.id === v.id);
              if (original && onSelectVehicle) onSelectVehicle(original);
            }}
          />
        ))}

        {/* Driver GPS Location Marker */}
        {driverCoord && (
          <MapMarker
            map={mapInstanceRef.current}
            coord={driverCoord}
            popupHtml={`
              <div style="font-family: inherit; padding: 6px 2px; color: #0f172a;">
                <div style="font-weight: 800; font-size: 12px; color: #0284c7;">Active Driver Beacon</div>
                <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Real-time GPS telematics</div>
              </div>
            `}
          >
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: 'translate(-50%, -50%)',
                cursor: 'pointer'
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(0, 229, 255, 0.35)',
                  animation: 'pulse 1.8s infinite'
                }}
              />
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: '#00e5ff',
                  border: '2px solid #ffffff',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
                  color: '#0f172a'
                }}
              >
                <Navigation
                  size={13}
                  style={{ transform: `rotate(${driverLocation?.heading || 0}deg)` }}
                />
              </div>
            </div>
          </MapMarker>
        )}

        {/* Simulation Animated Vehicle Pin */}
        {isSimulating && currentSimCoord && (
          <MapMarker
            map={mapInstanceRef.current}
            coord={currentSimCoord}
          >
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none'
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(16, 185, 129, 0.35)',
                  animation: 'pulse 1.5s infinite'
                }}
              />
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  backgroundColor: '#10B981',
                  border: '2px solid #ECFDF5',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.5)',
                  color: '#0f172a'
                }}
              >
                <Navigation size={14} style={{ fill: 'currentColor', transform: 'rotate(45deg)' }} />
              </div>
            </div>
          </MapMarker>
        )}

        {/* Road Snapped Polyline Route Layer (Swiggy / Ola / Rapido Vibrant Corridor) */}
        {routeResult && (
          <RouteLayer
            map={mapInstanceRef.current}
            coordinates={routeResult.coordinates}
            color="#00d084"
            casingColor="#0284c7"
            fitBounds={!followVehicle}
          />
        )}

        {/* Map Controls */}
        {showToolbar && (
          <MapControls
            map={mapInstanceRef.current}
            externalNavUrl={showGoogleMapsButton ? googleMapsUrl : undefined}
            activeTheme={currentTheme}
            onSelectTheme={(t) => setCurrentTheme(t)}
            onLocateUser={() => {
              if (activeUserCoord && mapInstanceRef.current) {
                mapInstanceRef.current.flyTo({
                  center: toLngLat(activeUserCoord),
                  zoom: 15,
                  duration: 900
                });
              }
            }}
            onRecenter={() => {
              if (!mapInstanceRef.current) return;
              if (routeOriginCoord) {
                mapInstanceRef.current.flyTo({ center: toLngLat(routeOriginCoord), zoom: 14, duration: 800 });
              } else if (baseCoord) {
                mapInstanceRef.current.flyTo({ center: toLngLat(baseCoord), zoom: 13, duration: 800 });
              } else {
                mapInstanceRef.current.flyTo({ center: [77.2090, 28.6139], zoom: 11, duration: 800 });
              }
            }}
          />
        )}
      </MapView>

      {/* Ola / Rapido / Swiggy Style Live Tracking Card & Telematics HUD */}
      {showHud && trackedVehicle && (
        <div
          style={{
            position: 'absolute',
            left: '12px',
            top: '12px',
            zIndex: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            maxWidth: '340px',
            width: 'calc(100% - 70px)'
          }}
        >
          {/* Main Telematics Card */}
          <div
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.94)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              borderRadius: '14px',
              padding: '12px 14px',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.55)',
              color: '#f8fafc'
            }}
          >
            {/* Header: Vehicle Plate & Speed */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    width: '9px',
                    height: '9px',
                    borderRadius: '50%',
                    backgroundColor: (trackedVehicle?.speedKmh || 0) > 2 ? '#10b981' : '#f59e0b',
                    boxShadow: (trackedVehicle?.speedKmh || 0) > 2 ? '0 0 10px #10b981' : 'none',
                    animation: (trackedVehicle?.speedKmh || 0) > 2 ? 'pulse 1.5s infinite' : 'none'
                  }}
                />
                <span style={{ fontWeight: 800, fontSize: '0.92rem', fontFamily: 'monospace', letterSpacing: '0.04em' }}>
                  {trackedVehicle?.vehicle_number || 'DELHI FLEET RADAR'}
                </span>
                {trackedVehicle?.driverName && (
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                    &bull; {trackedVehicle.driverName}
                  </span>
                )}
              </div>

              {/* Speed Badge */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  backgroundColor: 'rgba(30, 41, 59, 0.8)',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  color: (trackedVehicle?.speedKmh || 0) > 2 ? '#34d399' : '#cbd5e1'
                }}
              >
                <Gauge size={12} color="#00e5ff" />
                <span>{Math.round(trackedVehicle?.speedKmh || 0)} km/h</span>
              </div>
            </div>

            {/* Live Place Name (Reverse Geocoded) */}
            {livePlaceName && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '6px',
                  fontSize: '0.74rem',
                  color: '#cbd5e1',
                  marginBottom: '10px',
                  lineHeight: 1.3
                }}
              >
                <MapPin size={13} color="#00e5ff" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {livePlaceName}
                </span>
              </div>
            )}

            {/* Swiggy/Ola Style Remaining Road, Real-Time ETA & Delivery Time Grid */}
            {routeResult ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1.25fr',
                    gap: '6px',
                    textAlign: 'center',
                    padding: '8px 6px',
                    backgroundColor: 'rgba(2, 132, 199, 0.15)',
                    borderRadius: '10px',
                    border: '1px solid rgba(56, 189, 248, 0.35)'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '1.12rem', fontWeight: 800, color: '#38bdf8' }}>
                      {routeResult.distanceKm} km
                    </div>
                    <div style={{ fontSize: '0.58rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', fontWeight: 700 }}>
                      Remaining Road
                    </div>
                  </div>
                  <div style={{ borderLeft: '1px solid rgba(56, 189, 248, 0.25)' }}>
                    <div style={{ fontSize: '1.12rem', fontWeight: 800, color: '#00d084' }}>
                      ~{routeResult.durationMinutes} min
                    </div>
                    <div style={{ fontSize: '0.58rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', fontWeight: 700 }}>
                      Real-Time ETA
                    </div>
                  </div>
                  <div style={{ borderLeft: '1px solid rgba(56, 189, 248, 0.25)' }}>
                    <div style={{ fontSize: '1.02rem', fontWeight: 800, color: '#f59e0b' }}>
                      {realtimeDelivery?.clockTime || '—'}
                    </div>
                    <div style={{ fontSize: '0.58rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#cbd5e1', fontWeight: 700 }}>
                      Delivery By
                    </div>
                  </div>
                </div>

                {/* Real-Time Delay Status Pill */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '5px 8px',
                    borderRadius: '8px',
                    backgroundColor: delayBadge.isDelayed ? 'rgba(245, 158, 11, 0.18)' : 'rgba(16, 185, 129, 0.15)',
                    border: `1px solid ${delayBadge.isDelayed ? 'rgba(245, 158, 11, 0.4)' : 'rgba(16, 185, 129, 0.3)'}`,
                    fontSize: '0.72rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 700, color: delayBadge.isDelayed ? '#fbbf24' : '#10b981' }}>
                    {delayBadge.isDelayed ? <AlertTriangle size={12} /> : <CheckCircle2 size={12} />}
                    <span>{delayBadge.label}</span>
                  </div>
                  <span style={{ fontSize: '0.66rem', color: '#94a3b8', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {activeDelayReason || (delayBadge.isDelayed ? 'Active Delay' : 'On Schedule')}
                  </span>
                </div>
              </div>
            ) : isFetchingRoute ? (
              <div
                style={{
                  padding: '8px',
                  textAlign: 'center',
                  fontSize: '0.74rem',
                  color: '#94a3b8',
                  backgroundColor: 'rgba(30, 41, 59, 0.5)',
                  borderRadius: '8px',
                  marginBottom: '10px'
                }}
              >
                Calculating live street corridor & delivery time...
              </div>
            ) : null}

            {/* Next Stop Info with Real-Time Delivery Time */}
            {nextStop && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  backgroundColor: 'rgba(30, 41, 59, 0.75)',
                  borderRadius: '8px',
                  fontSize: '0.74rem',
                  marginBottom: '4px'
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                    <span style={{ fontSize: '0.64rem', textTransform: 'uppercase', fontWeight: 800, color: '#00e5ff', letterSpacing: '0.04em' }}>
                      Next Delivery Destination
                    </span>
                    {realtimeDelivery && (
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#f59e0b' }}>
                        {realtimeDelivery.deliveryTimeStr}
                      </span>
                    )}
                  </div>
                  <div style={{ fontWeight: 800, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
                    {nextStop.name}
                  </div>
                  {nextStop.plannedTime && (
                    <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '1px' }}>
                      Planned: {formatClockTime(nextStop.plannedTime)}
                      {tripDelayMinutes > 0 && (
                        <span style={{ color: '#f59e0b', marginLeft: '6px', fontWeight: 600 }}>
                          (+{tripDelayMinutes}m delay)
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setShowWaypoints(!showWaypoints)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px',
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    fontSize: '0.7rem',
                    padding: '2px 4px',
                    marginLeft: '6px'
                  }}
                >
                  <span>{normalizedStops.length} Stops</span>
                  {showWaypoints ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
              </div>
            )}

            {/* Interactive Quick Bar: Follow, Center, Reset */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '6px',
                marginTop: '10px',
                paddingTop: '8px',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)'
              }}
            >
              <button
                type="button"
                onClick={() => {
                  if (routeOriginCoord && mapInstanceRef.current) {
                    mapInstanceRef.current.flyTo({ center: toLngLat(routeOriginCoord), zoom: 15, duration: 600 });
                  }
                }}
                style={{
                  flex: 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  padding: '4px 8px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  color: '#e2e8f0',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <Crosshair size={12} color="#00e5ff" />
                <span>Center</span>
              </button>

              <button
                type="button"
                onClick={() => setFollowVehicle(!followVehicle)}
                style={{
                  flex: 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  padding: '4px 8px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  backgroundColor: followVehicle ? 'rgba(0, 229, 255, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                  color: followVehicle ? '#00e5ff' : '#cbd5e1',
                  borderRadius: '6px',
                  border: followVehicle ? '1px solid #00e5ff' : 'none',
                  cursor: 'pointer'
                }}
              >
                <Navigation size={12} />
                <span>{followVehicle ? 'Following' : 'Follow'}</span>
              </button>

              {onClearSelectedVehicle && selectedVehicle && (
                <button
                  type="button"
                  onClick={onClearSelectedVehicle}
                  title="Clear Vehicle Focus"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '28px',
                    height: '26px',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    color: '#94a3b8',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Collapsible Waypoints List */}
          {showWaypoints && (
            <div
              style={{
                maxHeight: '220px',
                overflowY: 'auto',
                backgroundColor: 'rgba(15, 23, 42, 0.96)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '12px',
                padding: '8px',
                boxShadow: '0 12px 28px rgba(0, 0, 0, 0.6)',
                fontSize: '0.76rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}
            >
              <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', padding: '0 4px' }}>
                Assigned Trip Stops
              </div>
              {normalizedStops.map((st) => {
                const rawStop = stops.find((s) => s.id === st.id) || ({
                  id: st.id,
                  destination_name: st.name,
                  address: st.address,
                  planned_arrival_time: st.plannedTime,
                  status: st.status
                } as any);
                const timing = calculateStopDeliveryTiming(
                  rawStop,
                  tripDelayMinutes,
                  nextStop?.id === st.id ? routeResult?.durationMinutes : undefined
                );

                return (
                  <div
                    key={st.id}
                    onClick={() => {
                      if (mapInstanceRef.current) {
                        mapInstanceRef.current.flyTo({ center: toLngLat(st.coord), zoom: 15, duration: 600 });
                      }
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(30, 41, 59, 0.65)',
                      cursor: 'pointer',
                      border: '1px solid rgba(255, 255, 255, 0.05)'
                    }}
                  >
                    <span
                      style={{
                        flexShrink: 0,
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: st.status === 'COMPLETED' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(0, 229, 255, 0.2)',
                        color: st.status === 'COMPLETED' ? '#10b981' : '#00e5ff',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginTop: '1px'
                      }}
                    >
                      {st.status === 'COMPLETED' ? '✓' : st.stopNumber}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                        <div style={{ fontWeight: 700, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {st.name}
                        </div>
                        <span
                          style={{
                            fontSize: '0.64rem',
                            fontWeight: 700,
                            color: timing.isDelivered ? '#10b981' : timing.isDelayed ? '#f59e0b' : '#38bdf8',
                            flexShrink: 0
                          }}
                        >
                          {timing.varianceLabel}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {st.address}
                      </div>
                      <div style={{ fontSize: '0.66rem', color: timing.isDelayed ? '#fbbf24' : '#94a3b8', marginTop: '2px', fontWeight: 600 }}>
                        {timing.isDelivered
                          ? `Delivered: ${timing.actualTimeStr}`
                          : timing.status === 'ARRIVED'
                          ? timing.expectedDeliveryStr
                          : `Planned: ${timing.plannedTimeStr} → ${timing.expectedDeliveryStr}`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
