import axios from 'axios';
import Toast from 'react-native-toast-message';
import { API_BASE_URL } from '../utils/config'; // ✅ const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://myleadwell-backend.onrender.com'; base URL
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

const handleResend = async () => {
  try {
    const res = await axios.post(`${BASE_URL}/resend-verification`, { email });
    if (res.data?.success) {
      Toast.show({
        type: 'success',
        text1: '✅ Email Sent',
        text2: `We re-sent the email to ${email}`,
      });
    } else {
      throw new Error(res.data?.message || 'Unknown error');
    }
  } catch (err) {
    console.error('❌ Resend error:', err);
    Toast.show({
      type: 'error',
      text1: 'Failed to Resend',
      text2: err.message || 'Could not resend email',
    });
  }
};

export default function EmailVerification() {
  const { email } = useLocalSearchParams();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 16 }}>
        ✅ Account Created!
      </Text>
      <Text style={{ fontSize: 16, textAlign: 'center', marginBottom: 24 }}>
        We’ve sent a verification link to <Text style={{ fontWeight: '600' }}>{email}</Text>.
        Please check your inbox and confirm to activate your account.
      </Text>

      <TouchableOpacity onPress={() => router.replace('/login')}>
        <Text style={{ color: 'blue', fontSize: 16 }}>← Back to Login</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={handleResend} style={{ marginTop: 20 }}>
        <Text style={{ color: 'blue', fontSize: 16 }}>Resend Verification Email</Text>
      </TouchableOpacity>
      <Toast /> {/* ✅ Add Toast component */}
    </View>
  );
}
