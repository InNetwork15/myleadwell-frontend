// app/verify.tsx
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { View, Text } from 'react-native';
import axios from 'axios';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams();

  useEffect(() => {
    if (!email) {
      router.replace('/login');
      return;
    }

    const verify = async () => {
      try {
        await axios.post('https://your-backend-url.com/verify-email', { email });
      } catch (err) {
        console.error('Verification failed:', err);
      } finally {
        router.replace('/login');
      }
    };

    verify();
  }, [email]);

  return (
    <View style={{ marginTop: 50, alignItems: 'center' }}>
      <Text>Verifying your email...</Text>
    </View>
  );
}
