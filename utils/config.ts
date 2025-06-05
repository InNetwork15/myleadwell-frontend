import Constants from "expo-constants";

export const apiBaseUrl =
  Constants.expoConfig?.extra?.apiBaseUrl ??
  "https://myleadwell-backend.onrender.com";
