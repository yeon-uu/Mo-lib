import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

// Platform-aware storage helpers
const getToken = async (key: string): Promise<string | null> => {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  }
  return await SecureStore.getItemAsync(key);
};

const deleteToken = async (key: string): Promise<void> => {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
};

export const apiClient = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터: 토큰 자동 주입
apiClient.interceptors.request.use(async (config) => {
  const token = await getToken('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 응답 인터셉터: 401 처리 + 에러 파싱
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await deleteToken('access_token');
      // navigate는 authStore에서 처리 (아래 참고)
      const { useAuthStore } = await import('../store/authStore');
      useAuthStore.getState().clearAuth();
    }

    // 422 유효성 에러 메시지 파싱
    if (error.response?.status === 422) {
      const detail = error.response.data?.detail;
      if (Array.isArray(detail)) {
        const messages = detail.map((d: { msg: string }) => d.msg).join(', ');
        return Promise.reject(new Error(messages));
      }
    }

    return Promise.reject(error);
  }
);
