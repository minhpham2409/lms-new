'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
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
  const [open, setOpen] = useState(true);
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const role = session?.user?.role;

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
      show: status === 'authenticated',
    },
    {
      href: '/courses',
      label: 'Courses',
      icon: BookOpen,
      show: status !== 'authenticated' || role === 'student',
    },
    {
      href: '/cart',
      label: 'Cart',
      icon: ShoppingCart,
      show: status === 'authenticated' && role === 'student',
    },
    { href: '/notifications', label: 'Notifications', icon: Bell, show: status === 'authenticated' },
    { href: '/profile', label: 'Profile', icon: User, show: status === 'authenticated' },
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
          {status === 'authenticated' ? (
            <>
              <span className="hidden max-w-[120px] truncate text-sm text-gray-600 md:inline">
                {session?.user?.name ?? session?.user?.email}
              </span>
              <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: '/' })}>
                Sign out
              </Button>
            </>
          ) : (
            <Button asChild size="sm">
              <Link href="/auth/signin">Sign in</Link>
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
            'fixed left-0 top-16 z-20 h-[calc(100vh-64px)] w-72 shrink-0 border-r bg-white shadow-sm transition-transform duration-300 ease-out',
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
            'min-h-[calc(100vh-64px)] flex-1 p-4 pt-20 transition-[margin-left] duration-300 ease-out md:p-6 md:pt-20',
            open ? 'md:ml-72' : 'ml-0',
          )}
        >
          <div className="mx-auto w-full max-w-[1200px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
