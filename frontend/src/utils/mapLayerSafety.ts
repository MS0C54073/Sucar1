import type { Map as MapboxMap } from 'mapbox-gl';

/** Map instance is alive and style is ready for layer/source APIs */
export function isMapStyleReady(map: MapboxMap | null | undefined): boolean {
  if (!map) return false;
  try {
    return Boolean(map.getStyle()) && map.isStyleLoaded();
  } catch {
    return false;
  }
}

export function safeGetLayer(map: MapboxMap, layerId: string): ReturnType<MapboxMap['getLayer']> | undefined {
  if (!isMapStyleReady(map)) return undefined;
  try {
    return map.getLayer(layerId) ?? undefined;
  } catch {
    return undefined;
  }
}

export function safeGetSource(map: MapboxMap, sourceId: string): ReturnType<MapboxMap['getSource']> | undefined {
  if (!isMapStyleReady(map)) return undefined;
  try {
    return map.getSource(sourceId) ?? undefined;
  } catch {
    return undefined;
  }
}

export function safeRemoveLayer(map: MapboxMap, layerId: string): void {
  if (!safeGetLayer(map, layerId)) return;
  try {
    map.removeLayer(layerId);
  } catch {
    /* map removed mid-flight */
  }
}

export function safeRemoveSource(map: MapboxMap, sourceId: string): void {
  if (!safeGetSource(map, sourceId)) return;
  try {
    map.removeSource(sourceId);
  } catch {
    /* map removed mid-flight */
  }
}

/** Run fn when style is ready; returns cancel for pending load listener */
export function runWhenMapStyleReady(map: MapboxMap, fn: () => void): () => void {
  if (isMapStyleReady(map)) {
    fn();
    return () => {};
  }

  const onLoad = () => {
    if (isMapStyleReady(map)) fn();
  };

  map.once('load', onLoad);
  return () => {
    map.off('load', onLoad);
  };
}
