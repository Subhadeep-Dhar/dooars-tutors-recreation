'use client';

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
  setAccessToken: (token: string | null) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  isLoading: false,

  // ✅ Set both user + token
  setAuth: (user, token) => {
    set({ user, accessToken: token });
  },

  // ✅ Update token only (used by interceptor)
  setAccessToken: (token) => {
    set({ accessToken: token });
  },

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const { data } = await api.post('/auth/login', { email, password });
      const { user, accessToken } = data.data;

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
      set({ user: null, accessToken: null });
    }
  },

  fetchMe: async () => {
    try {
      const { data } = await api.get('/auth/me');
      set({ user: data.data.user });
    } catch {
      set({ user: null, accessToken: null });
    }
  },
}));