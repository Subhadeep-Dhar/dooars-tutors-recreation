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
import { useRouter, usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { GraduationCap, Sun, Moon, Menu, LayoutDashboard, User, LogOut, Search, LogIn, UserPlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertTriangle } from 'lucide-react';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  if (pathname?.startsWith('/dashboard') || pathname?.startsWith('/admin')) {
    return null;
  }

  async function handleLogout() {
    setLogoutDialogOpen(false);
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
          <span className="">Dooars Tutors</span>
        </Link>

        <div className="flex items-center gap-2">
          {/* Desktop Nav */}
          <div className="hidden sm:flex items-center gap-2">
            <Link href="/search">
              <button className="btn-secondary text-sm px-4 py-2">Browse</button>
            </Link>

            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200"
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
                  <DropdownMenuItem onClick={() => setLogoutDialogOpen(true)} className="text-red-500 cursor-pointer">Logout</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2 ml-1">
                <Link href="/login">
                  <button className="btn-secondary text-sm px-4 py-2">Login</button>
                </Link>
                <Link href="/register">
                  <button className="btn-primary text-sm px-4 py-2">Register</button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Hamburger */}
          <div className="sm:hidden flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <button
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                >
                  <Menu size={20} />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] p-0 sheet-content" style={{ background: 'var(--bg-card)', borderLeft: '1px solid var(--border)' }}>
                <SheetHeader className="p-6 border-b" style={{ borderColor: 'var(--border)' }}>
                  <SheetTitle className="flex items-center gap-2 text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                    <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                      <GraduationCap size={18} className="text-white" />
                    </div>
                    Dooars Tutors
                  </SheetTitle>
                </SheetHeader>
                
                <div className="flex flex-col h-[calc(100vh-80px)] p-4">
                  <nav className="space-y-1 flex-1">
                    <Link
                      href="/search"
                      className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      <Search size={18} className="opacity-70" />
                      Browse Tutors
                    </Link>
                    
                    {user && (
                      <>
                        <Separator className="my-2 opacity-50" />
                        {(user.role === 'tutor' || user.role === 'org') && (
                          <Link
                            href="/dashboard"
                            className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            <LayoutDashboard size={18} className="opacity-70" />
                            Dashboard
                          </Link>
                        )}
                        {user.role === 'admin' && (
                          <Link
                            href="/admin"
                            className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            <LayoutDashboard size={18} className="opacity-70" />
                            Admin Panel
                          </Link>
                        )}
                      </>
                    )}
                  </nav>

                  <div className="mt-auto space-y-3 pb-4">
                    <button
                      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                      className="flex items-center gap-3 w-full px-3 py-3 rounded-xl text-sm font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {theme === 'dark' ? <Sun size={18} className="text-yellow-500" /> : <Moon size={18} className="text-slate-500" />}
                      {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                    </button>

                    <Separator className="my-2 opacity-50" />

                    {user ? (
                      <div className="space-y-3">
                        <div className="px-3 py-2 flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="text-sm text-white gradient-primary">{initials}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{user.name}</p>
                            <p className="text-xs capitalize" style={{ color: 'var(--text-muted)' }}>{user.role}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setLogoutDialogOpen(true)}
                          className="flex items-center gap-3 w-full px-3 py-3 rounded-xl text-sm font-medium text-red-500 transition-colors hover:bg-red-500/10"
                        >
                          <LogOut size={18} />
                          Logout
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        <SheetClose asChild>
                          <Link href="/login" className="w-full">
                            <button className="btn-secondary w-full text-xs py-2 px-0 flex items-center justify-center gap-2">
                              <LogIn size={14} /> Login
                            </button>
                          </Link>
                        </SheetClose>
                        <SheetClose asChild>
                          <Link href="/register" className="w-full">
                            <button className="btn-primary w-full text-xs py-2 px-0 flex items-center justify-center gap-2">
                              <UserPlus size={14} /> Register
                            </button>
                          </Link>
                        </SheetClose>
                      </div>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Logout Confirmation Dialog */}
      <Dialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
              <AlertTriangle className="text-red-600 dark:text-red-500" size={24} />
            </div>
            <DialogTitle className="text-center text-xl">Confirm Logout</DialogTitle>
            <DialogDescription className="text-center pt-2">
              Are you sure you want to log out of your account?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-3 pt-4 px-0">
            <Button
              variant="secondary"
              onClick={() => setLogoutDialogOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleLogout}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              Logout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </nav>
  );
}