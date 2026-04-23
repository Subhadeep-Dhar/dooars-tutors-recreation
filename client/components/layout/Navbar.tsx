// 'use client';

// import Link from 'next/link';
// import { useRouter } from 'next/navigation';
// import { useAuthStore } from '@/store/authStore';
// import { Button } from '@/components/ui/button';
// import { useTheme } from 'next-themes';
// import { Sun, Moon } from 'lucide-react';
// import { useEffect, useState } from 'react';

// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from '@/components/ui/dropdown-menu';
// import { Avatar, AvatarFallback } from '@/components/ui/avatar';
// import { GraduationCap } from 'lucide-react';

// export default function Navbar() {
//   const router = useRouter();
//   const { user, logout } = useAuthStore();
//   const { theme, setTheme } = useTheme();
//   const [mounted, setMounted] = useState(false);

//   useEffect(() => {
//     setMounted(true);
//   }, []);

//   async function handleLogout() {
//     await logout();
//     router.push('/');
//   }

//   const initials = user?.name
//     ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
//     : '';

//   return (
//     <nav className="border-b border-slate-200 bg-white sticky top-0 z-50">
//       <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
//         <Link href="/" className="flex items-center gap-2 font-bold text-slate-900 text-lg">
//           <GraduationCap size={24} className="text-slate-700" />
//           Dooars Tutors
//         </Link>

//         <div className="flex items-center gap-3">
//           <Link href="/search">
//             <Button variant="ghost" size="sm">Browse</Button>
//           </Link>

//           <button
//             onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
//             className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
//             aria-label="Toggle theme"
//           >
//             {!mounted ? null : theme === 'dark'
//               ? <Sun size={16} className="text-yellow-400" />
//               : <Moon size={16} className="text-slate-600" />
//             }
//           </button>

//           {user ? (
//             <DropdownMenu>
//               <DropdownMenuTrigger asChild>
//                 <button className="flex items-center gap-2 hover:opacity-80 transition">
//                   <Avatar className="h-8 w-8">
//                     <AvatarFallback className="text-xs bg-slate-900 text-white">
//                       {initials}
//                     </AvatarFallback>
//                   </Avatar>
//                 </button>
//               </DropdownMenuTrigger>
//               <DropdownMenuContent align="end" className="w-48">
//                 <div className="px-3 py-2">
//                   <p className="text-sm font-medium">{user.name}</p>
//                   <p className="text-xs text-slate-500 capitalize">{user.role}</p>
//                 </div>
//                 <DropdownMenuSeparator />
//                 {(user.role === 'tutor' || user.role === 'org') && (
//                   <DropdownMenuItem onClick={() => router.push('/dashboard')}>
//                     Dashboard
//                   </DropdownMenuItem>
//                 )}
//                 {user.role === 'admin' && (
//                   <DropdownMenuItem onClick={() => router.push('/admin')}>
//                     Admin Panel
//                   </DropdownMenuItem>
//                 )}
//                 <DropdownMenuSeparator />
//                 <DropdownMenuItem onClick={handleLogout} className="text-red-600">
//                   Logout
//                 </DropdownMenuItem>
//               </DropdownMenuContent>
//             </DropdownMenu>
//           ) : (
//             <>
//               <Link href="/login">
//                 <Button variant="ghost" size="sm">Login</Button>
//               </Link>
//               <Link href="/register">
//                 <Button size="sm">Register</Button>
//               </Link>
//             </>
//           )}
//         </div>
//       </div>
//     </nav>
//   );
// }


'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { GraduationCap, Sun, Moon } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  async function handleLogout() {
    await logout();
    router.push('/');
  }

  // const initials = user?.name
  //   ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  //   : '';

  const initials = user?.name
  ? user.name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  : '';

  return (
    <nav className="navbar-glass sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center shrink-0">
            <GraduationCap size={18} className="text-white" />
          </div>
          <span className="hidden sm:inline">Dooars Tutors</span>
        </Link>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <Link href="/search">
            <button className="btn-secondary text-xs sm:text-sm px-2.5 sm:px-4 py-1.5 sm:py-2">Browse</button>
          </Link>

          {/* Theme toggle */}
          {mounted && (
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center transition-all duration-200"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
              aria-label="Toggle theme"
            >
              {theme === 'dark'
                ? <Sun size={15} style={{ color: '#fbbf24' }} />
                : <Moon size={15} style={{ color: 'var(--text-secondary)' }} />
              }
            </button>
          )}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 hover:opacity-80 transition-opacity ml-1">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs text-white gradient-primary">{initials}</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <div className="px-3 py-2">
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{user.name}</p>
                  <p className="text-xs capitalize" style={{ color: 'var(--text-muted)' }}>{user.role}</p>
                </div>
                <DropdownMenuSeparator />
                {(user.role === 'tutor' || user.role === 'org') && (
                  <DropdownMenuItem onClick={() => router.push('/dashboard')} style={{ color: 'var(--text-primary)' }}>Dashboard</DropdownMenuItem>
                )}
                {user.role === 'admin' && (
                  <DropdownMenuItem onClick={() => router.push('/admin')} style={{ color: 'var(--text-primary)' }}>Admin Panel</DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-500">Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2 ml-0 sm:ml-1">
              <Link href="/login">
                <button className="btn-secondary text-xs sm:text-sm px-2.5 sm:px-4 py-1.5 sm:py-2">Login</button>
              </Link>
              <Link href="/register">
                <button className="btn-primary text-xs sm:text-sm px-2.5 sm:px-4 py-1.5 sm:py-2">Register</button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}