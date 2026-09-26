import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { NormalizedCoord, toLngLat } from './types';

interface RouteLayerProps {
  map: mapboxgl.Map | null;
  coordinates: NormalizedCoord[];
  color?: string;
  casingColor?: string;
  fitBounds?: boolean;
  padding?: number;
}

export const RouteLayer: React.FC<RouteLayerProps> = ({
  map,
  coordinates,
  color = '#00d084',
  casingColor = '#0284c7',
  fitBounds = true,
  padding = 60
}) => {
  const sourceIdRef = useRef(`route-source-${Math.random().toString(36).slice(2, 8)}`);
  const casingLayerIdRef = useRef(`${sourceIdRef.current}-casing`);
  const lineLayerIdRef = useRef(`${sourceIdRef.current}-line`);
  const hasFittedRef = useRef<string | null>(null);

  // Initialize and automatically restore layers when basemap style changes
  useEffect(() => {
    if (!map) return;

    const sourceId = sourceIdRef.current;
    const casingId = casingLayerIdRef.current;
    const lineId = lineLayerIdRef.current;

    const ensureLayers = () => {
      try {
        const geojsonData: GeoJSON.Feature<GeoJSON.LineString> = {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: coordinates.length >= 2 ? coordinates.map(toLngLat) : []
          }
        };

        if (!map.getSource(sourceId)) {
          map.addSource(sourceId, {
            type: 'geojson',
            data: geojsonData
          });

          // Neon outer glow/casing
          if (!map.getLayer(casingId)) {
            map.addLayer({
              id: casingId,
              type: 'line',
              source: sourceId,
              layout: {
                'line-join': 'round',
                'line-cap': 'round'
              },
              paint: {
                'line-color': casingColor,
                'line-width': 8,
                'line-opacity': 0.65
              }
            });
          }

          // Sharp highway core line
          if (!map.getLayer(lineId)) {
            map.addLayer({
              id: lineId,
              type: 'line',
              source: sourceId,
              layout: {
                'line-join': 'round',
                'line-cap': 'round'
              },
              paint: {
                'line-color': color,
                'line-width': 4,
                'line-opacity': 0.95
              }
            });
          }
        } else {
          const src = map.getSource(sourceId) as mapboxgl.GeoJSONSource | undefined;
          if (src) src.setData(geojsonData);
        }
      } catch (err) {
        console.warn('[RouteLayer ensureLayers warning]', err);
      }
    };

    ensureLayers();
    map.on('style.load', ensureLayers);

    return () => {
      map.off('style.load', ensureLayers);
      try {
        if (map.getLayer(lineId)) map.removeLayer(lineId);
        if (map.getLayer(casingId)) map.removeLayer(casingId);
        if (map.getSource(sourceId)) map.removeSource(sourceId);
      } catch {}
    };
  }, [map, coordinates, color, casingColor]);

  // Update line data efficiently without recreating layers
  useEffect(() => {
    if (!map || coordinates.length < 2) return;
    const sourceId = sourceIdRef.current;
    const src = map.getSource(sourceId) as mapboxgl.GeoJSONSource | undefined;

    const geojsonData: GeoJSON.Feature<GeoJSON.LineString> = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: coordinates.map(toLngLat)
      }
    };

    if (src) {
      src.setData(geojsonData);
    }

    // Dynamic color updates
    if (map.getLayer(lineLayerIdRef.current)) {
      map.setPaintProperty(lineLayerIdRef.current, 'line-color', color);
    }
    if (map.getLayer(casingLayerIdRef.current)) {
      map.setPaintProperty(casingLayerIdRef.current, 'line-color', casingColor);
    }

    // Auto fit map bounds once per unique route to prevent camera jumping on polling
    const routeSignature = coordinates.length > 0 ? `${coordinates[0].lat},${coordinates[0].lng}->${coordinates[coordinates.length - 1].lat},${coordinates[coordinates.length - 1].lng}:${coordinates.length}` : null;
    if (fitBounds && routeSignature && hasFittedRef.current !== routeSignature) {
      hasFittedRef.current = routeSignature;
      const bounds = new mapboxgl.LngLatBounds();
      for (const coord of coordinates) {
        bounds.extend(toLngLat(coord));
      }
      map.fitBounds(bounds, {
        padding: { top: padding, bottom: padding, left: padding, right: padding },
        maxZoom: 15,
        duration: 800
      });
    }
  }, [map, coordinates, color, casingColor, fitBounds, padding]);

  return null;
};
