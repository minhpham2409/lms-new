'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const formSchema = z.object({
  username: z.string().min(3, {
    message: 'Username must be at least 3 characters.',
  }),
  password: z.string().min(6, {
    message: 'Password must be at least 6 characters.',
  }),
});

export function SignInForm() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setIsLoading(true);

    try {
      const response = await signIn('credentials', {
        username: data.username,
        password: data.password,
        redirect: false,
      });

      if (response?.error) {
        toast.error('Sign in failed. Please check your credentials and try again.');
      } else {
        toast.success('You have successfully signed in.');
        router.push('/dashboard');
        router.refresh();
      }
    } catch (error) {
      console.error('Sign in error:', error);
      toast.error('Something went wrong. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className='w-full max-w-md space-y-6 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700'>
      <div className='space-y-2 text-center'>
        <h1 className='section-title'>Đăng nhập</h1>
        <p className='section-content text-sm'>
          Nhập thông tin tài khoản để truy cập
        </p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
        <div className='space-y-2'>
          <label
            htmlFor='username'
            className='text-sm font-medium'
          >
            Tên đăng nhập
          </label>
          <Input
            id='username'
            placeholder='tên_đăng_nhập'
            {...register('username')}
            disabled={isLoading}
          />
          {errors.username && (
            <p className='text-sm text-red-500'>{errors.username.message}</p>
          )}
        </div>
        <div className='space-y-2'>
          <label
            htmlFor='password'
            className='text-sm font-medium'
          >
            Mật khẩu
          </label>
          <Input
            id='password'
            type='password'
            placeholder='••••••••'
            {...register('password')}
            disabled={isLoading}
          />
          {errors.password && (
            <p className='text-sm text-red-500'>{errors.password.message}</p>
          )}
        </div>
        <Button type='submit' className='w-full btn btn-primary' disabled={isLoading}>
          {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </Button>
      </form>
      <div className='text-center text-sm section-content'>
        <p>Chưa có tài khoản?{' '}
          <a
            href='/auth/signup'
            className='text-blue-700 hover:underline font-semibold'
          >
            Đăng ký ngay
          </a>
        </p>
      </div>
    </div>
  );
}
