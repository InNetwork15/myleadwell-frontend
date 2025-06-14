// app/success.tsx
import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';

export default function Success() {
    const router = useRouter();

    useEffect(() => {
        Toast.show({
            type: 'success',
            text1: 'Payment Successful!',
            text2: 'Thank you for your purchase.',
        });

        setTimeout(() => {
            router.replace('/HomeScreen'); // Or your actual Home screen route
        }, 3000);
    }, []);

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text>✅ Payment Successful</Text>
        </View>
    );
}
