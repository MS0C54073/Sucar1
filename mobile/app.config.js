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
    splash: {
      image: './assets/Sucar.png',
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
        foregroundImage: './assets/Sucar.png',
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
      favicon: './assets/Sucar.png',
    },
    plugins: ['expo-font'],
    extra: {
      appVariant: variant,
    },
  },
};
