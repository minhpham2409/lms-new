"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GraduationCap, Mail, Lock, Eye, EyeOff, ArrowRight, Zap } from "lucide-react";
import { useAuth } from "@/components/auth/auth-state";

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
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: form.email, password: form.password }),
        }
      );
      const raw = await res.json();
      if (!res.ok) throw new Error(raw.message || "Đăng nhập thất bại");
      // Backend wraps response in { success, data }
      const result = raw.data || raw;
      login(result.access_token, result.refresh_token);
      
      // Redirect based on user role from JWT
      try {
        const payload = JSON.parse(atob(result.access_token.split(".")[1]));
        const role = payload.role;
        if (role === "admin") {
          router.push("/admin");
        } else if (role === "teacher") {
          router.push("/teacher");
        } else if (role === "parent") {
          router.push("/parent");
        } else {
          router.push("/dashboard");
        }
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
    <div className="min-h-screen flex" style={{ background: "var(--background)" }}>
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center overflow-hidden">
        <div className="orb orb-violet w-[500px] h-[500px] top-[-100px] left-[-100px] opacity-40" />
        <div className="orb orb-cyan w-[400px] h-[400px] bottom-[-50px] right-[-50px] opacity-30" />

        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        <div className="relative z-10 max-w-md px-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-8">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #7c3aed, #0891b2)" }}
            >
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold">
              <span className="gradient-text">HọcLộ</span>
              <span>Trình</span>
            </span>
          </Link>
          <h2 className="text-3xl font-extrabold mb-4">Chào mừng trở lại!</h2>
          <p className="text-base leading-relaxed" style={{ color: "#8892a4" }}>
            Đăng nhập để tiếp tục hành trình học tập. Theo dõi tiến độ, hoàn thành bài tập
            và nhận chứng chỉ.
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 sm:px-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 text-center">
            <Link href="/" className="inline-flex items-center gap-2">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #7c3aed, #0891b2)" }}
              >
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg gradient-text">HọcLộ Trình</span>
            </Link>
          </div>

          <h1 className="text-2xl font-extrabold mb-2">Đăng nhập</h1>
          <p className="text-sm mb-8" style={{ color: "#8892a4" }}>
            Chưa có tài khoản?{" "}
            <Link href="/auth/register" className="font-semibold" style={{ color: "#a78bfa" }}>
              Đăng ký miễn phí
            </Link>
          </p>

          {error && (
            <div
              className="mb-6 p-4 rounded-xl text-sm"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "var(--foreground)" }}>
                Email hoặc tên đăng nhập
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#8892a4" }} />
                <input
                  type="text"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="email@example.com"
                  className="input-base pl-11"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                  Mật khẩu
                </label>
                <Link href="/auth/forgot-password" className="text-xs" style={{ color: "#a78bfa" }}>
                  Quên mật khẩu?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#8892a4" }} />
                <input
                  type={showPw ? "text" : "password"}
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="input-base pl-11 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                  style={{ color: "#8892a4" }}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3.5 text-base disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang đăng nhập...
                </span>
              ) : (
                <>
                  Đăng nhập <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
