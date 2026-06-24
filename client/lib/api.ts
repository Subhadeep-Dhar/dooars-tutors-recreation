import axios from 'axios';
import { supabase } from './supabase';
import { useAuthStore } from '@/store/authStore';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

// ✅ Attach Supabase access token dynamically
api.interceptors.request.use(async (config) => {
  // Always get the freshest session from Supabase to handle auto-refresh implicitly
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  } else {
    // Fallback to store if needed
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Remove the old custom 401 refresh logic, because Supabase handles token refreshing internally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // If backend rejects the token, sign out
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export default api;