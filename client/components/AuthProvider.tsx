'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { fetchMe, accessToken } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Mark as hydrated after mount
    setHydrated(true);
  }, []);

  useEffect(() => {
    // Only fetch if store is hydrated and we have a token
    if (hydrated && accessToken) {
      fetchMe();
    }
  }, [hydrated, accessToken]);

  return <>{children}</>;
}