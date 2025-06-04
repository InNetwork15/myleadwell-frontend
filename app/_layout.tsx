import { Slot } from 'expo-router';
import Toast, { BaseToast } from 'react-native-toast-message';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from 'react';

export default function RootLayout() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem('token');
      const userId = await AsyncStorage.getItem('user_id');
      console.log('🔐 Stored token:', token);
      console.log('🧑‍💻 Stored user ID:', userId);
    };
    checkAuth();
  }, []);

  const toastConfig = {
    success: (props) => (
      <BaseToast
        {...props}
        style={{ borderLeftColor: 'green', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)' }} // Replace shadow* with boxShadow
        contentContainerStyle={{ padding: 15 }}
        text1Style={{ fontSize: 15 }}
        text2Style={{ fontSize: 13 }}
      />
    ),
    error: (props) => (
      <BaseToast
        {...props}
        style={{ borderLeftColor: 'red', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)' }}
        contentContainerStyle={{ padding: 15 }}
        text1Style={{ fontSize: 15 }}
        text2Style={{ fontSize: 13 }}
      />
    ),
    info: (props) => (
      <BaseToast
        {...props}
        style={{ borderLeftColor: 'blue', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)' }}
        contentContainerStyle={{ padding: 15 }}
        text1Style={{ fontSize: 15 }}
        text2Style={{ fontSize: 13 }}
      />
    ),
  };

  return (
    <>
      <Slot />
      {isClient && <Toast config={toastConfig} />}
    </>
  );
}