export const loadAuthData = async () => {
  const token = await AsyncStorage.getItem('authToken');
  const userString = await AsyncStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;
  return { token, user };
};