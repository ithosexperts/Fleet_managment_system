import React, { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { Layers, Plus, Minus, Compass, ExternalLink, RotateCcw, Crosshair, Check } from 'lucide-react';
import { MapTheme, toLngLat } from './types';
import { useMapContext, DEFAULT_STYLES } from './MapProvider';

interface MapControlsProps {
  map: mapboxgl.Map | null;
  onRecenter?: () => void;
  onLocateUser?: () => void;
  externalNavUrl?: string;
  showLayerToggle?: boolean;
  activeTheme?: MapTheme;
  onSelectTheme?: (theme: MapTheme) => void;
}

export const MapControls: React.FC<MapControlsProps> = ({
  map,
  onRecenter,
  onLocateUser,
  externalNavUrl,
  showLayerToggle = true,
  activeTheme: propActiveTheme,
  onSelectTheme
}) => {
  const { theme: contextTheme, setTheme, getStyleUrl } = useMapContext();
  const [localTheme, setLocalTheme] = useState<MapTheme>(propActiveTheme || contextTheme || 'streets');
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Sync with propActiveTheme if it changes
  useEffect(() => {
    if (propActiveTheme) {
      setLocalTheme(propActiveTheme);
    }
  }, [propActiveTheme]);

  const currentTheme = propActiveTheme || localTheme;

  // Click-outside listener to dismiss popover menu
  useEffect(() => {
    if (!showLayerMenu) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowLayerMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showLayerMenu]);

  const [bearing, setBearing] = useState(0);
  const [pitch, setPitch] = useState(0);

  // Track map rotation & pitch in real time
  useEffect(() => {
    if (!map) return;
    const updateOrientation = () => {
      setBearing(Math.round(map.getBearing()));
      setPitch(Math.round(map.getPitch()));
    };
    updateOrientation();
    map.on('rotate', updateOrientation);
    map.on('pitch', updateOrientation);
    return () => {
      map.off('rotate', updateOrientation);
      map.off('pitch', updateOrientation);
    };
  }, [map]);

  const handleZoomIn = () => {
    if (map) map.zoomIn({ duration: 300 });
  };

  const handleZoomOut = () => {
    if (map) map.zoomOut({ duration: 300 });
  };

  const handleResetNorth = () => {
    if (!map) return;
    if (Math.abs(bearing) > 0.5 || pitch > 0.5) {
      map.easeTo({ bearing: 0, pitch: 0, duration: 600 });
    } else {
      // If already facing north, cycle pitch to toggle 3D tilt perspective
      const targetPitch = map.getPitch() < 20 ? 55 : 0;
      map.easeTo({ pitch: targetPitch, bearing: 0, duration: 600 });
    }
  };

  const handleLocateMe = () => {
    if (onLocateUser) {
      onLocateUser();
      return;
    }

    if (!map || !('geolocation' in navigator)) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        map.flyTo({
          center: [pos.coords.longitude, pos.coords.latitude],
          zoom: 15,
          duration: 900
        });
      },
      (err) => {
        setIsLocating(false);
        console.warn('[MapControls] Geolocation lookup warning:', err.message);
        // Recenter to default depot if permission denied
        if (onRecenter) onRecenter();
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const layers: Array<{ id: MapTheme; label: string; icon: string }> = [
    { id: 'streets', label: 'Street View', icon: '🗺️' },
    { id: 'satellite', label: 'Satellite', icon: '🛰️' },
    { id: 'dark', label: 'Dark Mode', icon: '🌙' },
    { id: 'light', label: 'Light Minimal', icon: '☀️' }
  ];

  return (
    <div
      style={{
        position: 'absolute',
        right: '12px',
        top: '12px',
        zIndex: 25,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '8px',
        pointerEvents: 'none'
      }}
    >
      {/* Controls Container */}
      <div
        ref={menuRef}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          padding: '4px',
          backgroundColor: 'rgba(15, 23, 42, 0.94)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '10px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45)',
          pointerEvents: 'auto'
        }}
      >
        {/* Layer Switcher */}
        {showLayerToggle && (
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setShowLayerMenu(!showLayerMenu)}
              title="Toggle Map Basemap Style (Streets / Satellite / Dark)"
              aria-label="Toggle Map Style"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: showLayerMenu ? 'rgba(0, 229, 255, 0.2)' : 'transparent',
                color: showLayerMenu ? '#00e5ff' : '#cbd5e1',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Layers size={17} />
            </button>

            {showLayerMenu && (
              <div
                style={{
                  position: 'absolute',
                  right: '42px',
                  top: 0,
                  width: '150px',
                  padding: '6px',
                  backgroundColor: '#0f172a',
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                  borderRadius: '10px',
                  boxShadow: '0 12px 32px rgba(0, 0, 0, 0.75)',
                  zIndex: 40
                }}
              >
                <div
                  style={{
                    padding: '4px 8px 6px',
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: '#94a3b8',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    marginBottom: '4px'
                  }}
                >
                  Basemap Style
                </div>
                {layers.map((l) => {
                  const isSelected = currentTheme === l.id;
                  return (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => {
                        const styleUrl = DEFAULT_STYLES[l.id] || getStyleUrl(l.id);
                        if (map) {
                          try {
                            map.setStyle(styleUrl);
                          } catch (err) {
                            console.warn('[Mapbox Style Switch Error]', err);
                          }
                        }
                        setLocalTheme(l.id);
                        setTheme(l.id);
                        if (onSelectTheme) onSelectTheme(l.id);
                        setShowLayerMenu(false);
                      }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '7px 8px',
                        fontSize: '0.76rem',
                        fontWeight: isSelected ? 700 : 500,
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: isSelected ? 'rgba(0, 229, 255, 0.16)' : 'transparent',
                        color: isSelected ? '#00e5ff' : '#e2e8f0',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '6px'
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{l.icon}</span>
                        <span>{l.label}</span>
                      </span>
                      {isSelected && <Check size={14} color="#00e5ff" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div style={{ width: '100%', height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />

        {/* Zoom Controls */}
        <button
          type="button"
          onClick={handleZoomIn}
          title="Zoom In (+)"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '34px',
            height: '34px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: 'transparent',
            color: '#cbd5e1',
            cursor: 'pointer'
          }}
        >
          <Plus size={16} />
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          title="Zoom Out (-)"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '34px',
            height: '34px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: 'transparent',
            color: '#cbd5e1',
            cursor: 'pointer'
          }}
        >
          <Minus size={16} />
        </button>

        <div style={{ width: '100%', height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />

        {/* My Location / Manager Location */}
        <button
          type="button"
          onClick={handleLocateMe}
          title="Find & Center on My Location"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '34px',
            height: '34px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: isLocating ? 'rgba(0, 229, 255, 0.2)' : 'transparent',
            color: isLocating ? '#00e5ff' : '#cbd5e1',
            cursor: 'pointer'
          }}
        >
          <Crosshair size={16} className={isLocating ? 'animate-spin' : ''} />
        </button>

        {/* Compass / Reset North */}
        <button
          type="button"
          onClick={handleResetNorth}
          title={bearing !== 0 ? `Reset to True North (Current: ${bearing}°)` : 'Toggle 3D View / North Lock'}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '34px',
            height: '34px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: bearing !== 0 ? 'rgba(0, 229, 255, 0.15)' : 'transparent',
            color: bearing !== 0 ? '#00e5ff' : '#cbd5e1',
            cursor: 'pointer',
            transition: 'background-color 0.2s, color 0.2s'
          }}
        >
          <div
            style={{
              transform: `rotate(${-bearing}deg)`,
              transition: 'transform 0.15s ease-out',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Compass size={17} />
          </div>
        </button>

        {/* Recenter */}
        {onRecenter && (
          <button
            type="button"
            onClick={onRecenter}
            title="Recenter Map View"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: 'transparent',
              color: '#cbd5e1',
              cursor: 'pointer'
            }}
          >
            <RotateCcw size={15} />
          </button>
        )}
      </div>

      {/* External Navigation Link (Google Maps / Fleet App) */}
      {externalNavUrl && (
        <a
          href={externalNavUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="Open Directions in Google Maps"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '8px',
            backgroundColor: '#0284c7',
            color: '#ffffff',
            fontSize: '0.75rem',
            fontWeight: 700,
            textDecoration: 'none',
            boxShadow: '0 6px 18px rgba(2, 132, 199, 0.4)',
            pointerEvents: 'auto'
          }}
        >
          <ExternalLink size={13} />
          <span>Google Maps</span>
        </a>
      )}
    </div>
  );
};
