// app/cancel.tsx
import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';

export default function Cancel() {
  const router = useRouter();

  useEffect(() => {
    Toast.show({
      type: 'error',
      text1: 'Payment Cancelled',
      text2: 'You can try again anytime.',
    });

    setTimeout(() => {
      router.replace('/HomeScreen'); // Adjust route if needed
    }, 3000);
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>❌ Payment Cancelled</Text>
    </View>
  );
}
