import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Compass, MapPin, Layers, Search } from 'lucide-react';
import { getCurrentGpsPosition } from '../services/api';
import { LocationSearchInput } from './common/LocationSearchInput';
import { PlaceSuggestion } from '../services/geocoding';

interface Props {
  initialLat?: number;
  initialLng?: number;
  initialRadius?: number;
  height?: string;
  onChange: (data: { latitude: number; longitude: number; radiusMeters: number }) => void;
  onPlaceSelect?: (place: PlaceSuggestion) => void;
  savedDestinations?: Array<{ id: string; name: string; address: string; latitude: number; longitude: number }>;
  showSearch?: boolean;
}

type LayerType = 'dark' | 'streets' | 'satellite';

export const MapPicker: React.FC<Props> = ({
  initialLat = 28.5355,
  initialLng = 77.2680,
  initialRadius = 150,
  height = '320px',
  onChange,
  onPlaceSelect,
  savedDestinations = [],
  showSearch = true
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const [lat, setLat] = useState<number>(initialLat);
  const [lng, setLng] = useState<number>(initialLng);
  const [radius, setRadius] = useState<number>(initialRadius);
  const [activeLayer, setActiveLayer] = useState<LayerType>('streets');
  const [locating, setLocating] = useState(false);

  // Sync when initialLat/initialLng changes from parent
  useEffect(() => {
    if (
      Math.abs(lat - initialLat) > 0.0001 ||
      Math.abs(lng - initialLng) > 0.0001
    ) {
      setLat(initialLat);
      setLng(initialLng);
      if (markerRef.current) {
        markerRef.current.setLatLng([initialLat, initialLng]);
      }
      if (circleRef.current) {
        circleRef.current.setLatLng([initialLat, initialLng]);
      }
      if (mapRef.current) {
        mapRef.current.panTo([initialLat, initialLng]);
      }
    }
  }, [initialLat, initialLng]);

  const getTileConfig = (type: LayerType) => {
    switch (type) {
      case 'satellite':
        return {
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          attribution: 'Tiles &copy; Esri',
          subdomains: 'abc',
          className: '',
          maxZoom: 19
        };
      case 'dark':
        return {
          url: 'https://tile.openstreetmap.de/{z}/{x}/{y}.png',
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &bull; Telematics',
          subdomains: 'abc',
          className: 'map-tiles-dark',
          maxZoom: 19
        };
      case 'streets':
      default:
        return {
          url: 'https://tile.openstreetmap.de/{z}/{x}/{y}.png',
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          subdomains: 'abc',
          className: '',
          maxZoom: 19
        };
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;

    if (!mapRef.current) {
      const map = L.map(containerRef.current, {
        center: [lat, lng],
        zoom: 14,
        scrollWheelZoom: true
      });

      const tileConfig = getTileConfig(activeLayer);
      const tiles = L.tileLayer(tileConfig.url, {
        attribution: tileConfig.attribution,
        subdomains: tileConfig.subdomains as any,
        className: tileConfig.className,
        maxZoom: tileConfig.maxZoom
      }).addTo(map);

      tileLayerRef.current = tiles;

      // Custom Pin Icon
      const pinIcon = L.divIcon({
        className: 'custom-pin-icon',
        html: `
          <div style="position:relative;display:flex;align-items:center;justify-content:center;transform:translate(-50%, -100%);">
            <div style="background:#25D366;color:#0b141a;width:34px;height:34px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;border:2.5px solid #ffffff;box-shadow:0 3px 12px rgba(0,0,0,0.45);">
              <div style="transform:rotate(45deg);font-size:15px;font-weight:900;">📍</div>
            </div>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [0, 0]
      });

      // Draggable Marker
      const marker = L.marker([lat, lng], { draggable: true, icon: pinIcon }).addTo(map);
      markerRef.current = marker;

      // Geofence Circle
      const circle = L.circle([lat, lng], {
        radius: radius,
        color: '#25D366',
        fillColor: '#25D366',
        fillOpacity: 0.18,
        weight: 1.5,
        dashArray: '4, 4'
      }).addTo(map);
      circleRef.current = circle;

      // Click on map to place pin
      map.on('click', (e: L.LeafletMouseEvent) => {
        const newLat = Number(e.latlng.lat.toFixed(6));
        const newLng = Number(e.latlng.lng.toFixed(6));
        updatePosition(newLat, newLng, radius);
      });

      // Drag marker
      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        const newLat = Number(pos.lat.toFixed(6));
        const newLng = Number(pos.lng.toFixed(6));
        updatePosition(newLat, newLng, radius);
      });

      mapRef.current = map;

      // Ensure Leaflet recalculates tile dimensions when rendered inside animated modal dialogs
      const timer1 = setTimeout(() => map.invalidateSize(), 60);
      const timer2 = setTimeout(() => map.invalidateSize(), 200);
      const timer3 = setTimeout(() => map.invalidateSize(), 450);

      let resizeObserver: ResizeObserver | null = null;
      if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
        resizeObserver = new ResizeObserver(() => {
          if (mapRef.current) {
            mapRef.current.invalidateSize();
          }
        });
        resizeObserver.observe(containerRef.current);
      }

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
        if (resizeObserver) resizeObserver.disconnect();
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }
      };
    }
  }, []);

  // Update tile layer when activeLayer changes
  useEffect(() => {
    if (!mapRef.current) return;
    if (tileLayerRef.current) {
      mapRef.current.removeLayer(tileLayerRef.current);
    }
    const tileConfig = getTileConfig(activeLayer);
    const tiles = L.tileLayer(tileConfig.url, {
      attribution: tileConfig.attribution,
      subdomains: tileConfig.subdomains as any,
      className: tileConfig.className,
      maxZoom: tileConfig.maxZoom
    }).addTo(mapRef.current);
    tileLayerRef.current = tiles;
  }, [activeLayer]);

  const updatePosition = (newLat: number, newLng: number, newRadius: number) => {
    setLat(newLat);
    setLng(newLng);
    setRadius(newRadius);

    if (markerRef.current) {
      markerRef.current.setLatLng([newLat, newLng]);
    }
    if (circleRef.current) {
      circleRef.current.setLatLng([newLat, newLng]);
      circleRef.current.setRadius(newRadius);
    }
    if (mapRef.current) {
      mapRef.current.panTo([newLat, newLng]);
    }

    onChange({ latitude: newLat, longitude: newLng, radiusMeters: newRadius });
  };

  const handleUseCurrentLocation = async () => {
    setLocating(true);
    try {
      const coords = await getCurrentGpsPosition({ preferHighAccuracy: true, timeoutMs: 9000 });
      if (coords.latitude && coords.longitude) {
        const newLat = Number(coords.latitude.toFixed(6));
        const newLng = Number(coords.longitude.toFixed(6));
        updatePosition(newLat, newLng, radius);
        if (mapRef.current) {
          mapRef.current.setView([newLat, newLng], 16);
        }
      }
    } catch (e) {
      console.warn('Geolocation error:', e);
    } finally {
      setLocating(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* Live Online & Database Place Suggestion Search (Google / Ola / Rapido style) */}
      {showSearch && (
        <div style={{ position: 'relative', zIndex: 100 }}>
          <LocationSearchInput
            placeholder="Search destination, colony, landmark, or city (e.g. Nehru Place, Cyber Hub, Okhla)..."
            savedDestinations={savedDestinations}
            proximity={{ latitude: lat, longitude: lng }}
            onSelect={(place) => {
              updatePosition(place.latitude, place.longitude, radius);
              if (mapRef.current) {
                mapRef.current.flyTo([place.latitude, place.longitude], 16, { duration: 1.0 });
              }
              onPlaceSelect?.(place);
            }}
          />
        </div>
      )}

      {/* Map Header Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
          <MapPin size={14} color="var(--accent-whatsapp)" />
          <span>Click anywhere or drag the green pin to set exact coordinates</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Layer switcher */}
          <div style={{ display: 'flex', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '2px', border: '1px solid var(--border-subtle)' }}>
            <button
              type="button"
              onClick={() => setActiveLayer('streets')}
              style={{
                border: 'none',
                backgroundColor: activeLayer === 'streets' ? 'var(--accent-whatsapp)' : 'transparent',
                color: activeLayer === 'streets' ? '#0b141a' : 'var(--text-muted)',
                fontWeight: activeLayer === 'streets' ? 700 : 500,
                fontSize: '0.72rem',
                padding: '2px 8px',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer'
              }}
            >
              Streets
            </button>
            <button
              type="button"
              onClick={() => setActiveLayer('satellite')}
              style={{
                border: 'none',
                backgroundColor: activeLayer === 'satellite' ? 'var(--accent-whatsapp)' : 'transparent',
                color: activeLayer === 'satellite' ? '#0b141a' : 'var(--text-muted)',
                fontWeight: activeLayer === 'satellite' ? 700 : 500,
                fontSize: '0.72rem',
                padding: '2px 8px',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer'
              }}
            >
              Satellite
            </button>
            <button
              type="button"
              onClick={() => setActiveLayer('dark')}
              style={{
                border: 'none',
                backgroundColor: activeLayer === 'dark' ? 'var(--accent-whatsapp)' : 'transparent',
                color: activeLayer === 'dark' ? '#0b141a' : 'var(--text-muted)',
                fontWeight: activeLayer === 'dark' ? 700 : 500,
                fontSize: '0.72rem',
                padding: '2px 8px',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer'
              }}
            >
              Dark
            </button>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleUseCurrentLocation}
            disabled={locating}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', fontSize: '0.72rem' }}
          >
            <Compass size={12} />
            <span>{locating ? 'Locating...' : 'My Location'}</span>
          </button>
        </div>
      </div>

      {/* Leaflet Map Box */}
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: height,
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          border: '1px solid var(--border-medium)',
          position: 'relative'
        }}
      />

      {/* Real-time coordinate feedback and Geofence slider */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          padding: '8px 12px',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          fontSize: '0.76rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: 'var(--text-muted)' }}>Selected Pin:</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--accent-whatsapp)' }}>
            {lat.toFixed(6)}, {lng.toFixed(6)}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: 'var(--text-muted)' }}>Geofence Radius:</span>
          <span style={{ fontWeight: 600 }}>{radius}m</span>
          <input
            type="range"
            min="50"
            max="500"
            step="25"
            value={radius}
            onChange={(e) => updatePosition(lat, lng, Number(e.target.value))}
            style={{ width: '90px', accentColor: 'var(--accent-whatsapp)' }}
          />
        </div>
      </div>
    </div>
  );
};
