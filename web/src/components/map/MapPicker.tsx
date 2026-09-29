import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import { MapView } from './MapView';
import { MapMarker } from './MapMarker';
import { MapControls } from './MapControls';
import { NormalizedCoord, toLngLat, createGeofenceCirclePolygon } from './types';
import { LocationSearchInput } from '../common/LocationSearchInput';
import { PlaceSuggestion, reverseGeocodeLocation } from '../../services/geocoding';
import { getCurrentGpsPosition } from '../../services/api';
import { MapPin, Compass, Search, Loader2, X } from 'lucide-react';

export interface MapPickerProps {
  initialLat?: number;
  initialLng?: number;
  initialRadius?: number;
  height?: string;
  onChange: (data: { latitude: number; longitude: number; radiusMeters: number; address?: string }) => void;
  onPlaceSelect?: (place: PlaceSuggestion) => void;
  savedDestinations?: Array<{ id: string; name: string; address: string; latitude: number; longitude: number }>;
  showSearch?: boolean;
}

export const MapPicker: React.FC<MapPickerProps> = ({
  initialLat = 28.5355,
  initialLng = 77.2680,
  initialRadius = 150,
  height = '340px',
  onChange,
  onPlaceSelect,
  savedDestinations = [],
  showSearch = true
}) => {
  const [coord, setCoord] = useState<NormalizedCoord>({ lat: initialLat, lng: initialLng });
  const [radius, setRadius] = useState<number>(initialRadius);
  const [locating, setLocating] = useState(false);
  const [resolvedAddress, setResolvedAddress] = useState<string>('');
  const [isGeocoding, setIsGeocoding] = useState(false);

  const [mapInstance, setMapInstance] = useState<mapboxgl.Map | null>(null);
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null);
  const geofenceSourceId = 'geofence-circle-source';
  const geofenceFillLayerId = 'geofence-circle-fill';
  const geofenceLineLayerId = 'geofence-circle-line';

  // Sync when initialLat/initialLng changes from outside
  useEffect(() => {
    if (Math.abs(coord.lat - initialLat) > 0.0001 || Math.abs(coord.lng - initialLng) > 0.0001) {
      setCoord({ lat: initialLat, lng: initialLng });
      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo({ center: [initialLng, initialLat], zoom: 15, duration: 600 });
      }
    }
  }, [initialLat, initialLng]);

  // If using default placeholder coordinates, attempt to center on user's real GPS position
  useEffect(() => {
    if (initialLat === 28.5355 && initialLng === 77.2680 && typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const userCoord = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          handleCoordChange(userCoord);
          if (mapInstanceRef.current) {
            mapInstanceRef.current.flyTo({ center: [userCoord.lng, userCoord.lat], zoom: 15, duration: 600 });
          }
        },
        () => {},
        { timeout: 6000, enableHighAccuracy: true }
      );
    }
  }, []);

  // Update geofence circle GeoJSON on map
  const updateGeofenceLayer = useCallback(
    (currentMap: mapboxgl.Map, centerCoord: NormalizedCoord, radMeters: number) => {
      const polygonCoords = createGeofenceCirclePolygon(centerCoord, radMeters);
      const geojsonData: GeoJSON.Feature<GeoJSON.Polygon> = {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Polygon',
          coordinates: [polygonCoords]
        }
      };

      const source = currentMap.getSource(geofenceSourceId) as mapboxgl.GeoJSONSource | undefined;
      if (source) {
        source.setData(geojsonData);
      } else {
        currentMap.addSource(geofenceSourceId, {
          type: 'geojson',
          data: geojsonData
        });

        currentMap.addLayer({
          id: geofenceFillLayerId,
          type: 'fill',
          source: geofenceSourceId,
          paint: {
            'fill-color': '#06b6d4',
            'fill-opacity': 0.18
          }
        });

        currentMap.addLayer({
          id: geofenceLineLayerId,
          type: 'line',
          source: geofenceSourceId,
          paint: {
            'line-color': '#0891b2',
            'line-width': 2,
            'line-dasharray': [2, 2]
          }
        });
      }
    },
    []
  );

  const handleMapReady = (map: mapboxgl.Map) => {
    mapInstanceRef.current = map;
    setMapInstance(map);
    updateGeofenceLayer(map, coord, radius);
  };

  const handleCoordChange = async (newCoord: NormalizedCoord, newRadius = radius) => {
    setCoord(newCoord);
    setIsGeocoding(true);

    try {
      const addr = await reverseGeocodeLocation(newCoord);
      setResolvedAddress(addr);
      onChange({
        latitude: newCoord.lat,
        longitude: newCoord.lng,
        radiusMeters: newRadius,
        address: addr
      });
    } catch {
      onChange({
        latitude: newCoord.lat,
        longitude: newCoord.lng,
        radiusMeters: newRadius
      });
    } finally {
      setIsGeocoding(false);
    }

    if (mapInstanceRef.current) {
      updateGeofenceLayer(mapInstanceRef.current, newCoord, newRadius);
    }
  };

  const handlePlaceSelect = (place: PlaceSuggestion) => {
    const newCoord = { lat: place.latitude, lng: place.longitude };
    setCoord(newCoord);
    setResolvedAddress(place.address);
    onChange({
      latitude: place.latitude,
      longitude: place.longitude,
      radiusMeters: radius,
      address: place.address
    });

    if (onPlaceSelect) onPlaceSelect(place);

    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo({ center: toLngLat(newCoord), zoom: 15, duration: 800 });
      updateGeofenceLayer(mapInstanceRef.current, newCoord, radius);
    }
  };

  const [gpsNotice, setGpsNotice] = useState<string | null>(null);

  const handleLocateMe = async () => {
    setLocating(true);
    setGpsNotice(null);
    try {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        setGpsNotice('Geolocation is not supported by your browser.');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          setLocating(false);
          const newCoord = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          await handleCoordChange(newCoord);
          if (mapInstanceRef.current) {
            mapInstanceRef.current.flyTo({ center: toLngLat(newCoord), zoom: 16, duration: 800 });
          }
        },
        (err) => {
          setLocating(false);
          let msg = 'Could not fetch your location.';
          if (err.code === 1) {
            msg = 'Location access denied. Please click the lock icon in your browser address bar and set Location to Allow.';
          } else if (err.code === 2) {
            msg = 'Location unavailable or GPS signal lost.';
          } else if (err.code === 3) {
            msg = 'Location request timed out. Please try again.';
          }
          setGpsNotice(msg);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } catch (err: any) {
      setLocating(false);
      setGpsNotice(err.message || 'GPS location error');
    }
  };

  const radiusPresets = [100, 150, 250, 500];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
      {/* Search Input & GPS Locate button */}
      {showSearch && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ flex: 1, position: 'relative', zIndex: 20 }}>
            <LocationSearchInput
              placeholder="Search address or facility name..."
              initialValue={resolvedAddress}
              onSelect={handlePlaceSelect}
              savedDestinations={savedDestinations}
              proximity={{ latitude: coord.lat, longitude: coord.lng }}
            />
          </div>
          <button
            type="button"
            onClick={handleLocateMe}
            disabled={locating}
            title="Use current GPS position"
            className="btn btn-secondary btn-sm"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              whiteSpace: 'nowrap',
              height: '38px',
              color: '#00e5ff'
            }}
          >
            {locating ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Compass size={15} />
            )}
            <span>GPS</span>
          </button>
        </div>
      )}

      {gpsNotice && (
        <div
          style={{
            padding: '8px 12px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.78rem',
            color: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px'
          }}
        >
          <span>{gpsNotice}</span>
          <button
            type="button"
            onClick={() => setGpsNotice(null)}
            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px' }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Map Surface */}
      <div
        style={{
          position: 'relative',
          borderRadius: '12px',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.4)'
        }}
      >
        <MapView
          initialCenter={coord}
          initialZoom={14}
          height={height}
          onMapReady={handleMapReady}
          onClick={(clickedCoord) => handleCoordChange(clickedCoord)}
        >
          {/* Floating Live GPS Pinpoint Action Button */}
          <div
            style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              zIndex: 30
            }}
          >
            <button
              type="button"
              onClick={handleLocateMe}
              disabled={locating}
              className="btn btn-secondary btn-sm"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 12px',
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                borderRadius: '8px',
                backdropFilter: 'blur(8px)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.35)',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
              title="Pinpoint your current device location"
            >
              {locating ? <Loader2 size={15} className="animate-spin" /> : <Compass size={15} />}
              <span>{locating ? 'Detecting Location...' : '🎯 Locate My Device'}</span>
            </button>
          </div>

          {/* Draggable High-Visibility Pinpoint Marker */}
          <MapMarker
            map={mapInstance}
            coord={coord}
            draggable
            onDragEnd={(newCoord) => handleCoordChange(newCoord)}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                transform: 'translate(-50%, -100%)',
                cursor: 'grab',
                userSelect: 'none',
                filter: 'drop-shadow(0 6px 14px rgba(0, 0, 0, 0.5))'
              }}
            >
              <div
                style={{
                  position: 'relative',
                  width: '38px',
                  height: '38px',
                  borderRadius: '50% 50% 50% 0',
                  transform: 'rotate(-45deg)',
                  backgroundColor: '#ef4444',
                  border: '2.5px solid #ffffff',
                  boxShadow: '0 4px 14px rgba(239, 68, 68, 0.6), 0 0 0 3px rgba(239, 68, 68, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <div
                  style={{
                    transform: 'rotate(45deg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <MapPin size={20} fill="#ffffff" color="#ef4444" />
                </div>
              </div>
              {/* Ground Pin Shadow */}
              <div
                style={{
                  width: '10px',
                  height: '4px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(0, 0, 0, 0.45)',
                  marginTop: '1px'
                }}
              />
            </div>
          </MapMarker>

          {/* Map Controls */}
          <MapControls
            map={mapInstance}
            onRecenter={() => {
              if (mapInstance) {
                mapInstance.flyTo({ center: toLngLat(coord), zoom: 15 });
              }
            }}
          />
        </MapView>
      </div>

      {/* Footer Details & Geofence Radius Selector */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          padding: '2px 4px',
          fontSize: '0.78rem',
          color: 'var(--text-secondary)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Geofence:</span>
          <div
            style={{
              display: 'inline-flex',
              borderRadius: '6px',
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-secondary)',
              padding: '2px',
              gap: '2px'
            }}
          >
            {radiusPresets.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => {
                  setRadius(r);
                  handleCoordChange(coord, r);
                }}
                style={{
                  padding: '3px 8px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  borderRadius: '4px',
                  border: 'none',
                  backgroundColor: radius === r ? 'var(--brand-primary, #1764A8)' : 'transparent',
                  color: radius === r ? '#ffffff' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {r}m
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'monospace', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
          <span>
            {coord.lat.toFixed(5)}°, {coord.lng.toFixed(5)}°
          </span>
          {isGeocoding && <Loader2 size={13} className="animate-spin" color="#00e5ff" />}
        </div>
      </div>
    </div>
  );
};
