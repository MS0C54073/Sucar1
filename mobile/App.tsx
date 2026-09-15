import 'react-native-gesture-handler';
import 'react-native-reanimated';
import React from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { MapboxProvider } from './src/context/MapboxContext';
import RootNavigator from './src/navigation/RootNavigator';
import LocationAccessGate from './src/components/LocationAccessGate';

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <MapboxProvider>
          <AuthProvider>
            <ThemeProvider>
              <NavigationContainer>
                <LocationAccessGate>
                  <RootNavigator />
                </LocationAccessGate>
              </NavigationContainer>
            </ThemeProvider>
          </AuthProvider>
        </MapboxProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
