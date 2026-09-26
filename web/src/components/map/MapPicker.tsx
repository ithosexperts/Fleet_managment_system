import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import { MapView } from './MapView';
import { MapMarker } from './MapMarker';
import { MapControls } from './MapControls';
import { NormalizedCoord, toLngLat, createGeofenceCirclePolygon } from './types';
import { LocationSearchInput } from '../common/LocationSearchInput';
import { PlaceSuggestion, reverseGeocodeLocation } from '../../services/geocoding';
import { getCurrentGpsPosition } from '../../services/api';
import { MapPin, Compass, Search, Loader2 } from 'lucide-react';

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

  const handleLocateMe = async () => {
    setLocating(true);
    try {
      const pos = await getCurrentGpsPosition();
      const newCoord = { lat: pos.latitude, lng: pos.longitude };
      await handleCoordChange(newCoord);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo({ center: toLngLat(newCoord), zoom: 16, duration: 800 });
      }
    } catch (err: any) {
      console.warn('[MapPicker] GPS error:', err.message);
    } finally {
      setLocating(false);
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
          {/* Draggable Center Pin */}
          <MapMarker
            map={mapInstanceRef.current}
            coord={coord}
            draggable
            onDragEnd={(newCoord) => handleCoordChange(newCoord)}
            className="group -translate-x-1/2 -translate-y-full"
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div
                style={{
                  padding: '7px',
                  borderRadius: '50%',
                  backgroundColor: '#0284c7',
                  color: '#ffffff',
                  boxShadow: '0 8px 24px rgba(2, 132, 199, 0.5), 0 0 0 4px rgba(2, 132, 199, 0.25)',
                  cursor: 'grab',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <MapPin size={18} fill="currentColor" />
              </div>
              <div style={{ width: '4px', height: '6px', backgroundColor: '#0369a1', borderRadius: '0 0 2px 2px' }} />
            </div>
          </MapMarker>

          {/* Map Controls */}
          <MapControls
            map={mapInstanceRef.current}
            onRecenter={() => {
              if (mapInstanceRef.current) {
                mapInstanceRef.current.flyTo({ center: toLngLat(coord), zoom: 15 });
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
