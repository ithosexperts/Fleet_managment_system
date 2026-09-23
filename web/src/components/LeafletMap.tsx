import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  ExternalLink,
  Navigation,
  Compass,
  MapPin,
  Play,
  Pause,
  RotateCcw,
  Gauge,
  Layers,
  ChevronDown,
  ChevronUp,
  FastForward,
  CheckCircle2,
  Activity,
  Eye
} from 'lucide-react';
import { TripStop, TripEvent, Vehicle } from '../types';
import { fetchRoadRoute, RouteGeometryResult } from '../services/routing';

interface Props {
  baseLocation?: { name: string; latitude?: number; longitude?: number };
  stops?: TripStop[];
  events?: TripEvent[];
  driverLocation?: { latitude: number; longitude: number; heading?: number; accuracy?: number };
  fleetVehicles?: Vehicle[];
  onSelectVehicle?: (vehicle: Vehicle) => void;
  focusedLocation?: { latitude: number; longitude: number } | null;
  height?: string;
  theme?: 'dark' | 'light';
  showGoogleMapsButton?: boolean;
  showToolbar?: boolean;
}

type MapLayerType = 'dark' | 'streets' | 'satellite';

export const LeafletMap: React.FC<Props> = ({
  baseLocation,
  stops = [],
  events = [],
  driverLocation,
  fleetVehicles = [],
  onSelectVehicle,
  focusedLocation,
  height = '460px',
  theme = 'dark',
  showGoogleMapsButton = true,
  showToolbar = true
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Dedicated persistent layer groups to prevent DOM teardown & blinking
  const staticLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const vehicleLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const simulationLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const vehicleMarkersMapRef = useRef<Map<string, L.Marker>>(new Map());
  const driverMarkerRef = useRef<L.Marker | null>(null);
  const driverCircleRef = useRef<L.Circle | null>(null);
  const simMarkerRef = useRef<L.Marker | null>(null);
  const hasFittedInitialBoundsRef = useRef(false);

  // Road Route Geometry state
  const [routeResult, setRouteResult] = useState<RouteGeometryResult | null>(null);
  const [isFetchingRoute, setIsFetchingRoute] = useState(false);

  // Ola Maps Simulation / Route Visualizer state
  const [isSimulating, setIsSimulating] = useState(false);
  const [simProgress, setSimProgress] = useState(0); // 0 to 1
  const [simSpeed, setSimSpeed] = useState<1 | 2 | 4>(1);
  const [simSpeedKmh, setSimSpeedKmh] = useState(42);
  const [followVehicle, setFollowVehicle] = useState(false);
  const [showWaypoints, setShowWaypoints] = useState(false);
  const [showHud, setShowHud] = useState(true);

  const [mapLayer, setMapLayer] = useState<MapLayerType>(theme === 'light' ? 'streets' : 'dark');

  // Build Google Maps Multi-Stop Direction URL
  const getGoogleMapsUrl = (): string => {
    const originLat = baseLocation?.latitude || 28.5355;
    const originLng = baseLocation?.longitude || 77.268;

    const validStops = stops.filter((s) => s.latitude && s.longitude);
    if (validStops.length === 0) {
      return `https://www.google.com/maps/search/?api=1&query=${originLat},${originLng}`;
    }

    const lastStop = validStops[validStops.length - 1];
    const waypoints = validStops
      .slice(0, -1)
      .map((s) => `${s.latitude},${s.longitude}`)
      .join('|');

    let url = `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${lastStop.latitude},${lastStop.longitude}`;
    if (waypoints) {
      url += `&waypoints=${encodeURIComponent(waypoints)}`;
    }
    return url;
  };

  const getTileUrl = (type: MapLayerType): { url: string; options: L.TileLayerOptions } => {
    switch (type) {
      case 'satellite':
        return {
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          options: {
            attribution: 'Tiles &copy; Esri &mdash; Telematics Satellite Imagery',
            subdomains: 'abc',
            maxZoom: 19
          }
        };
      case 'streets':
        return {
          url: 'https://tile.openstreetmap.de/{z}/{x}/{y}.png',
          options: {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            subdomains: 'abc',
            maxZoom: 19
          }
        };
      case 'dark':
      default:
        return {
          url: 'https://tile.openstreetmap.de/{z}/{x}/{y}.png',
          options: {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &bull; Ola Maps Telematics',
            className: 'map-tiles-dark',
            subdomains: 'abc',
            maxZoom: 19
          }
        };
    }
  };

  // Sync layer with theme prop if changed
  useEffect(() => {
    setMapLayer(theme === 'light' ? 'streets' : 'dark');
  }, [theme]);

  // Recenter / Fit All helper
  const handleRecenter = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const points: [number, number][] = [];
    if (baseLocation?.latitude && baseLocation?.longitude) {
      points.push([baseLocation.latitude, baseLocation.longitude]);
    }
    stops.forEach((s) => {
      if (s.latitude && s.longitude) points.push([s.latitude, s.longitude]);
    });
    fleetVehicles.forEach((v) => {
      if (v.latitude && v.longitude) points.push([v.latitude, v.longitude]);
    });

    if (points.length > 0) {
      try {
        map.fitBounds(L.latLngBounds(points), { padding: [50, 50], maxZoom: 15 });
      } catch {}
    } else {
      const centerLat = baseLocation?.latitude || 28.5355;
      const centerLng = baseLocation?.longitude || 77.2680;
      map.setView([centerLat, centerLng], 13);
    }
  }, [baseLocation, stops, fleetVehicles]);

  // 1. INITIALIZE MAP ONCE
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const defaultCenter: [number, number] = [
      baseLocation?.latitude || 28.5355,
      baseLocation?.longitude || 77.268
    ];

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: 12,
        scrollWheelZoom: true
      });

      const { url, options } = getTileUrl(mapLayer);
      const tiles = L.tileLayer(url, options).addTo(map);

      tileLayerRef.current = tiles;
      mapInstanceRef.current = map;

      // Create persistent layer groups
      staticLayerGroupRef.current = L.layerGroup().addTo(map);
      vehicleLayerGroupRef.current = L.layerGroup().addTo(map);
      simulationLayerGroupRef.current = L.layerGroup().addTo(map);

      // Ensure map recalculates tile dimensions when layout finishes or containers resize
      const timer1 = setTimeout(() => { try { map.invalidateSize(); } catch {} }, 80);
      const timer2 = setTimeout(() => { try { map.invalidateSize(); } catch {} }, 250);
      const timer3 = setTimeout(() => { try { map.invalidateSize(); } catch {} }, 600);

      let resizeObserver: ResizeObserver | null = null;
      if (typeof ResizeObserver !== 'undefined' && mapContainerRef.current) {
        resizeObserver = new ResizeObserver(() => {
          if (mapInstanceRef.current) {
            try { mapInstanceRef.current.invalidateSize(); } catch {}
          }
        });
        resizeObserver.observe(mapContainerRef.current);
      }

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
        if (resizeObserver) resizeObserver.disconnect();
      };
    } else if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
      const { url, options } = getTileUrl(mapLayer);
      const tiles = L.tileLayer(url, options).addTo(mapInstanceRef.current);
      tileLayerRef.current = tiles;
      requestAnimationFrame(() => {
        try { mapInstanceRef.current?.invalidateSize(); } catch {}
      });
    }
  }, [mapLayer]);

  // 2. FETCH REAL ROAD ROUTE VIA OSRM
  useEffect(() => {
    const waypoints: Array<{ latitude: number; longitude: number }> = [];
    if (baseLocation?.latitude && baseLocation?.longitude) {
      waypoints.push({ latitude: Number(baseLocation.latitude), longitude: Number(baseLocation.longitude) });
    }
    stops.forEach((s) => {
      if (s.latitude && s.longitude) {
        waypoints.push({ latitude: Number(s.latitude), longitude: Number(s.longitude) });
      }
    });

    if (waypoints.length >= 2) {
      setIsFetchingRoute(true);
      fetchRoadRoute(waypoints)
        .then((res) => {
          setRouteResult(res);
          setIsFetchingRoute(false);
        })
        .catch(() => {
          setIsFetchingRoute(false);
        });
    } else {
      setRouteResult(null);
    }
  }, [baseLocation?.latitude, baseLocation?.longitude, stops.length]);

  // 3. RENDER STATIC ROUTE, DEPOT HQ, STOPS & OLA MAPS NEON GLOW CORRIDOR
  const stopsHash = stops.map((s) => `${s.id}-${s.status}-${s.latitude}-${s.longitude}`).join('|');
  const baseHash = `${baseLocation?.latitude}-${baseLocation?.longitude}-${baseLocation?.name}`;

  useEffect(() => {
    const map = mapInstanceRef.current;
    const staticGroup = staticLayerGroupRef.current;
    if (!map || !staticGroup) return;

    staticGroup.clearLayers();

    const latLngs: L.LatLngExpression[] = [];

    // Base / Depot Marker (Golden HQ Badge)
    if (baseLocation?.latitude && baseLocation?.longitude) {
      const baseIcon = L.divIcon({
        className: 'custom-map-icon',
        html: `<div style="background:linear-gradient(135deg, #c5a059, #e6c887);color:#0d0e11;border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:11px;border:2.5px solid #ffffff;box-shadow:0 0 16px rgba(197,160,89,0.9);letter-spacing:0.5px;">HQ</div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      });

      const baseLat = Number(baseLocation.latitude || 28.5355);
      const baseLng = Number(baseLocation.longitude || 77.2680);
      const basePos: [number, number] = [baseLat, baseLng];
      L.marker(basePos, { icon: baseIcon })
        .addTo(staticGroup)
        .bindPopup(`
          <div style="font-family:Inter,sans-serif;padding:6px;min-width:180px;">
            <div style="font-size:10px;font-weight:700;color:#c5a059;text-transform:uppercase;letter-spacing:0.5px;">Dispatch Operations Terminal</div>
            <div style="font-size:13px;font-weight:800;color:#0f172a;margin:2px 0;">${baseLocation.name || 'Central Fleet Terminal'}</div>
            <div style="font-size:11px;color:#64748b;">GPS: ${baseLat.toFixed(4)}, ${baseLng.toFixed(4)}</div>
            <a href="https://www.google.com/maps/search/?api=1&query=${baseLat},${baseLng}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:4px;font-size:11px;color:#2563eb;font-weight:600;margin-top:6px;text-decoration:none;">
              📍 Open Location in Google Maps &rarr;
            </a>
          </div>
        `);
      latLngs.push(basePos);
    }

    // Destination Stop Markers with Geofence Rings
    stops.forEach((stop) => {
      if (stop.latitude && stop.longitude) {
        const isCompleted = stop.status === 'COMPLETED';
        const isArrived = stop.status === 'ARRIVED' || stop.status === 'IN_PROGRESS';
        const bgGrad = isCompleted
          ? 'linear-gradient(135deg, #10b981, #059669)'
          : isArrived
          ? 'linear-gradient(135deg, #f59e0b, #d97706)'
          : 'linear-gradient(135deg, #0284c7, #38bdf8)';

        const stopIcon = L.divIcon({
          className: 'custom-map-icon',
          html: `<div style="background:${bgGrad};color:#ffffff;border-radius:50%;width:30px;height:30px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px;border:2.5px solid #ffffff;box-shadow:0 3px 12px rgba(0,0,0,0.6);">${stop.stop_number}</div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        });

        const stopLat = Number(stop.latitude);
        const stopLng = Number(stop.longitude);
        const stopPos: [number, number] = [stopLat, stopLng];

        // Draw Geofence Radius Ring
        L.circle(stopPos, {
          radius: Number(stop.geofence_radius_meters || 150),
          color: isCompleted ? '#10b981' : '#38bdf8',
          fillColor: isCompleted ? '#10b981' : '#38bdf8',
          fillOpacity: 0.12,
          weight: 1.5,
          dashArray: '3, 4'
        }).addTo(staticGroup);

        L.marker(stopPos, { icon: stopIcon })
          .addTo(staticGroup)
          .bindPopup(`
            <div style="font-family:Inter,sans-serif;padding:6px;min-width:190px;">
              <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
                <span style="font-size:10px;font-weight:700;color:#c5a059;text-transform:uppercase;">Stop #${stop.stop_number}</span>
                <span style="font-size:10px;padding:2px 6px;border-radius:10px;background:${isCompleted ? '#d1fae5' : '#e0f2fe'};color:${isCompleted ? '#065f46' : '#0369a1'};font-weight:700;">${stop.status}</span>
              </div>
              <div style="font-size:13px;font-weight:800;color:#0f172a;margin:3px 0;">${stop.destination_name}</div>
              <div style="font-size:11px;color:#64748b;margin-bottom:4px;">${stop.address}</div>
              <div style="font-size:11px;color:#334155;">Planned: <b>${stop.planned_arrival_time}</b> ${stop.actual_arrival_time ? `&bull; Actual: <b>${new Date(stop.actual_arrival_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</b>` : ''}</div>
              <a href="https://www.google.com/maps/dir/?api=1&destination=${stop.latitude},${stop.longitude}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:4px;font-size:11px;color:#2563eb;font-weight:600;margin-top:6px;text-decoration:none;">
                🧭 Google Maps Directions &rarr;
              </a>
            </div>
          `);
        latLngs.push(stopPos);
      }
    });

    // 4. OLA MAPS DUAL-LAYER ROAD POLYLINE (Road-snapped glow effect)
    const polylineCoords = routeResult?.coordinates && routeResult.coordinates.length > 0
      ? routeResult.coordinates
      : (latLngs as [number, number][]);

    if (polylineCoords.length > 1) {
      // Layer A: Outer Neon Glow Halo (Ola Green / Cyan glow)
      L.polyline(polylineCoords, {
        color: '#00d084',
        weight: 9,
        opacity: 0.38,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(staticGroup);

      // Layer B: Crisp Inner Navigation Core (High-contrast highway line)
      L.polyline(polylineCoords, {
        color: '#0284c7',
        weight: 4.5,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(staticGroup);
    }

    // 5. GPS Breadcrumb Trail (Real Historical Events)
    const validEvents = events.filter(
      (e) => typeof e.latitude === 'number' && typeof e.longitude === 'number'
    );

    if (validEvents.length > 0) {
      const eventPoints: [number, number][] = validEvents.map((e) => [
        e.latitude!,
        e.longitude!
      ]);

      L.polyline(eventPoints, {
        color: '#c5a059',
        weight: 3.5,
        opacity: 0.9
      }).addTo(staticGroup);
    }

    // Auto-fit bounds once on initial load
    if (!hasFittedInitialBoundsRef.current && (polylineCoords.length > 0 || latLngs.length > 0)) {
      const boundsCoords = polylineCoords.length > 0 ? polylineCoords : latLngs;
      try {
        map.fitBounds(L.latLngBounds(boundsCoords as [number, number][]), { padding: [45, 45], maxZoom: 15 });
        hasFittedInitialBoundsRef.current = true;
      } catch {}
    }
  }, [stopsHash, baseHash, events.length, routeResult]);

  // 4. ROUTE PLAYBACK SIMULATOR ANIMATION LOOP
  useEffect(() => {
    const map = mapInstanceRef.current;
    const simGroup = simulationLayerGroupRef.current;
    if (!map || !simGroup) return;

    const coords = routeResult?.coordinates;
    if (!coords || coords.length < 2) return;

    let animFrameId: number;
    let lastTimestamp: number | null = null;

    const stepSimulation = (timestamp: number) => {
      if (!lastTimestamp) lastTimestamp = timestamp;
      const delta = (timestamp - lastTimestamp) / 1000;
      lastTimestamp = timestamp;

      setSimProgress((prev) => {
        // Base simulation completes full route in 25 seconds at 1x
        const increment = (delta / 25) * simSpeed;
        const nextProgress = prev + increment;

        if (nextProgress >= 1) {
          setIsSimulating(false);
          return 1;
        }

        // Calculate interpolated coordinate along polyline
        const totalPoints = coords.length - 1;
        const exactIndex = nextProgress * totalPoints;
        const lowerIndex = Math.min(Math.floor(exactIndex), totalPoints - 1);
        const upperIndex = Math.min(lowerIndex + 1, totalPoints);
        const segmentProgress = exactIndex - lowerIndex;

        const p1 = coords[lowerIndex];
        const p2 = coords[upperIndex];

        const lat = p1[0] + (p2[0] - p1[0]) * segmentProgress;
        const lng = p1[1] + (p2[1] - p1[1]) * segmentProgress;
        const currentPos: [number, number] = [lat, lng];

        // Calculate heading in degrees
        const dLng = p2[1] - p1[1];
        const dLat = p2[0] - p1[0];
        const angleDeg = (Math.atan2(dLng, dLat) * 180) / Math.PI;

        // Dynamic realistic speed readout
        const baseSpeed = 45;
        const speedVariance = Math.sin(nextProgress * 20) * 8;
        setSimSpeedKmh(Math.round(baseSpeed + speedVariance));

        // Create or update 3D Ola-style simulation marker
        if (!simMarkerRef.current) {
          const simIcon = L.divIcon({
            className: 'custom-sim-vehicle-marker',
            html: `
              <div style="position:relative;width:44px;height:44px;display:flex;align-items:center;justify-content:center;">
                <div style="position:absolute;width:100%;height:100%;border-radius:50%;background:rgba(0,208,132,0.35);animation:pulse 1.5s infinite;"></div>
                <div style="background:linear-gradient(135deg, #0f172a, #1e293b);border:2.5px solid #00d084;border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;box-shadow:0 0 16px rgba(0,208,132,0.8);z-index:3;">
                  <span style="font-size:16px;">🚚</span>
                </div>
                <div id="sim-marker-heading" style="position:absolute;top:-4px;left:50%;transform:translateX(-50%) rotate(${angleDeg}deg);transform-origin:bottom center;width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-bottom:8px solid #00d084;z-index:4;"></div>
              </div>
            `,
            iconSize: [44, 44],
            iconAnchor: [22, 22]
          });

          simMarkerRef.current = L.marker(currentPos, { icon: simIcon, zIndexOffset: 2000 }).addTo(simGroup);
        } else {
          simMarkerRef.current.setLatLng(currentPos);
          const headingElem = document.getElementById('sim-marker-heading');
          if (headingElem) {
            headingElem.style.transform = `translateX(-50%) rotate(${angleDeg}deg)`;
          }
        }

        if (followVehicle) {
          map.panTo(currentPos, { animate: true, duration: 0.25 });
        }

        return nextProgress;
      });

      if (isSimulating) {
        animFrameId = requestAnimationFrame(stepSimulation);
      }
    };

    if (isSimulating) {
      animFrameId = requestAnimationFrame(stepSimulation);
    }

    return () => {
      if (animFrameId) cancelAnimationFrame(animFrameId);
    };
  }, [isSimulating, simSpeed, followVehicle, routeResult]);

  // Reset simulation handler
  const handleResetSimulation = () => {
    setIsSimulating(false);
    setSimProgress(0);
    if (simMarkerRef.current && simulationLayerGroupRef.current) {
      simulationLayerGroupRef.current.removeLayer(simMarkerRef.current);
      simMarkerRef.current = null;
    }
  };

  // 5. DYNAMIC FLEET VEHICLES
  useEffect(() => {
    const map = mapInstanceRef.current;
    const vehicleGroup = vehicleLayerGroupRef.current;
    if (!map || !vehicleGroup) return;

    const currentVehicles = fleetVehicles || [];
    const activeVehicleIds = new Set<string>();

    currentVehicles.forEach((vehicle) => {
      if (typeof vehicle.latitude !== 'number' || typeof vehicle.longitude !== 'number') return;
      activeVehicleIds.add(vehicle.id);

      const pos: [number, number] = [vehicle.latitude, vehicle.longitude];
      const isMoving = (vehicle.speed_kmh || 0) > 2;
      const statusColor = isMoving ? '#10b981' : vehicle.status === 'AVAILABLE' ? '#38bdf8' : '#eab308';
      const heading = vehicle.heading_deg || 0;

      const vehicleIcon = L.divIcon({
        className: 'custom-fleet-vehicle-marker',
        html: `
          <div style="position:relative;width:42px;height:42px;display:flex;align-items:center;justify-content:center;cursor:pointer;">
            ${isMoving ? `<div style="position:absolute;width:100%;height:100%;border-radius:50%;background:${statusColor};opacity:0.25;animation:pulse 1.8s infinite;"></div>` : ''}
            <div style="position:relative;background:${isMoving ? '#0f172a' : '#1e293b'};border:2px solid ${statusColor};border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,0.5);">
              <span style="font-size:16px;">${vehicle.type === 'TRAILER' ? '🚛' : vehicle.type === 'HEAVY_TRUCK' ? '🚚' : '🚐'}</span>
              ${heading ? `
                <div style="position:absolute;top:-4px;left:50%;transform:translateX(-50%) rotate(${heading}deg);transform-origin:bottom center;width:0;height:0;border-left:4px solid transparent;border-right:4px solid transparent;border-bottom:7px solid ${statusColor};"></div>
              ` : ''}
            </div>
            ${isMoving ? `
              <div style="position:absolute;bottom:-6px;background:${statusColor};color:#ffffff;font-size:9px;font-weight:800;padding:1px 4px;border-radius:6px;box-shadow:0 1px 4px rgba(0,0,0,0.4);white-space:nowrap;">
                ${Math.round(vehicle.speed_kmh || 0)} km/h
              </div>
            ` : ''}
          </div>
        `,
        iconSize: [42, 42],
        iconAnchor: [21, 21]
      });

      const existingMarker = vehicleMarkersMapRef.current.get(vehicle.id);
      if (existingMarker) {
        existingMarker.setLatLng(pos);
        existingMarker.setIcon(vehicleIcon);
        existingMarker.setZIndexOffset(isMoving ? 500 : 200);
      } else {
        const marker = L.marker(pos, { icon: vehicleIcon, zIndexOffset: isMoving ? 500 : 200 })
          .addTo(vehicleGroup);

        marker.on('click', () => {
          if (onSelectVehicle) onSelectVehicle(vehicle);
        });

        marker.bindPopup(`
          <div style="font-family:Inter,sans-serif;padding:6px;min-width:210px;">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:4px;">
              <span style="font-size:12px;font-weight:800;color:#0f172a;">${vehicle.vehicle_number}</span>
              <span style="font-size:10px;font-weight:700;padding:2px 6px;border-radius:10px;background:${isMoving ? '#d1fae5' : '#f1f5f9'};color:${isMoving ? '#065f46' : '#475569'};">${isMoving ? '🟢 In Transit' : '🟡 ' + vehicle.status}</span>
            </div>
            <div style="font-size:11px;color:#64748b;">${vehicle.model} &bull; ${vehicle.type}</div>
            <div style="display:flex;align-items:center;gap:8px;margin-top:6px;padding:4px 6px;background:#f8fafc;border-radius:6px;font-size:11px;color:#334155;">
              <span>⚡ <b>${Math.round(vehicle.speed_kmh || 0)} km/h</b></span>
              <span>🧭 <b>${Math.round(vehicle.heading_deg || 0)}&deg; Heading</b></span>
            </div>
            ${vehicle.current_location ? `<div style="font-size:11px;color:#64748b;margin-top:4px;">📍 ${vehicle.current_location}</div>` : ''}
            <div style="margin-top:8px;display:flex;align-items:center;justify-content:space-between;">
              <a href="https://www.google.com/maps/search/?api=1&query=${vehicle.latitude},${vehicle.longitude}" target="_blank" rel="noopener noreferrer" style="font-size:11px;color:#2563eb;font-weight:600;text-decoration:none;">
                Google Maps ↗
              </a>
              <span style="font-size:10px;color:#94a3b8;">${vehicle.capacity_tons} Tons Capacity</span>
            </div>
          </div>
        `);

        vehicleMarkersMapRef.current.set(vehicle.id, marker);
      }
    });

    vehicleMarkersMapRef.current.forEach((marker, id) => {
      if (!activeVehicleIds.has(id)) {
        vehicleGroup.removeLayer(marker);
        vehicleMarkersMapRef.current.delete(id);
      }
    });
  }, [fleetVehicles, onSelectVehicle]);

  // 6. DRIVER LOCATION BEACON
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !driverLocation?.latitude || !driverLocation?.longitude) return;

    const driverPos: [number, number] = [driverLocation.latitude, driverLocation.longitude];

    if (!driverMarkerRef.current) {
      const driverIcon = L.divIcon({
        className: 'custom-map-icon',
        html: `
          <div style="position:relative;width:40px;height:40px;display:flex;align-items:center;justify-content:center;">
            <div style="position:absolute;width:100%;height:100%;border-radius:50%;background:rgba(37,211,102,0.35);animation:pulse 1.8s infinite;"></div>
            <div style="background:linear-gradient(135deg, #00a884, #25D366);color:#ffffff;border-radius:50%;width:30px;height:30px;display:flex;align-items:center;justify-content:center;font-size:15px;border:2.5px solid #ffffff;box-shadow:0 0 16px rgba(37,211,102,0.8);z-index:2;">🚚</div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });

      driverMarkerRef.current = L.marker(driverPos, { icon: driverIcon, zIndexOffset: 1000 }).addTo(map);

      if (driverLocation.accuracy) {
        driverCircleRef.current = L.circle(driverPos, {
          radius: Math.min(driverLocation.accuracy, 200),
          color: '#25D366',
          fillColor: '#25D366',
          fillOpacity: 0.12,
          weight: 1,
          dashArray: '2, 3'
        }).addTo(map);
      }
    } else {
      driverMarkerRef.current.setLatLng(driverPos);
      if (driverCircleRef.current) {
        driverCircleRef.current.setLatLng(driverPos);
      }
    }
  }, [driverLocation?.latitude, driverLocation?.longitude, driverLocation?.accuracy]);

  // Smooth pan/fly when a specific location is focused
  useEffect(() => {
    if (mapInstanceRef.current && focusedLocation?.latitude && focusedLocation?.longitude) {
      mapInstanceRef.current.flyTo([focusedLocation.latitude, focusedLocation.longitude], 16, {
        animate: true,
        duration: 1.2
      });
    }
  }, [focusedLocation]);

  // Clean teardown on unmount
  useEffect(() => {
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && mapContainerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        if (mapInstanceRef.current) {
          try {
            mapInstanceRef.current.invalidateSize();
          } catch {}
        }
      });
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch {}
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const totalStopsCount = stops.filter((s) => s.latitude && s.longitude).length;

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: height || '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Map Control Toolbar */}
      {showToolbar && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
            marginBottom: '10px'
          }}
        >
          {/* Layer Switcher & Recenter Action */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--bg-secondary)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <button
                type="button"
                className={`btn ${mapLayer === 'dark' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '4px 10px', fontSize: '0.75rem', height: '28px' }}
                onClick={() => setMapLayer('dark')}
              >
                🌙 Ola Dark
              </button>
              <button
                type="button"
                className={`btn ${mapLayer === 'streets' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '4px 10px', fontSize: '0.75rem', height: '28px' }}
                onClick={() => setMapLayer('streets')}
              >
                🗺️ Day Navigation
              </button>
              <button
                type="button"
                className={`btn ${mapLayer === 'satellite' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '4px 10px', fontSize: '0.75rem', height: '28px' }}
                onClick={() => setMapLayer('satellite')}
              >
                🛰️ Satellite
              </button>
            </div>

            {/* Recenter Button */}
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleRecenter}
              style={{ padding: '4px 10px', fontSize: '0.75rem', height: '28px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              title="Recenter and auto-fit route corridor"
            >
              <Compass size={13} />
              <span>Recenter</span>
            </button>

            {/* Toggle Ola HUD */}
            {totalStopsCount > 0 && (
              <button
                type="button"
                className={`btn ${showHud ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                onClick={() => setShowHud(!showHud)}
                style={{ padding: '4px 10px', fontSize: '0.75rem', height: '28px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <Activity size={13} />
                <span>{showHud ? 'Hide Visualizer' : 'Show Visualizer'}</span>
              </button>
            )}
          </div>

          {/* Google Maps External Routing Link */}
          {showGoogleMapsButton && (
            <a
              href={getGoogleMapsUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px',
                fontSize: '0.78rem',
                color: 'var(--accent-gold)',
                borderColor: 'rgba(197, 160, 89, 0.4)',
                textDecoration: 'none'
              }}
              title="Open complete multi-stop turn-by-turn routing in Google Maps"
            >
              <Navigation size={13} />
              <span>Google Maps Directions</span>
              <ExternalLink size={12} />
            </a>
          )}
        </div>
      )}

      {/* Map Canvas & Ola Maps Route Visualizer Overlays */}
      <div style={{ position: 'relative', flex: 1, width: '100%', minHeight: '360px', overflow: 'hidden', borderRadius: 'var(--radius-lg)' }}>
        <div
          ref={mapContainerRef}
          style={{
            width: '100%',
            height: '100%',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1
          }}
        />

        {/* =========================================================================
            OLA MAPS FLOATING ROUTE VISUALIZER HUD (Glassmorphism Overlay)
            ========================================================================= */}
        {showHud && totalStopsCount > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              right: '12px',
              maxWidth: '540px',
              zIndex: 1000,
              backgroundColor: 'rgba(15, 23, 42, 0.88)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.45)',
              padding: '12px 14px',
              color: '#ffffff',
              fontFamily: 'Inter, sans-serif'
            }}
          >
            {/* Header: Ola Road Badge & Metrics */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#00d084', boxShadow: '0 0 10px #00d084', animation: 'pulse 1.8s infinite' }} />
                <span style={{ fontSize: '0.82rem', fontWeight: 800, letterSpacing: '0.4px', textTransform: 'uppercase', color: '#00d084' }}>
                  Ola Maps Route Visualizer
                </span>
                {routeResult?.isRealRoad && (
                  <span style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: '10px', backgroundColor: 'rgba(0, 208, 132, 0.15)', color: '#00d084', border: '1px solid rgba(0, 208, 132, 0.3)' }}>
                    Road-Snapped
                  </span>
                )}
              </div>

              {/* Waypoints expand trigger */}
              <button
                type="button"
                onClick={() => setShowWaypoints(!showWaypoints)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '0.74rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                  padding: '2px 6px',
                  borderRadius: '4px'
                }}
              >
                <span>{stops.length} Stops</span>
                {showWaypoints ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>

            {/* Distance, ETA, and Destination Badges */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '10px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc' }}>
                  {routeResult ? `${routeResult.distanceKm}` : '--'}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>km total</span>
              </div>

              <div style={{ width: '1px', height: '20px', backgroundColor: 'rgba(255,255,255,0.15)' }} />

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#38bdf8' }}>
                  {routeResult ? (routeResult.durationMinutes >= 60 ? `${Math.floor(routeResult.durationMinutes / 60)}h ${routeResult.durationMinutes % 60}m` : `${routeResult.durationMinutes} min`) : '--'}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>est. drive</span>
              </div>

              {isSimulating && (
                <>
                  <div style={{ width: '1px', height: '20px', backgroundColor: 'rgba(255,255,255,0.15)' }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: 'rgba(0, 208, 132, 0.12)', padding: '2px 8px', borderRadius: '8px', border: '1px solid rgba(0, 208, 132, 0.25)' }}>
                    <Gauge size={13} color="#00d084" />
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#00d084' }}>
                      {simSpeedKmh} km/h
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Route Simulation Player Controls */}
            <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => setIsSimulating(!isSimulating)}
                  style={{
                    backgroundColor: isSimulating ? '#f59e0b' : '#00d084',
                    color: '#0f172a',
                    fontWeight: 800,
                    fontSize: '0.76rem',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '5px 12px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {isSimulating ? <Pause size={13} /> : <Play size={13} />}
                  <span>{isSimulating ? 'Pause Drive' : simProgress > 0 && simProgress < 1 ? 'Resume Drive' : 'Simulate Drive'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetSimulation}
                  title="Reset route playback"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    color: '#cbd5e1',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '6px',
                    padding: '5px 8px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center'
                  }}
                >
                  <RotateCcw size={13} />
                </button>

                {/* Speed selector */}
                <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.06)', borderRadius: '6px', padding: '2px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  {([1, 2, 4] as const).map((spd) => (
                    <button
                      key={spd}
                      type="button"
                      onClick={() => setSimSpeed(spd)}
                      style={{
                        background: simSpeed === spd ? 'rgba(0, 208, 132, 0.25)' : 'transparent',
                        color: simSpeed === spd ? '#00d084' : '#94a3b8',
                        border: 'none',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Follow vehicle toggle */}
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: '#cbd5e1', cursor: 'pointer', userSelect: 'none' }}>
                <input
                  type="checkbox"
                  checked={followVehicle}
                  onChange={(e) => setFollowVehicle(e.target.checked)}
                  style={{ accentColor: '#00d084', cursor: 'pointer' }}
                />
                <span>Follow Cab</span>
              </label>
            </div>

            {/* Playback Progress Bar */}
            <div style={{ marginTop: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#94a3b8', marginBottom: '3px' }}>
                <span>Route Progress</span>
                <span>{Math.round(simProgress * 100)}%</span>
              </div>
              <div style={{ width: '100%', height: '4px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${simProgress * 100}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #00d084, #38bdf8)',
                    transition: 'width 0.1s linear'
                  }}
                />
              </div>
            </div>

            {/* Expandable Turn-by-Turn Waypoints Drawer */}
            {showWaypoints && (
              <div
                style={{
                  marginTop: '10px',
                  maxHeight: '160px',
                  overflowY: 'auto',
                  borderTop: '1px solid rgba(255,255,255,0.1)',
                  paddingTop: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                {baseLocation?.name && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', padding: '4px 6px', backgroundColor: 'rgba(197, 160, 89, 0.1)', borderRadius: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#c5a059' }}>HQ</span>
                      <span style={{ fontWeight: 600, color: '#f8fafc' }}>{baseLocation.name}</span>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Origin</span>
                  </div>
                )}
                {stops.map((stop) => (
                  <div
                    key={stop.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.75rem',
                      padding: '4px 6px',
                      backgroundColor: stop.status === 'COMPLETED' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.03)',
                      borderRadius: '4px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: stop.status === 'COMPLETED' ? '#10b981' : '#0284c7', color: '#fff', fontSize: '0.65rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                        {stop.stop_number}
                      </span>
                      <span style={{ fontWeight: 600, color: '#f8fafc' }}>{stop.destination_name}</span>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: stop.status === 'COMPLETED' ? '#10b981' : '#38bdf8' }}>
                      {stop.planned_arrival_time}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
