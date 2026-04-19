'use client';

import { ManagementShell } from '@/components/panel/management-shell';
import { ADMIN_NAV_ITEMS } from '@/components/panel/management-nav-config';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ManagementShell panelTitle="Admin" requiredRole="admin" navItems={ADMIN_NAV_ITEMS}>
      {children}
    </ManagementShell>
  );
}
