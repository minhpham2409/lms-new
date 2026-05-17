"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GraduationCap, Mail, Lock, User, Eye, EyeOff, ArrowRight, CheckCircle2 } from "lucide-react";

const roles = [
  { value: "student", label: "Học sinh", desc: "Đăng ký khóa học & bài tập" },
  { value: "parent", label: "Phụ huynh", desc: "Theo dõi con em học tập" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", email: "", password: "", confirmPassword: "", role: "student" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1"}/auth/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: form.username, email: form.email, password: form.password, role: form.role }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Đăng ký thất bại");
      router.push("/auth/login?registered=true");
    } catch (err: any) {
      setError(err.message || "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white dark:bg-[#1c1d1f]">
      {/* Left - Illustration + benefits */}
      <div className="hidden md:flex md:w-1/2 items-center justify-center p-12 bg-white dark:bg-[#1c1d1f]">
        <div className="max-w-md">
          <img
            src="/images/login_illustration.png"
            alt="Đăng ký tài khoản"
            className="w-full h-auto mb-8"
          />
          <div className="space-y-3">
            {["Hoàn toàn miễn phí để bắt đầu", "500+ khóa học chất lượng cao", "Chứng chỉ khi hoàn thành", "Phụ huynh theo dõi tiến độ"].map((t) => (
              <div key={t} className="flex items-center gap-3 text-sm text-[#6a6f73] dark:text-[#b0b5b9]">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-[#16a34a]" />
                {t}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right - Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-10 md:px-12">
        <div className="w-full max-w-[400px]">
          {/* Logo */}
          <div className="mb-6">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="w-9 h-9 bg-[#5624d0] rounded-full flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-[#2d2f31] dark:text-white">HọcLộ Trình</span>
            </Link>
          </div>

          <h1 className="text-[1.75rem] font-bold mb-2 text-[#2d2f31] dark:text-white font-serif">
            Đăng ký và bắt đầu học
          </h1>

          {error && (
            <div className="mt-4 p-3 bg-[#fcbca0] border border-[#f5c2c7] text-[#842029] text-sm font-medium rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
            {/* Role selector */}
            <div>
              <label className="block text-sm font-bold mb-1.5 text-[#2d2f31] dark:text-white">Bạn là</label>
              <div className="grid grid-cols-2 gap-2">
                {roles.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setForm({ ...form, role: r.value })}
                    className={`p-2.5 text-center transition-all border rounded text-sm ${
                      form.role === r.value
                        ? "bg-[#5624d0] border-[#5624d0] text-white"
                        : "border-[#d1d7dc] dark:border-[#6a6f73] text-[#2d2f31] dark:text-white hover:border-[#5624d0]"
                    }`}
                  >
                    <p className="font-bold text-xs">{r.label}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-bold mb-1.5 text-[#2d2f31] dark:text-white">Tên đăng nhập</label>
              <input
                type="text"
                required
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="nguyenvana"
                className="w-full px-4 py-3 border border-[#2d2f31] dark:border-[#6a6f73] text-[#2d2f31] dark:text-white bg-transparent outline-none focus:ring-1 focus:ring-[#5624d0] placeholder:text-[#b0b5b9] text-base rounded"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-bold mb-1.5 text-[#2d2f31] dark:text-white">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="email@example.com"
                className="w-full px-4 py-3 border border-[#2d2f31] dark:border-[#6a6f73] text-[#2d2f31] dark:text-white bg-transparent outline-none focus:ring-1 focus:ring-[#5624d0] placeholder:text-[#b0b5b9] text-base rounded"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-bold mb-1.5 text-[#2d2f31] dark:text-white">Mật khẩu</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Tối thiểu 6 ký tự"
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

            {/* Confirm password */}
            <div>
              <label className="block text-sm font-bold mb-1.5 text-[#2d2f31] dark:text-white">Xác nhận mật khẩu</label>
              <input
                type="password"
                required
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                placeholder="Nhập lại mật khẩu"
                className="w-full px-4 py-3 border border-[#2d2f31] dark:border-[#6a6f73] text-[#2d2f31] dark:text-white bg-transparent outline-none focus:ring-1 focus:ring-[#5624d0] placeholder:text-[#b0b5b9] text-base rounded"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#a435f0] hover:bg-[#8710d8] text-white font-bold py-3 text-base transition-colors disabled:opacity-60 flex items-center justify-center gap-2 rounded"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang tạo tài khoản...
                </span>
              ) : (
                <>Đăng ký</>
              )}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-[#d1d7dc] dark:border-[#3e4143] text-center">
            <span className="text-sm text-[#2d2f31] dark:text-[#b0b5b9]">Đã có tài khoản? </span>
            <Link href="/auth/login" className="text-sm font-bold text-[#5624d0] dark:text-[#c0a5f7] hover:text-[#401b9c] underline">
              Đăng nhập
            </Link>
          </div>

          <p className="text-xs text-center mt-4 text-[#6a6f73]">
            Bằng việc đăng ký, bạn đồng ý với{" "}
            <Link href="/terms" className="underline hover:text-[#5624d0]">Điều khoản</Link>{" "}và{" "}
            <Link href="/privacy" className="underline hover:text-[#5624d0]">Chính sách bảo mật</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
