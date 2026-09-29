import React, { createContext, useContext, useState, useMemo } from 'react';
import { MapTheme } from './types';

interface MapContextValue {
  mapboxToken: string;
  hasValidToken: boolean;
  theme: MapTheme;
  setTheme: (theme: MapTheme) => void;
  getStyleUrl: (theme: MapTheme) => string;
}

const MapContext = createContext<MapContextValue | null>(null);

export const DEFAULT_STYLES: Record<MapTheme, string> = {
  dark: 'mapbox://styles/mapbox/dark-v11',
  light: 'mapbox://styles/mapbox/light-v11',
  streets: 'mapbox://styles/mapbox/streets-v12',
  satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
  navigation: 'mapbox://styles/mapbox/navigation-night-v1'
};

interface MapProviderProps {
  children: React.ReactNode;
  initialTheme?: MapTheme;
}

export const MapProvider: React.FC<MapProviderProps> = ({
  children,
  initialTheme = 'streets'
}) => {
  const [theme, setTheme] = useState<MapTheme>(initialTheme);

  const rawToken = (import.meta.env.VITE_MAPBOX_TOKEN || '').trim();
  const hasValidToken = Boolean(rawToken && !rawToken.includes('your-public') && rawToken.startsWith('pk.'));

  const getStyleUrl = (selectedTheme: MapTheme): string => {
    return DEFAULT_STYLES[selectedTheme] || DEFAULT_STYLES.streets;
  };

  const value = useMemo(
    () => ({
      mapboxToken: rawToken,
      hasValidToken,
      theme,
      setTheme,
      getStyleUrl
    }),
    [rawToken, hasValidToken, theme]
  );

  return <MapContext.Provider value={value}>{children}</MapContext.Provider>;
};

export function useMapContext(): MapContextValue {
  const ctx = useContext(MapContext);
  if (!ctx) {
    // Provide a safe fallback even if component is rendered outside MapProvider
    const rawToken = (import.meta.env.VITE_MAPBOX_TOKEN || '').trim();
    const hasValidToken = Boolean(rawToken && !rawToken.includes('your-public') && rawToken.startsWith('pk.'));
    return {
      mapboxToken: rawToken,
      hasValidToken,
      theme: 'streets',
      setTheme: () => {},
      getStyleUrl: (t: MapTheme) => DEFAULT_STYLES[t] || DEFAULT_STYLES.streets
    };
  }
  return ctx;
}
