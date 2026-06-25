/**
 * Loads Mapbox public token once (edge function → env → fallback)
 * and shares it with all map components.
 */

import { createContext, useContext, ReactNode } from 'react';
import useMapboxToken from '../hooks/useMapboxToken';

interface MapboxContextValue {
  token: string;
  loading: boolean;
  error: string | null;
}

const MapboxContext = createContext<MapboxContextValue>({
  token: '',
  loading: true,
  error: null,
});

export const MapboxProvider = ({ children }: { children: ReactNode }) => {
  const { token, loading, error } = useMapboxToken();
  return (
    <MapboxContext.Provider value={{ token, loading, error }}>{children}</MapboxContext.Provider>
  );
};

export const useMapbox = () => useContext(MapboxContext);

export default MapboxProvider;
