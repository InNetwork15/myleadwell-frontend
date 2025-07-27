import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, Alert } from 'react-native';
import axios from 'axios';
import { useSearchParams } from 'expo-router';

const ResetPasswordScreen = () => {
  const { token } = useSearchParams();
  const [password, setPassword] = useState('');

  const handleReset = async () => {
    try {
      await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/reset-password`, {
        token,
        newPassword: password,
      });
      Alert.alert('Success', 'Password reset. You can now log in.');
    } catch (error) {
      Alert.alert('Error', 'Reset failed. Link may have expired.');
    }
  };

  return (
    <View>
      <TextInput placeholder="New Password" secureTextEntry onChangeText={setPassword} value={password} />
      <Button title="Reset Password" onPress={handleReset} />
    </View>
  );
};

export default ResetPasswordScreen;
