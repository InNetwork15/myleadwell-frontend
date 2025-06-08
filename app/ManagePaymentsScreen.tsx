import React, { useState } from 'react';
import {
  View,
  Text,
  Button,
  Alert,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://myleadwell-backend.onrender.com';


export default function ManagePaymentsScreen() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSetupStripe = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const userId = await AsyncStorage.getItem('user_id');

      const res = await fetch(`${API_BASE_URL}/stripe/create-account-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ user_id: userId }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        Alert.alert('Stripe Error', data.error || 'Could not generate onboarding link.');
      }
    } catch (err) {
      console.error('❌ Stripe onboarding error:', err);
      Alert.alert('Error', 'Failed to start Stripe onboarding.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={{ padding: 20 }}>
      <TouchableOpacity
        style={{
          alignSelf: 'flex-start',
          backgroundColor: '#f8f9fa',
          paddingVertical: 8,
          paddingHorizontal: 16,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: '#ced4da',
          marginBottom: 12,
        }}
        onPress={() => router.push('/HomeScreen')}
      >
        <Text
          style={{
            color: '#007bff',
            fontWeight: '600',
            fontSize: 16,
          }}
        >
          Home
        </Text>
      </TouchableOpacity>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 15 }}>
        💳 Manage Payment Accounts
      </Text>
      <Text style={{ marginBottom: 25 }}>
        Setup or update your payment account here
      </Text>
      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <Button title="Setup Payments" onPress={handleSetupStripe} />
      )}
    </ScrollView>
  );
}
