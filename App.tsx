import 'react-native-toast-message'; // ✅ Must be FIRST
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import Toast from 'react-native-toast-message'; // ✅ Import Toast
import { StripeProvider } from '@stripe/stripe-react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Set up a global Axios interceptor for auth
axios.interceptors.request.use(async (config) => {
  const stored = await AsyncStorage.getItem('token');
  if (stored && stored !== 'null') {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${stored}`,
    };
  }
  return config;
});

export default function App() {
  return (
    <StripeProvider publishableKey="pk_test_...">
      <NavigationContainer>
        {/* ...existing navigation setup... */}
      </NavigationContainer>
      <Toast /> {/* 🛠️ Already added */}
    </StripeProvider>
  );
}

export { axios };
