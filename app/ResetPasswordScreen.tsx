import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import axios from 'axios';

const ResetPasswordScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (params?.token) {
      setToken(params.token.toString());
      console.log('✅ Token from URL:', params.token);
    } else {
      console.warn('❌ No token found in URL params');
    }
  }, [params]);

  const handleReset = async () => {
    if (!password || password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters.');
      return;
    }

    if (!token) {
      Alert.alert('Error', 'Invalid or missing reset token.');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/reset-password`, {
        token,
        newPassword: password,
      });

      Alert.alert('Success', 'Your password has been reset.');
      router.replace('/login');
    } catch (error: any) {
      console.error('Reset failed:', error?.response?.data || error.message);
      Alert.alert('Error', 'Reset failed. Link may be expired or invalid.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reset Your Password</Text>
      <TextInput
        placeholder="Enter new password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={styles.input}
      />
      <Button
        title={loading ? 'Resetting...' : 'Reset Password'}
        onPress={handleReset}
        disabled={loading}
      />
    </View>
  );
};

export default ResetPasswordScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 12,
    marginBottom: 16,
  },
});
