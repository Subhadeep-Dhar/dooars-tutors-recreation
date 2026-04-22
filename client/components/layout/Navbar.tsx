'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { useEffect, useState } from 'react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { GraduationCap } from 'lucide-react';

export default function Navbar() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  async function handleLogout() {
    await logout();
    router.push('/');
  }

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '';

  return (
    <nav className="border-b border-slate-200 bg-white sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-slate-900 text-lg">
          <GraduationCap size={24} className="text-slate-700" />
          Dooars Tutors
        </Link>

        <div className="flex items-center gap-3">
          <Link href="/search">
            <Button variant="ghost" size="sm">Browse</Button>
          </Link>

          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle theme"
          >
            {!mounted ? null : theme === 'dark'
              ? <Sun size={16} className="text-yellow-400" />
              : <Moon size={16} className="text-slate-600" />
            }
          </button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 hover:opacity-80 transition">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs bg-slate-900 text-white">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-slate-500 capitalize">{user.role}</p>
                </div>
                <DropdownMenuSeparator />
                {(user.role === 'tutor' || user.role === 'org') && (
                  <DropdownMenuItem onClick={() => router.push('/dashboard')}>
                    Dashboard
                  </DropdownMenuItem>
                )}
                {user.role === 'admin' && (
                  <DropdownMenuItem onClick={() => router.push('/admin')}>
                    Admin Panel
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">Login</Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Register</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}