"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/components/auth/auth-state";
import { Logo } from "@/components/ui/logo";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1"}/auth/login`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: form.email, password: form.password }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Đăng nhập thất bại");
      login(data.access_token, data.refresh_token);
      
      try {
        const payload = JSON.parse(atob(data.access_token.split(".")[1]));
        const role = payload.role;
        if (role === "admin") router.push("/admin");
        else if (role === "teacher") router.push("/teacher");
        else if (role === "parent") router.push("/parent");
        else router.push("/dashboard");
      } catch {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError("Tên đăng nhập hoặc mật khẩu không đúng.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white dark:bg-[#1c1d1f]">
      {/* Left - Illustration (Udemy style) */}
      <div className="hidden md:flex md:w-1/2 items-center justify-center p-12 bg-white dark:bg-[#1c1d1f]">
        <div className="max-w-md">
          <img
            src="/images/login_illustration.png"
            alt="Đăng nhập để bắt đầu hành trình học tập"
            className="w-full h-auto"
          />
        </div>
      </div>

      {/* Right - Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 md:px-12">
        <div className="w-full max-w-[400px]">
          {/* Logo */}
          <div className="mb-8">
            <Link href="/" className="inline-block">
              <Logo size="lg" />
            </Link>
          </div>

          <h1 className="text-[1.75rem] font-bold mb-2 text-[#2d2f31] dark:text-white">
            Đăng nhập và bắt đầu hành trình học tập của bạn
          </h1>

          {error && (
            <div className="mt-4 p-3 bg-[#fcbca0] border border-[#f5c2c7] text-[#842029] text-sm font-medium rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-bold mb-1.5 text-[#2d2f31] dark:text-white">
                Email hoặc tên đăng nhập
              </label>
              <input
                type="text"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="email@example.com"
                className="w-full px-4 py-3 border border-[#2d2f31] dark:border-[#6a6f73] text-[#2d2f31] dark:text-white bg-transparent outline-none focus:ring-1 focus:ring-[#5624d0] placeholder:text-[#b0b5b9] text-base rounded"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-bold mb-1.5 text-[#2d2f31] dark:text-white">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-12 border border-[#2d2f31] dark:border-[#6a6f73] text-[#2d2f31] dark:text-white bg-transparent outline-none focus:ring-1 focus:ring-[#5624d0] placeholder:text-[#b0b5b9] text-base rounded"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6a6f73] hover:text-[#2d2f31] dark:hover:text-white"
                >
                  {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#a435f0] hover:bg-[#8710d8] text-white font-bold py-3 text-base transition-colors disabled:opacity-60 rounded"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang xử lý...
                </span>
              ) : (
                "Đăng nhập"
              )}
            </button>
          </form>

          <div className="mt-4 text-center">
            <span className="text-sm text-[#6a6f73]">hoặc </span>
            <Link href="/auth/forgot-password" className="text-sm font-bold text-[#5624d0] dark:text-[#c0a5f7] hover:text-[#401b9c] underline">
              Quên mật khẩu?
            </Link>
          </div>

          <div className="mt-6 pt-6 border-t border-[#d1d7dc] dark:border-[#3e4143] text-center">
            <span className="text-sm text-[#2d2f31] dark:text-[#b0b5b9]">Chưa có tài khoản? </span>
            <Link href="/auth/register" className="text-sm font-bold text-[#5624d0] dark:text-[#c0a5f7] hover:text-[#401b9c] underline">
              Đăng ký
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
