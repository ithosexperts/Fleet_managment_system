import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import mapboxgl from 'mapbox-gl';
import { NormalizedCoord, toLngLat } from './types';

interface MapMarkerProps {
  map: mapboxgl.Map | null;
  coord: NormalizedCoord;
  draggable?: boolean;
  onDragEnd?: (coord: NormalizedCoord) => void;
  onClick?: () => void;
  popupHtml?: string;
  className?: string;
  children?: React.ReactNode;
}

export const MapMarker: React.FC<MapMarkerProps> = ({
  map,
  coord,
  draggable = false,
  onDragEnd,
  onClick,
  popupHtml,
  className = '',
  children
}) => {
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  if (!containerRef.current && typeof document !== 'undefined') {
    containerRef.current = document.createElement('div');
  }

  // Update container class
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.className = `cursor-pointer ${className}`;
    }
  }, [className]);

  // Click handler
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !onClick) return;

    el.addEventListener('click', onClick);
    return () => {
      el.removeEventListener('click', onClick);
    };
  }, [onClick]);

  // Initialize marker on mount
  useEffect(() => {
    if (!map || !containerRef.current) return;

    const el = containerRef.current;
    const marker = new mapboxgl.Marker({
      element: el,
      draggable
    })
      .setLngLat(toLngLat(coord))
      .addTo(map);

    if (popupHtml) {
      const popup = new mapboxgl.Popup({ offset: 25, closeButton: false }).setHTML(popupHtml);
      marker.setPopup(popup);
    }

    if (draggable && onDragEnd) {
      marker.on('dragend', () => {
        const lngLat = marker.getLngLat();
        onDragEnd({ lat: lngLat.lat, lng: lngLat.lng });
      });
    }

    markerRef.current = marker;

    return () => {
      try {
        marker.remove();
      } catch (_e) {}
      markerRef.current = null;
    };
  }, [map]);

  // Update position if coord changes
  useEffect(() => {
    if (markerRef.current && coord) {
      try {
        markerRef.current.setLngLat(toLngLat(coord));
      } catch (_e) {}
    }
  }, [coord?.lat, coord?.lng]);

  if (!containerRef.current) return null;

  return createPortal(children, containerRef.current);
};
