import React, { createContext, useContext, ReactNode } from 'react';
import { useMapboxToken } from '../hooks/useMapboxToken';

interface MapboxContextValue {
  token: string;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<string | null>;
}

const MapboxContext = createContext<MapboxContextValue>({
  token: '',
  loading: true,
  error: null,
  refresh: async () => null,
});

export const MapboxProvider = ({ children }: { children: ReactNode }) => {
  const { token, loading, error, refresh } = useMapboxToken();
  return (
    <MapboxContext.Provider value={{ token, loading, error, refresh }}>
      {children}
    </MapboxContext.Provider>
  );
};

export const useMapbox = () => useContext(MapboxContext);

export default MapboxProvider;
