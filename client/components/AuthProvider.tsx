'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { initializeSupabaseListener } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Mark as hydrated after mount
    setHydrated(true);
    // Initialize Supabase listening which handles fetching session and user
    initializeSupabaseListener();
  }, [initializeSupabaseListener]);

  return <>{children}</>;
}