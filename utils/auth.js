// auth.js

import AsyncStorage from '@react-native-async-storage/async-storage';

export const storeAuthData = async (token) => {
  try {
    await AsyncStorage.setItem('token', token);
  } catch (error) {
    console.error('❌ Error storing token:', error);
    throw new Error('Failed to store login data');
  }
};

export const loadAuthData = async () => {
  try {
    return await AsyncStorage.getItem('token');
  } catch (error) {
    console.error('❌ Error loading auth data:', error);
    return null;
  }
};

export const clearAuthData = async () => {
  try {
    await AsyncStorage.removeItem('token');
  } catch (error) {
    console.error('❌ Error clearing auth data:', error);
  }
};
