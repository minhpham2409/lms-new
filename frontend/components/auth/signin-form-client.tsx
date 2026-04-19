'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { SignInForm } from './sign-in-form';

export default function SignInFormClient() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated' && session) {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  if (status === 'loading') {
    return <div className="text-center text-sm text-gray-500">Đang tải...</div>;
  }

  if (status === 'authenticated') {
    return null;
  }

  return <SignInForm />;
}
