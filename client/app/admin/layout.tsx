// 'use client';

// import { useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import Link from 'next/link';
// import { useAuthStore } from '@/store/authStore';
// import { LayoutDashboard, Users, BookOpen, Star, LogOut } from 'lucide-react';
// import { Separator } from '@/components/ui/separator';

// const navItems = [
//   { label: 'Overview', href: '/admin', icon: LayoutDashboard },
//   { label: 'Profiles', href: '/admin/profiles', icon: BookOpen },
//   { label: 'Reviews', href: '/admin/reviews', icon: Star },
//   { label: 'Users', href: '/admin/users', icon: Users },
// ];

// export default function AdminLayout({ children }: { children: React.ReactNode }) {
//   const router = useRouter();
//   const { user, logout, fetchMe } = useAuthStore();

//   useEffect(() => {
//     fetchMe().then(() => {
//       const u = useAuthStore.getState().user;
//       if (!u) { router.push('/login'); return; }
//       if (u.role !== 'admin') { router.push('/'); return; }
//     });
//   }, []);

//   if (!user) return null;

//   async function handleLogout() {
//     await logout();
//     router.push('/');
//   }

//   return (
//     <div className="min-h-[calc(100vh-64px)] flex">
//       <aside className="w-56 border-r border-slate-200 bg-white p-4 shrink-0">
//         <div className="mb-4">
//           <p className="font-semibold text-slate-800">Admin Panel</p>
//           <p className="text-xs text-slate-500">{user.email}</p>
//         </div>
//         <Separator className="mb-4" />
//         <nav className="space-y-1">
//           {navItems.map(({ label, href, icon: Icon }) => (
//             <Link
//               key={href}
//               href={href}
//               className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100 transition-colors"
//             >
//               <Icon size={16} />
//               {label}
//             </Link>
//           ))}
//         </nav>
//         <Separator className="my-4" />
//         <button
//           onClick={handleLogout}
//           className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors w-full"
//         >
//           <LogOut size={16} />
//           Logout
//         </button>
//       </aside>
//       <main className="flex-1 bg-slate-50 p-8 overflow-auto">{children}</main>
//     </div>
//   );
// }





'use client';


import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { LayoutDashboard, BookOpen, Star, Users, LogOut, Menu, Sun, Moon, Home, Search, GraduationCap } from 'lucide-react';

const navItems = [
  { label: 'Overview', href: '/admin', icon: LayoutDashboard },
  { label: 'Profiles', href: '/admin/profiles', icon: BookOpen },
  { label: 'Reviews', href: '/admin/reviews', icon: Star },
  { label: 'Users', href: '/admin/users', icon: Users },
];


export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
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
    if (user.role !== 'admin') {
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
      className="admin-sidebar w-64 max-w-full bg-[#101828] text-white fixed md:static z-40 top-0 left-0 h-full md:h-screen md:top-0 md:self-start overflow-y-auto p-4 flex flex-col transition-transform duration-200 md:translate-x-0"
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

      <div className="mb-6">
        <p className="text-xs font-bold mb-1">Admin Panel</p>
        <p className="text-xs truncate opacity-60">{user.email}</p>
      </div>

      <nav className="flex flex-col gap-1 flex-1">
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
        <div className="my-2 h-px bg-white/10" />
        {navItems.map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`admin-nav-item flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${pathname === href ? 'bg-white/10 font-semibold' : 'hover:bg-white/5 opacity-80'}`}
            onClick={() => setSidebarOpen(false)}
          >
            <Icon size={16} />
            {label}
          </Link>
        ))}
      </nav>

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
        className="admin-nav-item mt-2 flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors w-full"
      >
        <LogOut size={16} />
        Logout
      </button>
    </aside>
  );

  return (
    <div className="relative min-h-screen flex">
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
      <main className="flex-1 min-w-0 p-6 md:p-8 ml-0 md:ml-0">
        {children}
      </main>
    </div>
  );
}