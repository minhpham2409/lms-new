'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-state';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  PanelLeft,
  LayoutDashboard,
  BookOpen,
  ShoppingCart,
  Bell,
  User,
  Home,
  GraduationCap,
  Users,
  Shield,
} from 'lucide-react';

function dashboardHref(role: string | undefined) {
  if (role === 'teacher') return '/teacher';
  if (role === 'parent') return '/parent';
  if (role === 'admin') return '/admin';
  return '/dashboard';
}

export function StudentAppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoggedIn, logout } = useAuth();
  const role = user?.role;

  useEffect(() => {
    const syncSidebar = () => setOpen(window.innerWidth >= 768);
    syncSidebar();
    window.addEventListener('resize', syncSidebar);
    return () => window.removeEventListener('resize', syncSidebar);
  }, []);

  const closeSidebarOnSmallScreen = () => {
    if (window.innerWidth < 768) setOpen(false);
  };

  const dash = dashboardHref(role);
  const DashIcon =
    role === 'teacher'
      ? GraduationCap
      : role === 'parent'
        ? Users
        : role === 'admin'
          ? Shield
          : LayoutDashboard;

  const navItems: { href: string; label: string; icon: typeof Home; show: boolean }[] = [
    { href: '/', label: 'Home', icon: Home, show: true },
    {
      href: dash,
      label:
        role === 'teacher'
          ? 'Teaching'
          : role === 'parent'
            ? 'Family'
            : role === 'admin'
              ? 'Admin'
              : 'Dashboard',
      icon: DashIcon,
      show: isLoggedIn,
    },
    {
      href: '/courses',
      label: 'Courses',
      icon: BookOpen,
      show: !isLoggedIn || role === 'student',
    },
    {
      href: '/cart',
      label: 'Cart',
      icon: ShoppingCart,
      show: isLoggedIn && role === 'student',
    },
    { href: '/notifications', label: 'Notifications', icon: Bell, show: isLoggedIn },
    { href: '/profile', label: 'Profile', icon: User, show: isLoggedIn },
  ];

  return (
    <div className="min-h-screen w-full bg-slate-100/70">
      <header className="fixed inset-x-0 top-0 z-30 border-b bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-4">
        <div className="flex min-w-0 items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle sidebar"
          >
            <PanelLeft className="h-5 w-5" />
          </Button>
          <Link href="/" className="truncate text-lg font-bold text-gray-900">
            Let&apos;s Learn
          </Link>
          <span className="hidden rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary sm:inline-block">
            Learning
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {isLoggedIn ? (
            <>
              <span className="hidden max-w-[120px] truncate text-sm text-gray-600 md:inline">
                {user?.firstName ?? user?.username ?? user?.email}
              </span>
              <Button variant="outline" size="sm" onClick={() => { logout(); router.push('/'); }}>
                Sign out
              </Button>
            </>
          ) : (
            <Button asChild size="sm">
              <Link href="/auth/login">Sign in</Link>
            </Button>
          )}
        </div>
        </div>
      </header>

      <div className="flex">
        {open && (
          <button
            type="button"
            className="fixed inset-0 top-16 z-10 bg-black/20 md:hidden"
            onClick={() => setOpen(false)}
            aria-label="Close sidebar overlay"
          />
        )}
        <aside
          className={cn(
            'fixed left-0 top-16 z-20 h-[calc(100vh-64px)] w-[min(18rem,calc(100vw-2rem))] shrink-0 overflow-y-auto border-r bg-white shadow-sm transition-transform duration-300 ease-out sm:w-72',
            open ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <nav className="space-y-1 p-4">
            {navItems
              .filter((i) => i.show)
              .map((item) => {
                const Icon = item.icon;
                const active =
                  item.href === '/'
                    ? pathname === '/'
                    : pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeSidebarOnSmallScreen}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors',
                      active
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-gray-700 hover:bg-slate-100',
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
          </nav>
        </aside>

        <main
          className={cn(
            'min-w-0 min-h-[calc(100vh-64px)] flex-1 p-4 pt-20 transition-[margin-left] duration-300 ease-out md:p-6 md:pt-20',
            open ? 'md:ml-72' : 'ml-0',
          )}
        >
          <div className="mx-auto w-full max-w-[1200px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
