import type { Map as MapboxMap } from 'mapbox-gl';
import type { Feature, LineString } from 'geojson';
import {
  isMapStyleReady,
  runWhenMapStyleReady,
  safeGetSource,
  safeRemoveLayer,
  safeRemoveSource,
} from './mapLayerSafety';

const SOURCE_ID = 'sucar-route-source';
const LAYER_ID = 'sucar-route-layer';

function applyRouteLine(map: MapboxMap, feature: Feature<LineString> | null): void {
  if (!isMapStyleReady(map)) return;

  if (!feature) {
    safeRemoveLayer(map, LAYER_ID);
    safeRemoveSource(map, SOURCE_ID);
    return;
  }

  const existing = safeGetSource(map, SOURCE_ID) as { setData: (d: Feature<LineString>) => void } | undefined;
  if (existing) {
    existing.setData(feature);
    return;
  }

  try {
    map.addSource(SOURCE_ID, { type: 'geojson', data: feature });
    map.addLayer({
      id: LAYER_ID,
      type: 'line',
      source: SOURCE_ID,
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-color': '#0056d2',
        'line-width': 5,
        'line-opacity': 0.85,
      },
    });
  } catch {
    safeRemoveLayer(map, LAYER_ID);
    safeRemoveSource(map, SOURCE_ID);
  }
}

export function setMapRouteLine(map: MapboxMap, feature: Feature<LineString> | null): void {
  if (!isMapStyleReady(map)) {
    runWhenMapStyleReady(map, () => applyRouteLine(map, feature));
    return;
  }
  applyRouteLine(map, feature);
}

export function clearMapRouteLine(map: MapboxMap): void {
  applyRouteLine(map, null);
}
