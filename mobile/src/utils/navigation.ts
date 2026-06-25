import { Alert, Linking } from 'react-native';
import { Coordinates } from '../services/locationService';

/**
 * Hand the actual turn-by-turn drive off to the device's Google Maps / Waze app
 * (free, traffic-aware, and already trusted by drivers) instead of building
 * in-app navigation. Tries the native app deep link, falls back to the web URL.
 */
export function openDriverNavigation(target?: Coordinates, label = 'Destination'): void {
  const lat = target?.lat;
  const lng = target?.lng;
  if (typeof lat !== 'number' || typeof lng !== 'number' || Number.isNaN(lat) || Number.isNaN(lng)) {
    Alert.alert('No location', 'This job has no map location yet.');
    return;
  }

  const open = (appUrl: string, webUrl: string) =>
    Linking.openURL(appUrl).catch(() =>
      Linking.openURL(webUrl).catch(() => Alert.alert('Could not open a maps app')),
    );

  const googleApp = `google.navigation:q=${lat},${lng}`; // Android intent
  const googleWeb = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
  const wazeApp = `waze://?ll=${lat},${lng}&navigate=yes`;
  const wazeWeb = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;

  Alert.alert(`Navigate to ${label}`, 'Choose your navigation app', [
    { text: 'Google Maps', onPress: () => open(googleApp, googleWeb) },
    { text: 'Waze', onPress: () => open(wazeApp, wazeWeb) },
    { text: 'Cancel', style: 'cancel' },
  ]);
}
