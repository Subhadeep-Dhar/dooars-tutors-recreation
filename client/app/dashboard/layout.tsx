'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from 'next-themes';
import { LayoutDashboard, User, BookOpen, Image, LogOut, Menu, Sun, Moon, Home, Search, GraduationCap } from 'lucide-react';
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
  const { theme, setTheme } = useTheme();
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
      className="w-64 max-w-full bg-[#101828] text-white fixed md:static z-40 top-0 left-0 h-full md:h-screen md:top-0 md:self-start overflow-y-auto p-4 flex flex-col transition-transform duration-200 md:translate-x-0"
      style={{
        transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        boxShadow: sidebarOpen ? '0 0 0 9999px rgba(0,0,0,0.4)' : 'none',
      }}
    >
      <div className="mb-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-white">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center shrink-0">
            <GraduationCap size={18} className="text-white" />
          </div>
          <span>Dooars Tutors</span>
        </Link>
        <button
          className="md:hidden p-2 rounded hover:bg-white/10"
          onClick={() => setSidebarOpen(false)}
        >
          <Menu size={20} />
        </button>
      </div>

      <div className="mb-4">
        <p className="font-semibold truncate text-sm" style={{ color: 'var(--text-primary)' }}>{user.name}</p>
        <p className="text-xs capitalize opacity-60" style={{ color: 'var(--text-secondary)' }}>{user.role}</p>
      </div>
      <Separator className="mb-4" style={{ backgroundColor: 'var(--border)' }} />
      <nav className="space-y-1 flex-1">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-white/10 opacity-80"
          onClick={() => setSidebarOpen(false)}
        >
          <Home size={16} />
          Home
        </Link>
        <Link
          href="/search"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-white/10 opacity-80"
          onClick={() => setSidebarOpen(false)}
        >
          <Search size={16} />
          Browse Tutors
        </Link>
        <Separator className="my-2 opacity-10" />
        {navItems.map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-white/10 opacity-80"
            style={{ color: 'var(--text-secondary)' }}
            onClick={() => setSidebarOpen(false)}
          >
            <Icon size={16} />
            {label}
          </Link>
        ))}
      </nav>
      <Separator className="my-4 opacity-10" />
      
      {/* Theme Toggle in Sidebar */}
      <button
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-white/10 transition-colors w-full mb-1 opacity-80"
      >
        {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
      </button>

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
    <div className="relative min-h-screen flex" style={{ background: 'var(--bg-base)' }}>
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