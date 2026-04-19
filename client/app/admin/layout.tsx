'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { LayoutDashboard, Users, BookOpen, Star, LogOut } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const navItems = [
  { label: 'Overview', href: '/admin', icon: LayoutDashboard },
  { label: 'Profiles', href: '/admin/profiles', icon: BookOpen },
  { label: 'Reviews', href: '/admin/reviews', icon: Star },
  { label: 'Users', href: '/admin/users', icon: Users },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, logout, fetchMe } = useAuthStore();

  useEffect(() => {
    fetchMe().then(() => {
      const u = useAuthStore.getState().user;
      if (!u) { router.push('/login'); return; }
      if (u.role !== 'admin') { router.push('/'); return; }
    });
  }, []);

  if (!user) return null;

  async function handleLogout() {
    await logout();
    router.push('/');
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex">
      <aside className="w-56 border-r border-slate-200 bg-white p-4 shrink-0">
        <div className="mb-4">
          <p className="font-semibold text-slate-800">Admin Panel</p>
          <p className="text-xs text-slate-500">{user.email}</p>
        </div>
        <Separator className="mb-4" />
        <nav className="space-y-1">
          {navItems.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </nav>
        <Separator className="my-4" />
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors w-full"
        >
          <LogOut size={16} />
          Logout
        </button>
      </aside>
      <main className="flex-1 bg-slate-50 p-8 overflow-auto">{children}</main>
    </div>
  );
}