// utils/auth.js

import AsyncStorage from '@react-native-async-storage/async-storage';

export const loginUser = async (token, user) => {
  try {
    await AsyncStorage.setItem('token', token);
    await AsyncStorage.setItem('user', JSON.stringify(user));
    return true;
  } catch (error) {
    console.error('❌ Error storing token:', error);
    return false;
  }
};

export const loadAuthData = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    const user = await AsyncStorage.getItem('user');
    return {
      token,
      user: user ? JSON.parse(user) : null,
    };
  } catch (error) {
    console.error('❌ Error loading auth data:', error);
    return { token: null, user: null };
  }
};
