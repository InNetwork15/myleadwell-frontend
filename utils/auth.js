import AsyncStorage from '@react-native-async-storage/async-storage';

// ✅ Named export
export const loginUser = async (token) => {
  try {
    await AsyncStorage.setItem('token', token);
    return true;
  } catch (error) {
    console.error('❌ Error storing token:', error);
    return false;
  }
};

// ✅ Optional: Also add named export for loading auth data if needed later
export const loadAuthData = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    const user = await AsyncStorage.getItem('user_id');
    return { token, user };
  } catch (error) {
    console.error('❌ Error loading auth data:', error);
    return {};
  }
};
