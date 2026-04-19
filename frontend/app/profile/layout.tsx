'use client';

import { RoleAwareAppShell } from '@/components/panel/role-aware-app-shell';

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <RoleAwareAppShell>{children}</RoleAwareAppShell>;
}
