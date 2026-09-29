import React, { useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { MapMarker } from './MapMarker';
import { VehicleMarkerData } from './types';
import { Navigation } from 'lucide-react';

interface VehicleMarkerProps {
  map: mapboxgl.Map | null;
  vehicle: VehicleMarkerData;
  isSelected?: boolean;
  onClick?: () => void;
}

export const VehicleMarker: React.FC<VehicleMarkerProps> = ({
  map,
  vehicle,
  isSelected = false,
  onClick
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const isMoving = vehicle.status === 'ON_TRIP';

  // Status colors & gradients
  const statusStyles: Record<string, { bg: string; border: string; glow: string; text: string; badge: string }> = {
    AVAILABLE: {
      bg: 'linear-gradient(135deg, #10B981, #059669)',
      border: '#34D399',
      glow: 'rgba(16, 185, 129, 0.45)',
      text: '#ECFDF5',
      badge: '#059669'
    },
    ON_TRIP: {
      bg: 'linear-gradient(135deg, #00e5ff, #0284C7)',
      border: '#38BDF8',
      glow: 'rgba(0, 229, 255, 0.55)',
      text: '#F0F9FF',
      badge: '#0284C7'
    },
    MAINTENANCE: {
      bg: 'linear-gradient(135deg, #F59E0B, #D97706)',
      border: '#FBBF24',
      glow: 'rgba(245, 158, 11, 0.45)',
      text: '#FFFBEB',
      badge: '#D97706'
    },
    INACTIVE: {
      bg: 'linear-gradient(135deg, #64748B, #475569)',
      border: '#94A3B8',
      glow: 'rgba(100, 116, 139, 0.3)',
      text: '#F8FAFC',
      badge: '#64748B'
    }
  };

  const styleConfig = statusStyles[vehicle.status] || statusStyles.INACTIVE;

  const popupContent = `
    <div style="font-family: inherit; min-width: 190px; padding: 6px 2px; color: #0f172a;">
      <div style="font-weight: 800; font-size: 13px; color: #0f172a; margin-bottom: 2px; letter-spacing: 0.5px;">
        ${vehicle.vehicle_number}
      </div>
      <div style="font-size: 11px; color: #64748b; margin-bottom: 6px;">
        ${vehicle.model || 'Commercial Fleet Vehicle'}
      </div>
      <div style="display: flex; align-items: center; justify-content: space-between; font-size: 11px; padding: 4px 8px; background: #f1f5f9; border-radius: 6px; margin-bottom: 4px;">
        <span style="font-weight: 600; color: #475569;">Status:</span>
        <span style="font-weight: 700; text-transform: uppercase; color: ${styleConfig.badge};">
          ${vehicle.status}
        </span>
      </div>
      ${
        vehicle.driverName
          ? `<div style="font-size: 11px; color: #334155; margin-top: 3px;">Driver: <strong>${vehicle.driverName}</strong></div>`
          : ''
      }
      ${
        typeof vehicle.speedKmh === 'number'
          ? `<div style="font-size: 11px; color: #0284c7; font-weight: 600; margin-top: 2px;">Speed: <strong>${Math.round(vehicle.speedKmh)} km/h</strong></div>`
          : ''
      }
    </div>
  `;

  return (
    <MapMarker
      map={map}
      coord={vehicle.coord}
      onClick={onClick}
      popupHtml={popupContent}
    >
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          cursor: 'pointer',
          transform: 'translate(-50%, -50%)',
          transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          position: 'relative'
        }}
      >
        {/* Pulsing ring for active transit */}
        {isMoving && (
          <div
            style={{
              position: 'absolute',
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: 'rgba(0, 229, 255, 0.25)',
              border: '2px solid rgba(0, 229, 255, 0.6)',
              animation: 'pulse 1.8s infinite cubic-bezier(0.4, 0, 0.6, 1)',
              pointerEvents: 'none',
              top: '-5px',
              left: '-5px'
            }}
          />
        )}

        {/* Pin Body */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: styleConfig.bg,
            border: `2px solid ${styleConfig.border}`,
            boxShadow: `0 4px 12px ${styleConfig.glow}`,
            color: styleConfig.text,
            transform: isHovered || isSelected ? 'scale(1.15)' : 'scale(1)',
            outline: isSelected ? '3px solid #00e5ff' : 'none',
            outlineOffset: '2px',
            transition: 'all 0.2s ease',
            zIndex: isSelected ? 10 : 2
          }}
        >
          <Navigation
            size={16}
            style={{
              transform: `rotate(${vehicle.heading || 0}deg)`,
              transition: 'transform 0.3s ease'
            }}
          />
        </div>

        {/* Floating Plate Label */}
        <div
          style={{
            marginTop: '4px',
            padding: '2px 6px',
            borderRadius: '4px',
            background: 'rgba(15, 23, 42, 0.94)',
            border: '1px solid rgba(51, 65, 85, 0.85)',
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '0.5px',
            color: '#F8FAFC',
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.4)',
            pointerEvents: 'none',
            textTransform: 'uppercase'
          }}
        >
          {vehicle.vehicle_number}
        </div>
      </div>
    </MapMarker>
  );
};
