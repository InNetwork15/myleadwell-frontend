import { Slot } from 'expo-router';
import Toast from 'react-native-toast-message';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect } from 'react';

export default function RootLayout() {
  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem('token');
      const userId = await AsyncStorage.getItem('user_id');
      console.log('🔐 Stored token:', token);
      console.log('🧑‍💻 Stored user ID:', userId);
    };
    checkAuth();
  }, []);

  return (
    <>
      <Slot />
      <Toast />
    </>
  );
}