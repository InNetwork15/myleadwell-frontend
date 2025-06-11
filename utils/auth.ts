import AsyncStorage from '@react-native-async-storage/async-storage';

// ✅ Store both token and user_id
export const loginUser = async (token, userId) => {
  try {
    await AsyncStorage.setItem('token', token);
    await AsyncStorage.setItem('user_id', userId.toString());
    return true;
  } catch (error) {
    console.error('❌ Error storing auth data:', error);
    return false;
  }
};

// ✅ Load token and user_id
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

// ✅ Optionally clear auth data
export const logoutUser = async () => {
  try {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user_id');
    return true;
  } catch (error) {
    console.error('❌ Error clearing auth data:', error);
    return false;
  }
};