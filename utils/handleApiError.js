import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

export const handleApiError = async (error) => {
  const status = error.response?.status;
  if (status === 401 || status === 403) {
    console.warn("🔐 Session expired, logging out...");
    await AsyncStorage.removeItem('token');
    router.replace('/login');
  }
};
