import 'react-native-toast-message'; // ✅ Must be FIRST
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import Toast from 'react-native-toast-message'; // ✅ Import Toast
import { StripeProvider } from '@stripe/stripe-react-native';

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
