import { Platform } from 'react-native';

let storage: any;

if (Platform.OS === 'web') {
  storage = {
    getItem: async (key: string) => localStorage.getItem(key),
    setItem: async (key: string, value: string) => localStorage.setItem(key, value),
    removeItem: async (key: string) => localStorage.removeItem(key),
  };
} else {
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  storage = AsyncStorage;
}

export default storage;
