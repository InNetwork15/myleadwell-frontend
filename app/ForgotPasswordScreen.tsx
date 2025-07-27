import React, { useState } from 'react';
import { View, TextInput, Button, Text, Alert } from 'react-native';
import axios from 'axios';

const ForgotPasswordScreen = () => {
  const [email, setEmail] = useState('');

  const handleResetRequest = async () => {
    try {
      await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/api/auth/forgot-password`, { email });
      Alert.alert('Success', 'Check your email for the reset link.');
    } catch (error) {
      Alert.alert('Error', 'Unable to send reset link.');
    }
  };

  return (
    <View>
      <Text>Enter your email to reset your password:</Text>
      <TextInput placeholder="Email" onChangeText={setEmail} value={email} autoCapitalize="none" />
      <Button title="Send Reset Link" onPress={handleResetRequest} />
    </View>
  );
};

export default ForgotPasswordScreen;
