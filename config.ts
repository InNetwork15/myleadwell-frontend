import Constants from 'expo-constants';

export const API_BASE_URL =
  Constants.expoConfig?.extra?.apiBaseUrl ??
  process.env.EXPO_PUBLIC_API_URL ??
  'https://myleadwell-backend.onrender.com';
