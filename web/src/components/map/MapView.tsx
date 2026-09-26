import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { useMapContext } from './MapProvider';
import { NormalizedCoord, toLngLat, MapTheme } from './types';
import { AlertTriangle, Loader2, RefreshCw } from 'lucide-react';

interface MapViewProps {
  initialCenter?: NormalizedCoord;
  initialZoom?: number;
  height?: string;
  theme?: MapTheme;
  interactive?: boolean;
  onMapReady?: (map: mapboxgl.Map) => void;
  onClick?: (coord: NormalizedCoord) => void;
  children?: React.ReactNode;
  className?: string;
}

export const MapView: React.FC<MapViewProps> = ({
  initialCenter = { lat: 28.5355, lng: 77.2680 },
  initialZoom = 12,
  height = '460px',
  theme,
  interactive = true,
  onMapReady,
  onClick,
  children,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const { mapboxToken, hasValidToken, theme: contextTheme, getStyleUrl } = useMapContext();
  const activeTheme = theme || contextTheme || 'streets';

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  // Initialize Mapbox map instance safely
  useEffect(() => {
    if (!containerRef.current) return;

    if (!hasValidToken || !mapboxToken) {
      setLoadError('Mapbox access token is missing or unconfigured. Please provide VITE_MAPBOX_TOKEN in your environment.');
      setIsLoading(false);
      return;
    }

    mapboxgl.accessToken = mapboxToken;
    let isCancelled = false;

    try {
      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: getStyleUrl(activeTheme),
        center: toLngLat(initialCenter),
        zoom: initialZoom,
        interactive,
        attributionControl: true,
        logoPosition: 'bottom-left'
      });

      map.on('load', () => {
        if (isCancelled) return;
        setIsLoading(false);
        setIsMapReady(true);
        if (onMapReady) onMapReady(map);
      });

      map.on('error', (e) => {
        // Filter out non-fatal 404 tile warnings
        const msg = e.error?.message || '';
        if (msg.includes('404') || msg.includes('403') || msg.includes('Failed to fetch')) {
          console.warn('[Mapbox Warning]', msg);
          return;
        }
        console.error('[Mapbox Error]', e);
      });

      if (onClick) {
        map.on('click', (e) => {
          onClick({ lat: e.lngLat.lat, lng: e.lngLat.lng });
        });
      }

      mapRef.current = map;

      // Safe ResizeObserver to prevent partial grey tiles in tabs and modal transitions
      const resizeObserver = new ResizeObserver(() => {
        if (mapRef.current) {
          mapRef.current.resize();
        }
      });
      resizeObserver.observe(containerRef.current);

      return () => {
        isCancelled = true;
        resizeObserver.disconnect();
        try {
          map.remove();
        } catch {}
        mapRef.current = null;
        setIsMapReady(false);
      };
    } catch (err: any) {
      console.error('[Mapbox Init Exception]', err);
      setLoadError(err.message || 'Failed to initialize WebGL map engine');
      setIsLoading(false);
    }
  }, [hasValidToken, mapboxToken]);

  // Update style when theme changes dynamically
  useEffect(() => {
    if (mapRef.current && isMapReady) {
      try {
        mapRef.current.setStyle(getStyleUrl(activeTheme));
      } catch (err) {
        console.warn('[Mapbox Theme Change Error]', err);
      }
    }
  }, [activeTheme, isMapReady]);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height,
        overflow: 'hidden',
        borderRadius: '12px',
        backgroundColor: 'var(--bg-surface-elevated, #f1f5f9)'
      }}
      className={className}
    >
      <div
        ref={containerRef}
        className="leaflet-container"
        style={{ width: '100%', height: '100%', minHeight: height }}
      />

      {/* Loading state indicator */}
      {isLoading && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 20,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(11, 16, 27, 0.85)',
            backdropFilter: 'blur(4px)'
          }}
        >
          <Loader2 size={32} color="#00e5ff" className="animate-spin" />
          <span
            style={{
              marginTop: '12px',
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: '#94a3b8'
            }}
          >
            Initializing Vector Basemap...
          </span>
        </div>
      )}

      {/* Error state / missing API token banner */}
      {loadError && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 30,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            textAlign: 'center',
            backgroundColor: 'rgba(11, 16, 27, 0.95)',
            backdropFilter: 'blur(6px)'
          }}
        >
          <div
            style={{
              display: 'flex',
              width: '48px',
              height: '48px',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              color: '#f59e0b',
              marginBottom: '12px',
              border: '1px solid rgba(245, 158, 11, 0.3)'
            }}
          >
            <AlertTriangle size={24} />
          </div>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc', margin: '0 0 6px' }}>
            Mapbox Engine Notice
          </h4>
          <p style={{ maxWidth: '380px', fontSize: '0.78rem', color: '#94a3b8', margin: '0 0 16px', lineHeight: 1.5 }}>
            {loadError}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => {
                setLoadError(null);
                setIsLoading(true);
                window.location.reload();
              }}
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCw size={14} />
              Retry Connection
            </button>
          </div>
        </div>
      )}

      {/* Render children overlays and controls */}
      {isMapReady && mapRef.current && children}
    </div>
  );
};
