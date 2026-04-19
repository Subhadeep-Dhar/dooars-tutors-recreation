import { create } from 'zustand';
import { IUser } from '@dooars/shared';
import api from '@/lib/api';

interface AuthState {
  user: Omit<IUser, 'passwordHash'> | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; name: string; role?: string }) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
  setAuth: (user: any, token: string) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isLoading: false,

  setAuth: (user, token) => {
    sessionStorage.setItem('accessToken', token);
    set({ user, accessToken: token });
  },

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const { data } = await api.post('/auth/login', { email, password });
      const { user, accessToken } = data.data;
      sessionStorage.setItem('accessToken', accessToken);
      set({ user, accessToken, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  register: async (formData) => {
    set({ isLoading: true });
    try {
      const { data } = await api.post('/auth/register', formData);
      const { user, accessToken } = data.data;
      sessionStorage.setItem('accessToken', accessToken);
      set({ user, accessToken, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      sessionStorage.removeItem('accessToken');
      set({ user: null, accessToken: null });
    }
  },

  fetchMe: async () => {
    try {
      const token = sessionStorage.getItem('accessToken');
      if (!token) return;
      const { data } = await api.get('/auth/me');
      set({ user: data.data.user });
    } catch {
      sessionStorage.removeItem('accessToken');
      set({ user: null, accessToken: null });
    }
  },
}));