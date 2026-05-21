"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1"}/auth/login`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: form.email, password: form.password }),
      });
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
      } catch { router.push("/dashboard"); }
    } catch { setError("Tên đăng nhập hoặc mật khẩu không đúng."); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left — hero */}
      <div className="hidden md:flex md:w-1/2 relative overflow-hidden bg-[#051025]">
        <img src="/images/lumilearn_auth_banner.jpg" alt="LumiLearn" className="absolute inset-0 w-full h-full object-cover" />
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 md:px-12" style={{ background: "var(--background)" }}>
        <div className="w-full max-w-[400px]">
          <div className="mb-8 md:hidden"><Link href="/"><Logo size="lg" /></Link></div>

          <p className="text-xs font-bold uppercase tracking-[0.15em] mb-3" style={{ color: "var(--primary)" }}>Chào mừng trở lại</p>
          <h1 className="text-2xl sm:text-3xl font-extrabold mb-2">Đăng nhập</h1>
          <p className="text-sm mb-6" style={{ color: "var(--muted-foreground)" }}>Tiếp tục hành trình học tập của bạn.</p>

          {error && (
            <div className="mb-4 p-3 rounded-lg text-sm font-medium" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", color: "var(--destructive)" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5">Email hoặc tên đăng nhập</label>
              <input type="text" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="email@example.com"
                className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all"
                style={{ background: "var(--input)", border: `1.5px solid var(--border)`, color: "var(--foreground)" }}
                onFocus={e => e.target.style.borderColor = "var(--primary)"}
                onBlur={e => e.target.style.borderColor = "var(--border)"} />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">Mật khẩu</label>
              <div className="relative">
                <input type={showPw ? "text" : "password"} required value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-16 rounded-lg text-sm outline-none transition-all"
                  style={{ background: "var(--input)", border: `1.5px solid var(--border)`, color: "var(--foreground)" }}
                  onFocus={e => e.target.style.borderColor = "var(--primary)"}
                  onBlur={e => e.target.style.borderColor = "var(--border)"} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold transition-colors" style={{ color: "var(--muted-foreground)" }}>
                  {showPw ? "Ẩn" : "Hiện"}
                </button>
              </div>
            </div>
            <div className="flex justify-end">
              <Link href="/auth/forgot-password" className="text-xs font-semibold" style={{ color: "var(--primary)" }}>Quên mật khẩu?</Link>
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3.5 rounded-lg font-bold text-sm transition-all hover:-translate-y-0.5 disabled:opacity-60"
              style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
              {loading ? "Đang xử lý..." : "Đăng nhập →"}
            </button>
          </form>

          <div className="mt-6 pt-6 text-center" style={{ borderTop: `1px solid var(--border)` }}>
            <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>Chưa có tài khoản? </span>
            <Link href="/auth/register" className="text-sm font-bold" style={{ color: "var(--primary)" }}>Đăng ký ngay</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
