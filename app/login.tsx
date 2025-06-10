import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { API_BASE_URL } from '../utils/config';
import { loginUser } from '../utils/auth'; // ✅ Correct import for named export

import AsyncStorage from '@react-native-async-storage/async-storage';

console.log("🚀 Using API base:", { API_BASE_URL });

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, { email, password });
      const { token, user } = response.data || {};

      if (!token || !user) {
        console.log('❌ Missing token or user', { token, user });
        return;
      }

      // Store token and full user object
      await AsyncStorage.setItem('authToken', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));

      // Optionally, confirm storage
      console.log('authToken:', await AsyncStorage.getItem('authToken'));
      console.log('user:', await AsyncStorage.getItem('user'));

      router.replace('/HomeScreen');
    } catch (error) {
      console.error('❌ Login error:', error);
      Alert.alert('Login Failed', 'Invalid email or password');
    }
  };

  const handleGoToSignUp = () => {
    setTimeout(() => {
      router.push('/SignupScreen');
    }, 100);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={styles.input}
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />
      <TouchableOpacity onPress={handleLogin} style={styles.button}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleGoToSignUp} style={styles.secondaryButton}>
        <Text style={styles.secondaryButtonText}>Don't have an account? Sign Up</Text>
      </TouchableOpacity>
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
    marginBottom: 20,
    textAlign: 'center',
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

export default LoginScreen;
