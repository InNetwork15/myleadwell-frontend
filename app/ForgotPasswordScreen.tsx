import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const navigation = useNavigation();

  const handleReset = async () => {
    if (!email) return Alert.alert('Please enter your email.');
    // send request to backend
    try {
      const res = await fetch('https://myleadwell-backend.onrender.com/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      Alert.alert(data.message || 'Check your email for reset link');
    } catch (err) {
      Alert.alert('Error sending reset link. Try again.');
    }
  };

  return (
    <View className="flex-1 justify-center items-center bg-white px-6">
      <View className="w-full max-w-md bg-gray-100 rounded-2xl p-6 shadow-lg">
        <Text className="text-2xl font-bold text-center mb-4 text-blue-600">Forgot Password</Text>
        <Text className="text-base text-center mb-6 text-gray-700">
          Enter your email to receive a reset link
        </Text>
        <TextInput
          className="bg-white border border-gray-300 rounded-xl px-4 py-3 mb-4 text-base"
          placeholder="Email address"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <TouchableOpacity
          onPress={handleReset}
          className="bg-blue-500 py-3 rounded-xl mt-2 shadow-sm"
        >
          <Text className="text-white text-center font-semibold text-base">Send Reset Link</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
