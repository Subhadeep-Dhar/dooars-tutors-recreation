'use client';

import { create } from 'zustand';
import { IUser } from '@dooars/shared';
import { supabase } from '@/lib/supabase';
import api from '@/lib/api';

interface AuthState {
  user: Omit<IUser, 'passwordHash'> | null;
  accessToken: string | null;
  isLoading: boolean;
  isInitialized: boolean;

  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;

  setAuth: (user: any, token: string | null) => void;
  setAccessToken: (token: string | null) => void;
  initializeSupabaseListener: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  isLoading: true, // start loading while session is checked
  isInitialized: false,

  setAuth: (user, token) => {
    set({ user, accessToken: token, isLoading: false });
  },

  setAccessToken: (token) => {
    set({ accessToken: token });
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await supabase.auth.signOut();
      set({ user: null, accessToken: null, isLoading: false });
      // Tell backend to clear cookies if we still use them, though Supabase is doing auth now.
      await api.post('/auth/logout').catch(() => {});
    } catch (error) {
      set({ isLoading: false });
    }
  },

  fetchMe: async () => {
    // We already have the Supabase token, let's fetch our rich User profile from our backend
    set({ isLoading: true });
    try {
      const { data } = await api.get('/auth/me');
      set({ user: data.data.user, isLoading: false });
    } catch (err: any) {
      set({ user: null, isLoading: false });
    }
  },

  initializeSupabaseListener: () => {
    if (get().isInitialized) return;
    set({ isInitialized: true, isLoading: true });

    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        set({ accessToken: session.access_token });
        get().fetchMe();
      } else {
        set({ isLoading: false });
      }
    });

    // 2. Listen for auth changes
    supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        // If token changed or user logged in
        if (get().accessToken !== session.access_token) {
          set({ accessToken: session.access_token });
          get().fetchMe();
        }
      } else {
        set({ user: null, accessToken: null, isLoading: false });
      }
    });
  }
}));