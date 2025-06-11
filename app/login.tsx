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