import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Config } from '../config/env';

export const TOKEN_KEY = '@surakshanet_token';
export const USER_KEY = '@surakshanet_user';

const api = axios.create({
  baseURL: Config.API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request Interceptor: Attach Bearer JWT
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.warn('Failed to read token from AsyncStorage', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Extract data and handle 401
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    if (error.response && error.response.status === 401 && !error.config?.url?.includes('/auth/login')) {
      try {
        await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
      } catch (e) {
        console.warn('Failed to clear token on 401', e);
      }
    }
    return Promise.reject(error.response?.data || error);
  }
);

export default api;
