'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { authApi } from '@/lib/api-service';
import { useAuth } from '@/hooks/useAuth';

const formSchema = z.object({
  email: z.string().min(3, {
    message: 'Email or username is required.',
  }),
  password: z.string().min(6, {
    message: 'Password must be at least 6 characters.',
  }),
});

export function SignInForm() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

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
      const response = await authApi.login({
        email: data.email,
        password: data.password,
      });

      if (response?.access_token) {
        login(response.access_token, response.refresh_token);
        toast.success('Đăng nhập thành công!');
        router.push('/dashboard');
      } else {
        toast.error('Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
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
            htmlFor='email'
            className='text-sm font-medium'
          >
            Email / Tên đăng nhập
          </label>
          <Input
            id='email'
            placeholder='email@example.com'
            {...register('email')}
            disabled={isLoading}
          />
          {errors.email && (
            <p className='text-sm text-red-500'>{errors.email.message}</p>
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
            href='/auth/register'
            className='text-blue-700 hover:underline font-semibold'
          >
            Đăng ký ngay
          </a>
        </p>
      </div>
    </div>
  );
}
