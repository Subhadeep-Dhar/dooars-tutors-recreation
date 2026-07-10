'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { GraduationCap, Sun, Moon, Menu, LayoutDashboard, User, LogOut, Search, LogIn, UserPlus, Globe, Grid, Sparkles, Info, Home } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform, MotionValue } from 'framer-motion';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose, SheetDescription } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertTriangle } from 'lucide-react';

function DockLink({ 
  href, 
  title, 
  onClick
}: { 
  href: string; 
  title: string; 
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void; 
}) {
  return (
    <motion.div 
      whileHover={{ scale: 1.2, y: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className="origin-bottom"
    >
      <Link 
        href={href} 
        onClick={onClick} 
        className="text-sm font-medium transition-all duration-300 block px-3 py-1 opacity-100 md:group-hover:opacity-40 hover:!opacity-100" 
        style={{ color: 'var(--text-primary)' }}
      >
        {title}
      </Link>
    </motion.div>
  );
}

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [languageDialogOpen, setLanguageDialogOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState('en');

  useEffect(() => {
    setMounted(true);
    // Read Google Translate cookie to set active language
    const match = document.cookie.match(/(?:^|;)\s*googtrans=([^;]*)/);
    if (match && match[1]) {
      const lang = match[1].split('/').pop();
      if (lang) setCurrentLang(lang);
    }
  }, []);

  const handleLanguageSelect = (langCode: string) => {
    setLanguageDialogOpen(false);
    setCurrentLang(langCode);
    if (langCode === 'en') {
      // If English, completely destroy the cookie to save resources and avoid the translation engine entirely
      document.cookie = `googtrans=; path=/; max-age=0`;
      document.cookie = `googtrans=; path=/; max-age=0; domain=${window.location.hostname}`;
    } else {
      // Google translate requires cookies for both path and domain sometimes to stick properly
      document.cookie = `googtrans=/en/${langCode}; path=/; max-age=31536000`;
      document.cookie = `googtrans=/en/${langCode}; path=/; max-age=31536000; domain=${window.location.hostname}`;
    }
    
    // Reload to apply translation immediately
    window.location.reload();
  };

  if (pathname?.startsWith('/dashboard') || pathname?.startsWith('/admin')) {
    return null;
  }

  async function handleLogout() {
    setLogoutDialogOpen(false);
    await logout();
    router.push('/');
  }

  const handleHashClick = (e: React.MouseEvent<HTMLAnchorElement>, hash: string) => {
    if (pathname === '/') {
      e.preventDefault();
      const el = document.getElementById(hash);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const initials = user?.name
  ? user.name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  : '';

  return (
    <div className="sticky top-4 z-50 px-4 mb-4">
      <nav className="max-w-[1200px] mx-auto h-16 flex items-center justify-between px-4 sm:px-6 gap-2 sm:gap-4" style={{ background: 'var(--bg-glass)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid var(--border)', borderRadius: '99px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 font-bold text-xl md:text-2xl shrink-0" style={{ color: 'var(--text-primary)' }}>
          <Image src="/images/logo.jpg" alt="Logo" width={44} height={44} className="w-10 h-10 md:w-11 md:h-11 rounded-full object-cover shrink-0" priority />
          <span className="whitespace-nowrap">Dooars Tutors</span>
        </Link>

        {/* Center Navigation Links (Desktop) */}
        <div 
          className="hidden md:flex flex-1 items-center justify-center gap-2 px-4 whitespace-nowrap h-full group"
        >
          <DockLink href="/" title="Home" />
          <DockLink href="/search" title="Browse" />
          <DockLink href="/#categories" title="Categories" onClick={(e) => handleHashClick(e, 'categories')} />
          <DockLink href="/#highlights" title="Highlights" onClick={(e) => handleHashClick(e, 'highlights')} />
          <DockLink href="/#about" title="About Us" onClick={(e) => handleHashClick(e, 'about')} />
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-2">

            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
                aria-label="Toggle theme"
              >
                {theme === 'dark'
                  ? <Sun size={15} style={{ color: '#fbbf24' }} />
                  : <Moon size={15} style={{ color: 'var(--text-secondary)' }} />
                }
              </button>
            )}

            <button
              onClick={() => setLanguageDialogOpen(true)}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 hover:opacity-80"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
              aria-label="Change language"
            >
              <Globe size={15} style={{ color: 'var(--text-primary)' }} />
            </button>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 hover:opacity-80 transition-opacity ml-1">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs text-white" style={{ backgroundColor: 'var(--color-brand)' }}>{initials}</AvatarFallback>
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
                  <button className="btn-ghost text-sm px-4 py-2">Login</button>
                </Link>
                <Link href="/register">
                  <button className="btn-primary text-sm px-4 py-2">Register</button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Hamburger */}
          <div className="md:hidden flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <button
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                >
                  <Menu size={20} />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] p-0 sheet-content" style={{ background: 'var(--bg-card)', borderLeft: '1px solid var(--border)' }}>
                <SheetHeader className="p-6 border-b" style={{ borderColor: 'var(--border)' }}>
                  <SheetTitle className="flex items-center gap-2 text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    <Image src="/images/logo.jpg" alt="Logo" width={40} height={40} className="w-10 h-10 rounded-full object-cover shrink-0" priority />
                    Dooars Tutors
                  </SheetTitle>
                  <SheetDescription className="sr-only">
                    Mobile navigation menu
                  </SheetDescription>
                </SheetHeader>
                
                <div className="flex flex-col h-[calc(100vh-80px)] p-4">
                  <nav className="space-y-1 flex-1">
                    <Link
                      href="/"
                      className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      <Home size={18} className="opacity-70" />
                      Home
                    </Link>
                    <Link
                      href="/search"
                      className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      <Search size={18} className="opacity-70" />
                      Browse Tutors
                    </Link>
                    <Link
                      href="/#categories"
                      onClick={(e) => handleHashClick(e, 'categories')}
                      className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      <Grid size={18} className="opacity-70" />
                      Categories
                    </Link>
                    <Link
                      href="/#highlights"
                      onClick={(e) => handleHashClick(e, 'highlights')}
                      className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      <Sparkles size={18} className="opacity-70" />
                      Highlights
                    </Link>
                    <Link
                      href="/#about"
                      onClick={(e) => handleHashClick(e, 'about')}
                      className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      <Info size={18} className="opacity-70" />
                      About Us
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
                      onClick={() => setLanguageDialogOpen(true)}
                      className="flex items-center gap-3 w-full px-3 py-3 rounded-xl text-sm font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      <Globe size={18} className="opacity-70" />
                      Language (English)
                    </button>

                    <button
                      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                      className="flex items-center gap-3 w-full px-3 py-3 rounded-xl text-sm font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {theme === 'dark' ? <Sun size={18} className="text-yellow-500" /> : <Moon size={18} style={{ color: 'var(--text-muted)' }} />}
                      {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                    </button>

                    <Separator className="my-2 opacity-50" />

                    {user ? (
                      <div className="space-y-3">
                        <div className="px-3 py-2 flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="text-sm text-white" style={{ backgroundColor: 'var(--color-brand)' }}>{initials}</AvatarFallback>
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
                            <button className="btn-ghost w-full text-xs py-2 px-0 flex items-center justify-center gap-2">
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
      </nav>

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
      {/* Language Selection Dialog */}
      <Dialog open={languageDialogOpen} onOpenChange={setLanguageDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: 'var(--color-brand-light)' }}>
              <Globe className="text-primary" style={{ color: 'var(--color-brand)' }} size={24} />
            </div>
            <DialogTitle className="text-center text-xl">Select Language</DialogTitle>
            <DialogDescription className="text-center pt-2">
              Choose your preferred language for navigating the platform.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-3 py-4">
            {[
              { id: 'en', name: 'English', native: 'English' },
              { id: 'bn', name: 'Bengali', native: 'বাংলা' },
              { id: 'hi', name: 'Hindi', native: 'हिंदी' },
              { id: 'ne', name: 'Nepali', native: 'नेपाली' }
            ].map((lang) => (
              <button
                key={lang.id}
                onClick={() => handleLanguageSelect(lang.id)}
                className={`p-4 rounded-xl border text-center transition-all duration-200 ${currentLang === lang.id ? 'border-primary bg-primary/5' : 'hover:bg-black/5 dark:hover:bg-white/5 border-transparent hover:border-border'}`}
                style={{ 
                  borderColor: currentLang === lang.id ? 'var(--color-brand)' : 'var(--border)',
                  backgroundColor: currentLang === lang.id ? 'var(--color-brand-light)' : 'var(--bg-card)'
                }}
              >
                <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{lang.native}</div>
                <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{lang.name}</div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}