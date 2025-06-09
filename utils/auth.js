// utils/auth.js

import AsyncStorage from '@react-native-async-storage/async-storage';

export const loginUser = async (token) => {
  try {
    await AsyncStorage.setItem('token', token);
    return true;
  } catch (error) {
    console.error('❌ Error storing token:', error);
    return false;
  }
};
