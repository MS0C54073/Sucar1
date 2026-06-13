/**
 * RouteVisualization Component
 *
 * Displays route segments on the map as lines
 */

import { useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import { RouteSegment } from '../../services/mappingService';
import {
  isMapStyleReady,
  runWhenMapStyleReady,
  safeGetSource,
  safeRemoveLayer,
  safeRemoveSource,
} from '../../utils/mapLayerSafety';

interface RouteVisualizationProps {
  map: mapboxgl.Map;
  route: RouteSegment[];
  color?: string;
}

const RouteVisualization = ({
  map,
  route,
  color = '#3b82f6',
}: RouteVisualizationProps) => {
  const sourceId = 'route-source';
  const layerId = 'route-layer';

  useEffect(() => {
    if (!map) return;

    let cancelled = false;

    const teardown = () => {
      safeRemoveLayer(map, layerId);
      safeRemoveSource(map, sourceId);
    };

    const applyRoute = () => {
      if (cancelled || !isMapStyleReady(map)) return;

      if (route.length === 0) {
        teardown();
        return;
      }

      const coordinates: [number, number][] = [];
      route.forEach((segment, index) => {
        if (index === 0) {
          coordinates.push([segment.from.lng, segment.from.lat]);
        }
        coordinates.push([segment.to.lng, segment.to.lat]);
      });

      const geojson = {
        type: 'Feature' as const,
        geometry: {
          type: 'LineString' as const,
          coordinates,
        },
        properties: {},
      };

      const existingSource = safeGetSource(map, sourceId) as mapboxgl.GeoJSONSource | undefined;
      if (existingSource) {
        existingSource.setData(geojson);
        return;
      }

      try {
        map.addSource(sourceId, { type: 'geojson', data: geojson });
        map.addLayer({
          id: layerId,
          type: 'line',
          source: sourceId,
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': color,
            'line-width': 4,
            'line-opacity': 0.7,
          },
        });
      } catch {
        teardown();
      }
    };

    const cancelStyleWait = runWhenMapStyleReady(map, applyRoute);

    return () => {
      cancelled = true;
      cancelStyleWait();
      teardown();
    };
  }, [map, route, color]);

  return null;
};

export default RouteVisualization;
