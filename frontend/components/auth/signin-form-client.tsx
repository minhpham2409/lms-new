'use client';

import { useEffect } from 'react';
import { useAuth } from '@/components/auth/auth-state';
import { useRouter } from 'next/navigation';
import { SignInForm } from './sign-in-form';

export default function SignInFormClient() {
  const { isLoggedIn, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isLoggedIn) {
      router.push('/dashboard');
    }
  }, [loading, isLoggedIn, router]);

  if (loading) {
    return <div className="text-center text-sm text-gray-500">Đang tải...</div>;
  }

  if (isLoggedIn) {
    return null;
  }

  return <SignInForm />;
}
