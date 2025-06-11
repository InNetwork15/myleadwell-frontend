import AsyncStorage from '@react-native-async-storage/async-storage';

// ✅ Store both token and user_id
export const loginUser = async (token, user) => {
  try {
    await AsyncStorage.setItem('token', token);
    await AsyncStorage.setItem('user', JSON.stringify(user)); // ✅ correct
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
    const userString = await AsyncStorage.getItem('user');
    const user = userString ? JSON.parse(userString) : null; // ✅ Parse it
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