import React from 'react';
import { View, Text, Button } from 'react-native';
import { useRouter } from 'expo-router';

export default function CheckoutSuccessScreen() {
  const router = useRouter();

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 10 }}>🎉 Purchase Complete!</Text>
      <Text style={{ fontSize: 16, marginBottom: 30 }}>
        Your payment was successful. You can now view your new lead in “My Purchased Leads.”
      </Text>
      <Button title="Go to My Leads" onPress={() => router.push('/my-leads')} />
    </View>
  );
}
