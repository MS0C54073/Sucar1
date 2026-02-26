import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  Dimensions,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Coordinates } from '../services/locationService';

// Mapbox token (same as web version)
const MAPBOX_TOKEN = 'pk.eyJ1IjoibXV6b3NhbGkiLCJhIjoiY21oc2J2d2tyMGg3ejJtc2N4dXg0NGo4eiJ9.p75SiHMh2nWAlbnFR8kyXQ';

interface MapViewProps {
  pickupLocation?: Coordinates;
  destinationLocation?: Coordinates;
  height?: number;
  showRoute?: boolean;
  onMapReady?: () => void;
}

/**
 * Lightweight wrapper around a WebView‑hosted Mapbox map.
 *
 * Renders pickup and optional destination markers and, when requested,
 * draws a simple straight‑line route between them. Used for booking
 * previews and booking detail location maps.
 */
const CustomMapView: React.FC<MapViewProps> = ({
  pickupLocation,
  destinationLocation,
  height = 300,
  showRoute = false,
  onMapReady,
}) => {
  const webViewRef = useRef<WebView>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapHtml, setMapHtml] = useState('');

  useEffect(() => {
    generateMapHTML();
  }, [pickupLocation, destinationLocation, height]);

  const generateMapHTML = () => {
    const locations: Coordinates[] = [];
    if (pickupLocation) locations.push(pickupLocation);
    if (destinationLocation) locations.push(destinationLocation);

    let centerLat = -15.3875; // Default: Lusaka, Zambia
    let centerLng = 28.3228;
    let zoom = 12;

    if (locations.length > 0) {
      const lats = locations.map(loc => loc.lat);
      const lngs = locations.map(loc => loc.lng);
      
      centerLat = lats.reduce((a, b) => a + b, 0) / lats.length;
      centerLng = lngs.reduce((a, b) => a + b, 0) / lngs.length;
      
      if (locations.length > 1) {
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);
        const latDiff = maxLat - minLat;
        const lngDiff = maxLng - minLng;
        const maxDiff = Math.max(latDiff, lngDiff);
        zoom = maxDiff > 0.1 ? 10 : maxDiff > 0.05 ? 11 : 12;
      }
    }

    const markers = [];
    if (pickupLocation) {
      markers.push({
        lat: pickupLocation.lat,
        lng: pickupLocation.lng,
        color: '#3b82f6',
        title: 'Pickup Location',
        description: 'Vehicle pickup point',
      });
    }
    if (destinationLocation) {
      markers.push({
        lat: destinationLocation.lat,
        lng: destinationLocation.lng,
        color: '#10b981',
        title: 'Destination',
        description: 'Car wash location',
      });
    }

    const markersJSON = JSON.stringify(markers);
    const routeCoordinates = showRoute && pickupLocation && destinationLocation
      ? JSON.stringify([
          [pickupLocation.lng, pickupLocation.lat],
          [destinationLocation.lng, destinationLocation.lat],
        ])
      : 'null';

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <script src='https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js'></script>
  <link href='https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css' rel='stylesheet' />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body, html { width: 100%; height: 100%; overflow: hidden; }
    #map { width: 100%; height: 100%; }
    .mapboxgl-popup-content { padding: 10px; }
    .mapboxgl-popup-content h3 { margin: 0 0 5px 0; font-size: 14px; font-weight: bold; }
    .mapboxgl-popup-content p { margin: 0; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    mapboxgl.accessToken = '${MAPBOX_TOKEN}';
    
    const map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [${centerLng}, ${centerLat}],
      zoom: ${zoom},
      interactive: true,
      attributionControl: false
    });

    const markers = ${markersJSON};
    const routeCoordinates = ${routeCoordinates};

    map.on('load', function() {
      // Add markers
      markers.forEach(marker => {
        const el = document.createElement('div');
        el.className = 'custom-marker';
        el.style.width = '20px';
        el.style.height = '20px';
        el.style.borderRadius = '50%';
        el.style.backgroundColor = marker.color;
        el.style.border = '3px solid white';
        el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
        
        new mapboxgl.Marker(el)
          .setLngLat([marker.lng, marker.lat])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 })
              .setHTML('<h3>' + marker.title + '</h3><p>' + marker.description + '</p>')
          )
          .addTo(map);
      });

      // Add route line if both locations exist
      if (routeCoordinates && routeCoordinates.length === 2) {
        map.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: routeCoordinates
            }
          }
        });

        map.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#3b82f6',
            'line-width': 4,
            'line-opacity': 0.7
          }
        });

        // Fit map to show both markers
        const bounds = new mapboxgl.LngLatBounds();
        markers.forEach(marker => {
          bounds.extend([marker.lng, marker.lat]);
        });
        map.fitBounds(bounds, {
          padding: 50,
          maxZoom: 15
        });
      }

      // Notify React Native that map is ready
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'mapReady' }));
      }
    });

    map.on('error', function(e) {
      console.error('Map error:', e);
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'mapError', error: e.error?.message || 'Unknown error' }));
      }
    });
  </script>
</body>
</html>
    `;

    setMapHtml(html);
  };

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'mapReady') {
        setMapReady(true);
        if (onMapReady) {
          onMapReady();
        }
      }
    } catch (error) {
      // Ignore parse errors
    }
  };

  return (
    <View style={[styles.container, { height }]}>
      {!mapReady && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Loading map...</Text>
        </View>
      )}
      <WebView
        ref={webViewRef}
        source={{ html: mapHtml }}
        style={styles.map}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 10,
    overflow: 'hidden',
    marginVertical: 10,
    backgroundColor: '#e5e7eb',
  },
  map: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e5e7eb',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
});

export default CustomMapView;
