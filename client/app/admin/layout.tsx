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
import Link from 'next/link';
import { LayoutDashboard, BookOpen, Star, Users, LogOut } from 'lucide-react';

const navItems = [
  { label: 'Overview', href: '/admin', icon: LayoutDashboard },
  { label: 'Profiles', href: '/admin/profiles', icon: BookOpen },
  { label: 'Reviews', href: '/admin/reviews', icon: Star },
  { label: 'Users', href: '/admin/users', icon: Users },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading, accessToken } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
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

  return (
    <div className="page-wrapper flex" style={{ minHeight: 'calc(100vh - 4rem)' }}>
      {/* Sidebar */}
      <aside className="admin-sidebar w-52 shrink-0 sticky top-16 self-start h-[calc(100vh-4rem)] overflow-y-auto p-4 flex flex-col">
        <div className="mb-6">
          <p className="text-xs font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
            Admin Panel
          </p>
          <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
            {user.email}
          </p>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`admin-nav-item ${pathname === href ? 'active' : ''}`}
            >
              <Icon size={15} />
              {label}
            </Link>
          ))}
        </nav>

        <button
          onClick={handleLogout}
          className="admin-nav-item mt-2"
          style={{ color: '#ef4444' }}
        >
          <LogOut size={15} />
          Logout
        </button>
      </aside>

      {/* Content */}
      <main className="flex-1 min-w-0 p-6 md:p-8">
        {children}
      </main>
    </div>
  );
}