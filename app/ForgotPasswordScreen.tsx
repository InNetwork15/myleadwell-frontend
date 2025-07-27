import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { API_BASE_URL } from '../utils/config';
import Toast from 'react-native-toast-message'; // ✅ Add Toast import

const ForgotPasswordScreen = () => {
  const [email, setEmail] = useState('');
  const router = useRouter();

  const handleResetPassword = async () => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      Toast.show({
        type: 'error',
        text1: 'Missing Email',
        text2: 'Please enter your email address',
      });
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/forgot-password`, {
        email: normalizedEmail,
      });

      if (response.data?.success) {
        Toast.show({
          type: 'success',
          text1: '✅ Email Sent',
          text2: `Password reset link sent to ${normalizedEmail}`,
        });

        // Redirect after successful request
        setTimeout(() => router.push('/login'), 2000);
      } else {
        throw new Error(response.data?.error || 'Unknown error');
      }
    } catch (error: any) {
      console.error('❌ Forgot Password Error:', error?.response?.data || error.message);

      const errorMessage =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        'Unable to send reset link. Please try again.';

      Toast.show({
        type: 'error',
        text1: 'Reset Failed',
        text2: errorMessage,
      });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reset Your Password</Text>
      <Text style={styles.subtitle}>Enter your email to receive a password reset link.</Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={styles.input}
      />

      <TouchableOpacity onPress={handleResetPassword} style={styles.button}>
        <Text style={styles.buttonText}>Send Reset Link</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/login')} style={styles.secondaryButton}>
        <Text style={styles.secondaryButtonText}>Back to Login</Text>
      </TouchableOpacity>

      {/* ✅ Add Toast component */}
      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    marginBottom: 30,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  secondaryButton: {
    padding: 10,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default ForgotPasswordScreen;
