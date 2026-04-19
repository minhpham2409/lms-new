'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PanelLeft, Home, type LucideIcon } from 'lucide-react';

export type PanelNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Return true when this nav entry should show active styles */
  isActive?: (pathname: string) => boolean;
};

function defaultIsActive(pathname: string, href: string) {
  if (pathname === href) return true;
  if (href === '/') return false;
  return pathname.startsWith(`${href}/`);
}

export function ManagementShell({
  children,
  panelTitle,
  requiredRole,
  navItems,
}: {
  children: React.ReactNode;
  panelTitle: string;
  requiredRole: 'teacher' | 'parent' | 'admin';
  navItems: PanelNavItem[];
}) {
  const [open, setOpen] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin');
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.role) return;
    const role = session.user.role;
    if (role === requiredRole) return;
    if (role === 'admin') router.replace('/admin');
    else if (role === 'student') router.replace('/dashboard');
    else if (role === 'teacher') router.replace('/teacher');
    else if (role === 'parent') router.replace('/parent');
    else router.replace('/dashboard');
  }, [status, session, requiredRole, router]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  if (!session?.user || session.user.role !== requiredRole) {
    return null;
  }

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
            {panelTitle}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
            <Link href="/">
              <Home className="mr-1.5 h-4 w-4" />
              Home
            </Link>
          </Button>
          <span className="hidden max-w-[140px] truncate text-sm text-gray-600 md:inline">
            {session.user.name ?? session.user.email}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => signOut({ callbackUrl: '/auth/signin' })}
          >
            Sign out
          </Button>
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
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = item.isActive
                ? item.isActive(pathname)
                : defaultIsActive(pathname, item.href);
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
