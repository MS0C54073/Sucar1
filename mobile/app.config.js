/**
 * Expo config — build two apps from one codebase:
 *   APP_VARIANT=client  → SuCAR (com.sucar.client)
 *   APP_VARIANT=driver  → SuCAR Driver (com.sucar.driver)
 */
const variant = process.env.APP_VARIANT === 'driver' ? 'driver' : 'client';

const variants = {
  client: {
    name: 'SuCAR',
    slug: 'sucar-client',
    package: 'com.sucar.client',
    splash: '#1D9E75',
  },
  driver: {
    name: 'SuCAR Driver',
    slug: 'sucar-driver',
    package: 'com.sucar.driver',
    splash: '#0f1419',
  },
};

const v = variants[variant];

module.exports = {
  expo: {
    name: v.name,
    slug: v.slug,
    version: '1.0.0',
    orientation: 'portrait',
    userInterfaceStyle: 'light',
    // Custom URL scheme — required for the Google OAuth redirect on native.
    scheme: variant === 'driver' ? 'sucardriver' : 'sucar',
    splash: {
      image: './assets/Sucarcar.jpeg',
      resizeMode: 'contain',
      backgroundColor: v.splash,
    },
    assetBundlePatterns: ['**/*', 'assets/**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: v.package,
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          'SuCAR needs your location to find car washes and set pickup points.',
        NSLocationAlwaysUsageDescription:
          'SuCAR needs your location for pickup and delivery services.',
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/Sucarcar.jpeg',
        backgroundColor: v.splash,
      },
      package: v.package,
      permissions: [
        'INTERNET',
        'ACCESS_NETWORK_STATE',
        'ACCESS_FINE_LOCATION',
        'ACCESS_COARSE_LOCATION',
      ],
      usesCleartextTraffic: true,
    },
    web: {
      favicon: './assets/Sucarcar.jpeg',
    },
    plugins: ['expo-font', 'expo-web-browser'],
    extra: {
      appVariant: variant,
      // Google OAuth client IDs (from Google Cloud Console). The Web client id
      // is also used as the audience the backend verifies against; Android/iOS
      // clients are used by the native auth flow. See GOOGLE_AUTH_SETUP.md.
      googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || undefined,
      googleAndroidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || undefined,
      googleIosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || undefined,
      // Optional backend override. When unset, the app auto-detects the host
      // from the Expo dev server (physical device) or falls back to the Android
      // emulator address (10.0.2.2). Set this to point at a specific backend, e.g.:
      //   API_URL=http://192.168.1.50:5000 npm run start:client
      // (a trailing "/api" is added automatically if omitted).
      apiUrl: process.env.API_URL || process.env.EXPO_PUBLIC_API_URL || undefined,
    },
  },
};
