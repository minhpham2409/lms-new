import {
  LayoutDashboard,
  User,
  Bell,
  FileText,
  ShoppingBag,
  Tag,
  Shield,
} from 'lucide-react';
import type { PanelNavItem } from './management-shell';

export const TEACHER_NAV_ITEMS: PanelNavItem[] = [
  {
    href: '/teacher',
    label: 'Overview',
    icon: LayoutDashboard,
    isActive: (p) => p === '/teacher' || p.startsWith('/teacher/'),
  },
  { href: '/profile', label: 'Account', icon: User },
  { href: '/notifications', label: 'Notifications', icon: Bell },
];

export const PARENT_NAV_ITEMS: PanelNavItem[] = [
  {
    href: '/parent',
    label: 'Overview',
    icon: LayoutDashboard,
    isActive: (p) => p === '/parent' || p.startsWith('/parent/'),
  },
  { href: '/profile', label: 'Account', icon: User },
  { href: '/notifications', label: 'Notifications', icon: Bell },
];

export const ADMIN_NAV_ITEMS: PanelNavItem[] = [
  {
    href: '/admin',
    label: 'Overview',
    icon: Shield,
    isActive: (p) => p === '/admin',
  },
  { href: '/admin/users', label: 'Users', icon: User },
  { href: '/admin/lessons', label: 'Lessons', icon: FileText },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/admin/coupons', label: 'Coupons', icon: Tag },
  { href: '/notifications', label: 'Notifications', icon: Bell },
];
