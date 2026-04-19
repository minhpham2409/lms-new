'use client';

import { ManagementShell } from '@/components/panel/management-shell';
import { PARENT_NAV_ITEMS } from '@/components/panel/management-nav-config';

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return (
    <ManagementShell panelTitle="Parent" requiredRole="parent" navItems={PARENT_NAV_ITEMS}>
      {children}
    </ManagementShell>
  );
}
