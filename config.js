import Constants from 'expo-constants';

// Option 1: Use Expo's app.config.js extra.apiBaseUrl if set
// Option 2: Use EXPO_PUBLIC_API_BASE_URL from .env
// Fallback: Use default hardcoded base URL (safe fallback)
export const API_BASE_URL =
  Constants.expoConfig?.extra?.apiBaseUrl ||
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  'https://myleadwell.onrender.com';
