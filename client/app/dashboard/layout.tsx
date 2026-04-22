'use client';

import { useEffect } from 'react';
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
  const { user, logout, fetchMe } = useAuthStore();

  useEffect(() => {
    fetchMe().then(() => {
      const u = useAuthStore.getState().user;
      if (!u) { router.push('/login'); return; }
      if (u.role === 'student') { router.push('/'); return; }
    });
  }, []);

  if (!user) return null;

  async function handleLogout() {
    await logout();
    router.push('/');
  }

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