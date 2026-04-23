'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { LayoutDashboard, User, BookOpen, Image, LogOut } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const navItems = [
  { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { label: 'My Profile', href: '/dashboard/profile', icon: User },
  { label: 'Teaching Slots', href: '/dashboard/slots', icon: BookOpen },
  { label: 'Media', href: '/dashboard/media', icon: Image },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, logout, isLoading } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || isLoading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    if (user.role === 'student') {
      router.push('/');
    }
  }, [hydrated, user, isLoading, router]);

  async function handleLogout() {
    await logout();
    router.push('/');
  }

  // Show loading while hydrating or checking auth
  if (!hydrated || isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-[calc(100vh-64px)] flex" style={{ background: 'var(--bg-base)' }}>
      {/* Sidebar */}
      <aside className="w-56 p-4 shrink-0" style={{ background: 'var(--bg-card)', borderRight: '1px solid var(--border)' }}>
        <div className="mb-4">
          <p className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{user.name}</p>
          <p className="text-xs capitalize" style={{ color: 'var(--text-secondary)' }}>{user.role}</p>
        </div>
        <Separator className="mb-4" style={{ backgroundColor: 'var(--border)' }} />
        <nav className="space-y-1">
          {navItems.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/5"
              style={{ color: 'var(--text-secondary)' }}
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </nav>
        <Separator className="my-4" style={{ backgroundColor: 'var(--border)' }} />
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-red-500/10 transition-colors w-full"
          style={{ color: '#ef4444' }}
        >
          <LogOut size={16} />
          Logout
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 overflow-auto">
        {children}
      </main>
    </div>
  );
}