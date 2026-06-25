import React, { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { Coordinates } from '../services/locationService';
import { useMapbox } from '../context/MapboxContext';
import { ClientColors } from '../constants/sucarTheme';

export interface MapWashMarker {
  id: string;
  lat: number;
  lng: number;
  title: string;
  subtitle?: string;
  rating?: number;
}

export type MapCommand = 'zoomIn' | 'zoomOut' | 'resetNorth' | 'flyToUser' | 'fitBounds';

export interface CarWashMapViewHandle {
  sendCommand: (cmd: MapCommand) => void;
}

interface CarWashMapViewProps {
  markers: MapWashMarker[];
  userLocation?: Coordinates;
  selectedId?: string | null;
  onMarkerPress?: (id: string) => void;
  /** Fixed height, or omit with flex:1 on containerStyle for full-screen maps */
  height?: number;
  containerStyle?: object;
  /** When false, map won't capture pan/zoom gestures (for ScrollView previews) */
  interactive?: boolean;
}

const DEFAULT_CENTER = { lat: -15.3875, lng: 28.3228 };

const CarWashMapView = forwardRef<CarWashMapViewHandle, CarWashMapViewProps>(({
  markers,
  userLocation,
  selectedId,
  onMarkerPress,
  height,
  containerStyle,
  interactive = true,
}, ref) => {
  const webViewRef = useRef<WebView>(null);
  const [mapReady, setMapReady] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [mapHtml, setMapHtml] = useState('');
  const { token: mapboxToken, loading: tokenLoading, error: tokenError } = useMapbox();

  const sendCommand = useCallback(
    (cmd: MapCommand) => {
      webViewRef.current?.injectJavaScript(
        `window.__sucarMap && window.__sucarMap(${JSON.stringify(cmd)}); true;`
      );
    },
    []
  );

  useImperativeHandle(ref, () => ({ sendCommand }), [sendCommand]);

  useEffect(() => {
    if (!mapboxToken) return;
    setMapReady(false);
    setLoadFailed(false);

    const markerPayload = markers.map((m) => ({
      ...m,
      selected: m.id === selectedId,
    }));

    const html = buildMapHtml(mapboxToken, markerPayload, userLocation, interactive);
    setMapHtml(html);
  }, [mapboxToken, markers, userLocation, selectedId, interactive]);

  useEffect(() => {
    if (!mapboxToken || !mapReady) return;
    sendCommand('fitBounds');
  }, [markers, userLocation, mapReady, mapboxToken, sendCommand]);

  useEffect(() => {
    if (!mapboxToken || mapReady) return;
    const t = setTimeout(() => setLoadFailed(true), 8000);
    return () => clearTimeout(t);
  }, [mapboxToken, mapReady, mapHtml]);

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'mapReady') {
        setMapReady(true);
      } else if (data.type === 'mapError') {
        setLoadFailed(true);
      } else if (data.type === 'markerPress' && data.id && onMarkerPress) {
        onMarkerPress(data.id);
      }
    } catch {
      // ignore
    }
  };

  if (tokenLoading) {
    return (
      <View style={[styles.container, height != null && { height }, containerStyle, styles.placeholder]}>
        <ActivityIndicator size="small" color={ClientColors.primary} />
        <Text style={styles.placeholderTitle}>Loading map…</Text>
      </View>
    );
  }

  if (!mapboxToken || loadFailed) {
    return (
      <View style={[styles.container, height != null && { height }, containerStyle, styles.placeholder]}>
        <Ionicons name="map-outline" size={32} color={ClientColors.textSecondary} />
        <Text style={styles.placeholderTitle}>Map unavailable</Text>
        {tokenError ? <Text style={styles.placeholderHint}>{tokenError}</Text> : null}
      </View>
    );
  }

  return (
    <View style={[styles.container, height != null && { height }, containerStyle]}>
      {!mapReady && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={ClientColors.primary} />
        </View>
      )}
      <WebView
        ref={webViewRef}
        source={{ html: mapHtml }}
        style={styles.map}
        onMessage={handleMessage}
        javaScriptEnabled
        domStorageEnabled
        originWhitelist={['*']}
        mixedContentMode="always"
        scrollEnabled={interactive}
        pointerEvents={interactive ? 'auto' : 'none'}
      />
    </View>
  );
});

CarWashMapView.displayName = 'CarWashMapView';

function buildMapHtml(
  token: string,
  markers: (MapWashMarker & { selected?: boolean })[],
  userLocation?: Coordinates,
  interactive = true
): string {
  const center = markers.length
    ? {
        lat: markers.reduce((s, m) => s + m.lat, 0) / markers.length,
        lng: markers.reduce((s, m) => s + m.lng, 0) / markers.length,
      }
    : userLocation || DEFAULT_CENTER;

  const markersJson = JSON.stringify(markers);
  const userJson = JSON.stringify(userLocation || null);
  const lusakaJson = JSON.stringify({ lat: -15.3875, lng: 28.3228 });

  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <script src="https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js"></script>
  <link href="https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css" rel="stylesheet" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; overflow: hidden; }
    .wash-pin {
      width: 38px;
      height: 38px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .wash-pin-inner {
      width: 34px;
      height: 34px;
      border-radius: 50% 50% 50% 4px;
      transform: rotate(-45deg);
      background: linear-gradient(145deg, #1E293B 0%, #0F172A 100%);
      border: 2.5px solid #fff;
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.45);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .wash-pin.selected .wash-pin-inner {
      background: linear-gradient(145deg, #7C3AED 0%, #6D28D9 100%);
      box-shadow: 0 6px 16px rgba(124, 58, 237, 0.55);
      transform: rotate(-45deg) scale(1.08);
    }
    .wash-pin-icon {
      transform: rotate(45deg);
      color: #fff;
      font-size: 15px;
      line-height: 1;
    }
    .user-dot {
      width: 16px;
      height: 16px;
      background: #3B82F6;
      border: 3px solid #fff;
      border-radius: 50%;
      box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.25);
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    mapboxgl.accessToken = ${JSON.stringify(token)};
    const markersData = ${markersJson};
    const userLoc = ${userJson};
    const LUSAKA = ${lusakaJson};

    function distKm(a, b) {
      var R = 6371;
      var dLat = (b.lat - a.lat) * Math.PI / 180;
      var dLng = (b.lng - a.lng) * Math.PI / 180;
      var lat1 = a.lat * Math.PI / 180;
      var lat2 = b.lat * Math.PI / 180;
      var x = Math.sin(dLat/2)*Math.sin(dLat/2) +
        Math.sin(dLng/2)*Math.sin(dLng/2)*Math.cos(lat1)*Math.cos(lat2);
      return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1-x));
    }

    function focusUser() {
      return userLoc && distKm(userLoc, LUSAKA) <= 120;
    }

    function nearbyMarkers(from, radiusKm) {
      return markersData.filter(function(m) {
        return distKm(from, { lat: m.lat, lng: m.lng }) <= radiusKm;
      });
    }

    const map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [${center.lng}, ${center.lat}],
      zoom: 12,
      attributionControl: false,
      interactive: ${interactive ? 'true' : 'false'}
    });

    const markerInstances = [];

    function post(msg) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify(msg));
      }
    }

    function addWashMarkers() {
      markerInstances.forEach(m => m.remove());
      markerInstances.length = 0;

      markersData.forEach(item => {
        const wrap = document.createElement('div');
        wrap.className = 'wash-pin' + (item.selected ? ' selected' : '');
        wrap.innerHTML = '<div class="wash-pin-inner"></div>';
        const inner = wrap.querySelector('.wash-pin-inner');
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '14');
        svg.setAttribute('height', '14');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('fill', 'white');
        svg.innerHTML = '<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>';
        inner.appendChild(svg);

        wrap.addEventListener('click', () => post({ type: 'markerPress', id: item.id }));

        const marker = new mapboxgl.Marker({ element: wrap, anchor: 'bottom' })
          .setLngLat([item.lng, item.lat])
          .addTo(map);
        markerInstances.push(marker);
      });
    }

    let userMarker = null;
    function addUserMarker() {
      if (userMarker) { userMarker.remove(); userMarker = null; }
      if (!userLoc || !focusUser()) return;
      const el = document.createElement('div');
      el.className = 'user-dot';
      userMarker = new mapboxgl.Marker({ element: el })
        .setLngLat([userLoc.lng, userLoc.lat])
        .addTo(map);
    }

    function fitAll() {
      var focus = focusUser() ? userLoc : null;

      if (focus) {
        var local = nearbyMarkers(focus, 25);
        if (local.length === 0 && markersData.length > 0) {
          local = nearbyMarkers(LUSAKA, 40);
        }
        if (local.length > 0) {
          var bounds = new mapboxgl.LngLatBounds();
          bounds.extend([focus.lng, focus.lat]);
          local.forEach(function(m) { bounds.extend([m.lng, m.lat]); });
          map.fitBounds(bounds, { padding: 70, maxZoom: 15, minZoom: 11, duration: 700 });
        } else {
          map.flyTo({ center: [focus.lng, focus.lat], zoom: 14, duration: 700 });
        }
        return;
      }

      if (markersData.length > 0) {
        var washBounds = new mapboxgl.LngLatBounds();
        markersData.forEach(function(m) { washBounds.extend([m.lng, m.lat]); });
        map.fitBounds(washBounds, { padding: 70, maxZoom: 14, minZoom: 11, duration: 700 });
        return;
      }

      map.flyTo({ center: [LUSAKA.lng, LUSAKA.lat], zoom: 12, duration: 500 });
    }

    window.__sucarMap = function(cmd) {
      if (cmd === 'zoomIn') map.zoomIn({ duration: 250 });
      else if (cmd === 'zoomOut') map.zoomOut({ duration: 250 });
      else if (cmd === 'resetNorth') map.easeTo({ bearing: 0, pitch: 0, duration: 400 });
      else if (cmd === 'flyToUser') {
        if (focusUser()) {
          map.flyTo({ center: [userLoc.lng, userLoc.lat], zoom: 14, duration: 800 });
        } else {
          map.flyTo({ center: [LUSAKA.lng, LUSAKA.lat], zoom: 12, duration: 800 });
        }
      }
      else if (cmd === 'fitBounds') fitAll();
    };

    map.on('load', function() {
      addWashMarkers();
      addUserMarker();
      fitAll();
      post({ type: 'mapReady' });
    });

    map.on('error', function(e) {
      post({ type: 'mapError', error: e.error && e.error.message });
    });
  </script>
</body>
</html>`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8EEF4',
    overflow: 'hidden',
  },
  map: {
    flex: 1,
    backgroundColor: '#E8EEF4',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(248, 250, 252, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  placeholderTitle: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '600',
    color: ClientColors.textSecondary,
  },
  placeholderHint: {
    marginTop: 4,
    fontSize: 11,
    color: ClientColors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
});

export default CarWashMapView;
