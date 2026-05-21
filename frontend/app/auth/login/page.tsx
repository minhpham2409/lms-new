"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, Sparkles, ArrowRight } from "lucide-react";
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
      } catch { router.push("/dashboard"); }
    } catch {
      setError("Tên đăng nhập hoặc mật khẩu không đúng.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left — Hero panel */}
      <div
        className="hidden md:flex md:w-1/2 flex-col items-center justify-center p-12 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 45%, #0e7490 100%)" }}
      >
        {/* Orbs */}
        <div className="absolute top-[10%] left-[10%] w-72 h-72 orb orb-violet opacity-40" />
        <div className="absolute bottom-[10%] right-[5%] w-56 h-56 orb orb-teal opacity-35" />
        <div className="absolute inset-0 dot-pattern opacity-25" />

        <div className="relative z-10 text-center max-w-md">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/20">
              <Logo size="lg" />
            </div>
          </div>

          {/* Illustration */}
          <div className="rounded-3xl overflow-hidden border-4 border-white/10 shadow-2xl mb-8">
            <img
              src="/images/login_illustration_lumi.png"
              alt="Học tập trực tuyến"
              className="w-full aspect-square object-cover"
            />
          </div>

          <h2 className="text-2xl font-extrabold text-white mb-2">
            Hành trình tri thức bắt đầu tại đây
          </h2>
          <p className="text-slate-300 text-sm leading-relaxed">
            Tham gia cùng 10,000+ học sinh đang cải thiện kết quả học tập mỗi ngày với LumiLearn.
          </p>

          {/* Features */}
          <div className="mt-6 grid grid-cols-2 gap-3 text-left">
            {[
              { label: "Khóa học đa dạng", color: "#818cf8" },
              { label: "Giáo viên xuất sắc", color: "#22d3ee" },
              { label: "Học mọi lúc, mọi nơi", color: "#a78bfa" },
              { label: "Chứng chỉ uy tín", color: "#fbbf24" },
            ].map(({ label, color }) => (
              <div key={label} className="flex items-center gap-2 rounded-xl px-3 py-2.5"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}>
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                <span className="text-xs font-semibold text-white/80">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 md:px-12 bg-[#f8f7ff] dark:bg-[#0d0b1e]">
        <div className="w-full max-w-[420px]">
          {/* Mobile logo */}
          <div className="mb-8 md:hidden">
            <Link href="/">
              <Logo size="lg" />
            </Link>
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-4"
            style={{ background: "rgba(99,102,241,0.1)", color: "#6366f1", border: "1px solid rgba(99,102,241,0.2)" }}>
            <Sparkles className="w-3.5 h-3.5" />
            Chào mừng trở lại!
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold mb-2 text-foreground">
            Đăng nhập vào LumiLearn
          </h1>
          <p className="text-sm text-foreground/60 mb-6">
            Tiếp tục hành trình học tập của bạn ngay hôm nay.
          </p>

          {error && (
            <div className="mb-4 p-3.5 rounded-xl text-sm font-medium flex items-center gap-2"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#dc2626" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold mb-1.5 text-foreground">
                Email hoặc tên đăng nhập
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40 text-[#6366f1]" />
                <input
                  type="text"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="email@example.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border bg-white dark:bg-[#1a1535] text-foreground outline-none text-sm placeholder:text-foreground/30 transition-all"
                  style={{ borderColor: "rgba(199,210,254,0.7)" }}
                  onFocus={e => { e.target.style.borderColor = "#6366f1"; e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.15)"; }}
                  onBlur={e => { e.target.style.borderColor = "rgba(199,210,254,0.7)"; e.target.style.boxShadow = "none"; }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold mb-1.5 text-foreground">
                Mật khẩu
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40 text-[#6366f1]" />
                <input
                  type={showPw ? "text" : "password"}
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-12 py-3 rounded-xl border bg-white dark:bg-[#1a1535] text-foreground outline-none text-sm placeholder:text-foreground/30 transition-all"
                  style={{ borderColor: "rgba(199,210,254,0.7)" }}
                  onFocus={e => { e.target.style.borderColor = "#6366f1"; e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.15)"; }}
                  onBlur={e => { e.target.style.borderColor = "rgba(199,210,254,0.7)"; e.target.style.boxShadow = "none"; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-[#6366f1] transition-colors"
                >
                  {showPw ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link href="/auth/forgot-password" className="text-xs font-semibold text-[#6366f1] hover:text-[#4f46e5] transition-colors">
                Quên mật khẩu?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-sm text-white transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg, #6366f1, #7c3aed)", boxShadow: "0 6px 20px rgba(99,102,241,0.35)" }}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>Đăng nhập <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t text-center" style={{ borderColor: "rgba(199,210,254,0.5)" }}>
            <span className="text-sm text-foreground/60">Chưa có tài khoản? </span>
            <Link href="/auth/register" className="text-sm font-bold text-[#6366f1] hover:text-[#4f46e5] transition-colors">
              Đăng ký ngay
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
