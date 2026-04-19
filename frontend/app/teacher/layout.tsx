'use client';

import { ManagementShell } from '@/components/panel/management-shell';
import { TEACHER_NAV_ITEMS } from '@/components/panel/management-nav-config';

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <ManagementShell panelTitle="Teacher" requiredRole="teacher" navItems={TEACHER_NAV_ITEMS}>
      {children}
    </ManagementShell>
  );
}
