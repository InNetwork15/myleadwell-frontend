import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import axios from 'axios';
import { useRouter } from 'expo-router';
import {API_BASE_URL} from '../utils/config';
import { saveAuthData } from '../utils/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

console.log("🚀 Using API base:", {API_BASE_URL}); // <-- TEMP LOG

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, { email, password });
      const { token, user } = response.data || {};

      if (!token || !user) {
        throw new Error('Invalid login response');
      }

      // Save all auth data in one object for easy retrieval
      await AsyncStorage.setItem('authData', JSON.stringify({ token, user }));
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      await AsyncStorage.setItem('user_id', user.id.toString());

      setTimeout(() => {
        router.replace('/HomeScreen');
      }, 100);
      
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

  const loadAuthData = async () => {
    try {
      const raw = await AsyncStorage.getItem('authData');
      if (!raw) {
        console.warn('⚠️ No auth data found');
        return;
      }

      const data = JSON.parse(raw); // ✅ Only happens if data exists
      // Proceed with using `data.token` and `data.user`
    } catch (error) {
      console.error('❌ Error loading auth data:', error);
    }
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
