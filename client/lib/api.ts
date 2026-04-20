import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1',
  withCredentials: true, // ✅ required for refresh cookie
  headers: { 'Content-Type': 'application/json' },
});

// ✅ Attach access token from Zustand
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ✅ Auto-refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    // prevent infinite loop
    if (
      error.response?.status === 401 &&
      !original._retry &&
      !original.url.includes('/auth/refresh')
    ) {
      original._retry = true;

      try {
        const { data } = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newToken = data.data.accessToken;

        // ✅ update Zustand
        useAuthStore.getState().setAccessToken(newToken);

        original.headers.Authorization = `Bearer ${newToken}`;

        return api(original);
      } catch (err) {
        useAuthStore.getState().setAccessToken(null);
        useAuthStore.getState().logout();

        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;