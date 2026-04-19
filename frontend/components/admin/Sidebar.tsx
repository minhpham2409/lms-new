import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  FileText,
  ShoppingBag,
  Tag,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/courses', label: 'Courses', icon: BookOpen },
  { href: '/admin/lessons', label: 'Lessons', icon: FileText },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/admin/coupons', label: 'Coupons', icon: Tag },
];

export function Sidebar({ isOpen }: { isOpen: boolean }) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        'fixed left-0 top-16 h-[calc(100vh-64px)] w-64 bg-white shadow-md transition-transform duration-300 z-10',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      <nav className="p-4">
        <ul className="space-y-2">
          {navLinks.map((link) => {
            const isActive =
              link.href === '/admin'
                ? pathname === '/admin'
                : pathname === link.href || pathname.startsWith(link.href + '/');
            const Icon = link.icon;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{link.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
