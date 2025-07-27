// app/verify.tsx
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Toast from 'react-native-toast-message';
import axios from 'axios';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://myleadwell-backend.onrender.com';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams();

  useEffect(() => {
    if (!email) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Link',
        text2: 'Email parameter is missing.',
      });
      router.replace('/login');
      return;
    }

    const verify = async () => {
      try {
        console.log('🔄 Verifying email:', email);
        
        const response = await axios.post(`${API_BASE_URL}/verify-email`, { 
          email: Array.isArray(email) ? email[0] : email
        });

        console.log('✅ Verification response:', response.data);

        Toast.show({
          type: 'success',
          text1: 'Email Verified!',
          text2: 'Your account has been verified successfully.',
        });

        setTimeout(() => {
          router.replace('/login');
        }, 2000);

      } catch (err: any) {
        console.error('❌ Verification failed:', err);
        
        const errorMessage = err.response?.data?.error || 'Email verification failed. Please try again.';
        
        Toast.show({
          type: 'error',
          text1: 'Verification Failed',
          text2: errorMessage,
        });

        setTimeout(() => {
          router.replace('/login');
        }, 3000);
      }
    };

    verify();
  }, [email, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#007bff" style={styles.spinner} />
      <Text style={styles.title}>Verifying Your Email...</Text>
      <Text style={styles.subtitle}>Please wait while we verify your account.</Text>
      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  spinner: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
});
