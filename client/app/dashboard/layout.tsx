'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { LayoutDashboard, User, BookOpen, Image, LogOut, Menu } from 'lucide-react';
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  // Sidebar content
  const sidebar = (
    <aside
      className="w-64 max-w-full bg-[#101828] text-white fixed md:static z-40 top-0 left-0 h-full md:h-[calc(100vh-4rem)] md:top-16 md:self-start overflow-y-auto p-4 flex flex-col transition-transform duration-200 md:translate-x-0"
      style={{
        transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        boxShadow: sidebarOpen ? '0 0 0 9999px rgba(0,0,0,0.4)' : 'none',
      }}
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{user.name}</p>
          <p className="text-xs capitalize opacity-80" style={{ color: 'var(--text-secondary)' }}>{user.role}</p>
        </div>
        <button
          className="md:hidden p-2 ml-2 rounded hover:bg-white/10"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
        >
          <Menu size={20} />
        </button>
      </div>
      <Separator className="mb-4" style={{ backgroundColor: 'var(--border)' }} />
      <nav className="space-y-1 flex-1">
        {navItems.map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/5 opacity-80"
            style={{ color: 'var(--text-secondary)' }}
            onClick={() => setSidebarOpen(false)}
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
  );

  return (
    <div className="relative min-h-[calc(100vh-64px)] flex" style={{ background: 'var(--bg-base)' }}>
      {/* Hamburger for mobile */}
      <button
        className="fixed top-4 left-4 z-50 md:hidden bg-[#101828] text-white p-2 rounded shadow-lg"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open sidebar"
        style={{ display: sidebarOpen ? 'none' : 'block' }}
      >
        <Menu size={24} />
      </button>

      {/* Sidebar for desktop and mobile */}
      <div
        className={`fixed inset-0 z-30 bg-black/40 transition-opacity md:hidden ${sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />
      <div
        className={`md:relative md:translate-x-0 ${sidebarOpen ? '' : 'hidden md:block'}`}
        style={{ zIndex: 40 }}
      >
        {sidebar}
      </div>

      {/* Main content */}
      <main className="flex-1 p-8 overflow-auto">
        {children}
      </main>
    </div>
  );
}