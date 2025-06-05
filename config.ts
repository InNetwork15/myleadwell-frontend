import Constants from "expo-constants";

// This prioritizes Expo Config, then environment variable, then default fallback
export const apiBaseUrl =
  Constants.expoConfig?.extra?.apiBaseUrl ||
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  "https://myleadwell.onrender.com";
