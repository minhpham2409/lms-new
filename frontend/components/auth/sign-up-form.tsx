"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from 'sonner';
import { authApi } from "@/lib/api-service";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const formSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  confirmPassword: z.string().min(6, { message: "Password must be at least 6 characters." }),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z.enum(["student", "teacher", "parent"]),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const validRoles = ["student", "teacher", "parent"] as const;

export function SignUpForm() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleFromUrl = searchParams.get("role");
  const initialRole =
    roleFromUrl && validRoles.includes(roleFromUrl as (typeof validRoles)[number])
      ? (roleFromUrl as (typeof validRoles)[number])
      : "student";

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { role: initialRole },
  });

  const selectedRole = watch("role");

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const { confirmPassword, ...userData } = data;
      void confirmPassword;
      await authApi.register(userData);
      toast.success("Account created! You can now sign in.");
      router.push("/auth/signin");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  const labelClass = "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70";

  return (
    <div className="w-full max-w-md space-y-6 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
      <div className="space-y-2 text-center">
        <h1 className="section-title">Đăng ký</h1>
        <p className="section-content text-sm">Tạo tài khoản để bắt đầu học tập</p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="firstName" className={labelClass}>First Name</label>
            <Input id="firstName" placeholder="John" {...register("firstName")} disabled={isLoading} />
          </div>
          <div className="space-y-2">
            <label htmlFor="lastName" className={labelClass}>Last Name</label>
            <Input id="lastName" placeholder="Doe" {...register("lastName")} disabled={isLoading} />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="username" className={labelClass}>Username</label>
          <Input id="username" placeholder="johndoe" {...register("username")} disabled={isLoading} />
          {errors.username && <p className="text-sm text-red-500">{errors.username.message}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className={labelClass}>Email</label>
          <Input id="email" type="email" placeholder="john@example.com" {...register("email")} disabled={isLoading} />
          {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <label className={labelClass}>Role</label>
          <Select
            value={selectedRole}
            onValueChange={(v) => setValue("role", v as "student" | "teacher" | "parent")}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select your role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="student">Student - I want to learn</SelectItem>
              <SelectItem value="teacher">Teacher - I want to teach</SelectItem>
              <SelectItem value="parent">Parent - I want to monitor my child</SelectItem>
            </SelectContent>
          </Select>
          {errors.role && <p className="text-sm text-red-500">{errors.role.message}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className={labelClass}>Password</label>
          <Input id="password" type="password" placeholder="••••••••" {...register("password")} disabled={isLoading} />
          {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="confirmPassword" className={labelClass}>Confirm Password</label>
          <Input id="confirmPassword" type="password" placeholder="••••••••" {...register("confirmPassword")} disabled={isLoading} />
          {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>}
        </div>

        <Button type="submit" className="w-full btn btn-primary" disabled={isLoading}>
          {isLoading ? "Đang tạo tài khoản..." : "Đăng ký"}
        </Button>
      </form>
      <div className="text-center text-sm section-content">
        <p>Đã có tài khoản?{' '}
          <a href="/auth/signin" className="text-blue-700 hover:underline font-semibold">
            Đăng nhập
          </a>
        </p>
      </div>
    </div>
  );
}
