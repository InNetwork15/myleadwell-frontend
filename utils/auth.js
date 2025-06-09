import AsyncStorage from '@react-native-async-storage/async-storage';
import jwtDecode from 'jwt-decode';
import { handleApiError } from './handleApiError'; // Added import

export const loginUser = async (token) => {
  try {
    if (!token) {
      console.error("❌ No token received from server.");
      return false;
    }

    await AsyncStorage.setItem('token', token); // Store token in AsyncStorage
    const decoded = jwtDecode(token);
    await AsyncStorage.setItem('user', JSON.stringify(decoded)); // ✅ STORE USER
    console.log("✅ Token stored successfully:", token);
    console.log("✅ Decoded token:", decoded);

    return true; // Indicate successful login
  } catch (error) {
    console.error("❌ Error storing token:", error);
    return false;
  }
};

export const getUserFromToken = async () => {
  const token = await AsyncStorage.getItem('token');
  if (!token) throw new Error('Missing token'); // Simplified error handling
  return jwtDecode(token); // Directly return decoded token
};

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log("❌ No token provided."); // Added logging for missing token
    return res.sendStatus(401);
  }

  try {
    const user = jwtDecode(token); // Replaced jwt.decode with jwtDecode
    req.user = user; // ✅ This is key
    next();
  } catch (err) {
    console.error("❌ JWT decoding failed:", err.message);
    return res.sendStatus(403);
  }
};

export const getUserId = async () => {
    const userString = await AsyncStorage.getItem('user');
    if (!userString) return null;
    const user = JSON.parse(userString);
    return user?.id || null;
};

export const loadAuthData = async () => {
  const token = await AsyncStorage.getItem('token');
  const userJson = await AsyncStorage.getItem('user');
  const user = userJson ? JSON.parse(userJson) : null;

  // ✅ Temporary debug logging
  console.log('📦 Loaded token:', token);
  console.log('📦 Loaded user:', user);

  return { token, user };
};
