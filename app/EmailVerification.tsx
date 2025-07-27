import axios from 'axios';
import Toast from 'react-native-toast-message';
import { API_BASE_URL } from '../utils/config';
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

export default function EmailVerification() {
  const { email } = useLocalSearchParams();

  const handleResend = async () => {
    try {
      if (!email) throw new Error('Email is missing from URL');

      const res = await axios.post(`${API_BASE_URL}/resend-verification`, { email });

      if (res.data?.success) {
        Toast.show({
          type: 'success',
          text1: '✅ Email Sent',
          text2: `Verification email re-sent to ${email}`,
        });
      } else {
        throw new Error(res.data?.message || 'Failed to resend email');
      }
    } catch (err) {
      console.error('❌ Resend error:', err);
      Toast.show({
        type: 'error',
        text1: 'Failed to Resend',
        text2: err.message || 'Unexpected error occurred',
      });
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 16 }}>
        ✅ Account Created!
      </Text>
      <Text style={{ fontSize: 16, textAlign: 'center', marginBottom: 24 }}>
        We’ve sent a verification link to <Text style={{ fontWeight: '600' }}>{email}</Text>.{'\n'}
        Please check your inbox and confirm to activate your account.
      </Text>

      <TouchableOpacity onPress={() => router.replace('/login')}>
        <Text style={{ color: 'blue', fontSize: 16 }}>← Back to Login</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={handleResend} style={{ marginTop: 20 }}>
        <Text style={{ color: 'blue', fontSize: 16 }}>Resend Verification Email</Text>
      </TouchableOpacity>
      <Toast />
    </View>
  );
}
