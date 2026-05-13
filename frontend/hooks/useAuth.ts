'use client';

/**
 * Central useAuth hook — delegates to AuthStateProvider (localStorage JWT).
 * Do NOT import useSession/signOut from next-auth here.
 *
 * Role values: 'student' | 'teacher' | 'parent' | 'admin'
 */
export { useAuth } from '@/components/auth/auth-state';
