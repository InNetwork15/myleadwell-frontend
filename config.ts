import Constants from "expo-constants";

export const apiBaseUrl =
  Constants.expoConfig?.extra?.apiBaseUrl ??
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  "https://myleadwell.onrender.com"; // fallback URL
