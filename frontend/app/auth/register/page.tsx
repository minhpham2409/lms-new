"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GraduationCap, Mail, Lock, User, Eye, EyeOff, ArrowRight, CheckCircle2 } from "lucide-react";

const roles = [
  { value: "student", label: "Học sinh", desc: "Đăng ký khóa học & bài tập" },
  { value: "teacher", label: "Giáo viên", desc: "Tạo & quản lý khóa học" },
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
    <div className="min-h-screen flex" style={{ background: "var(--background)" }}>
      {/* Left branding */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center overflow-hidden">
        <div className="orb orb-violet w-[500px] h-[500px] top-[-100px] left-[-100px] opacity-40" />
        <div className="orb orb-cyan w-[400px] h-[400px] bottom-[-50px] right-[-50px] opacity-30" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className="relative z-10 max-w-md px-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-8">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #7c3aed, #0891b2)" }}>
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold"><span className="gradient-text">HọcLộ</span><span>Trình</span></span>
          </Link>
          <h2 className="text-3xl font-extrabold mb-4">Tham gia ngay!</h2>
          <p className="text-base leading-relaxed" style={{ color: "#8892a4" }}>
            Hàng nghìn học sinh đã cải thiện kết quả. Đăng ký chỉ mất 30 giây.
          </p>
          <div className="mt-8 space-y-3 text-left">
            {["Hoàn toàn miễn phí để bắt đầu", "500+ khóa học chất lượng", "Chứng chỉ khi hoàn thành"].map((t) => (
              <div key={t} className="flex items-center gap-2 text-sm" style={{ color: "#8892a4" }}>
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: "#10b981" }} />
                {t}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 sm:px-8 py-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 text-center">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #7c3aed, #0891b2)" }}>
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg gradient-text">HọcLộ Trình</span>
            </Link>
          </div>

          <h1 className="text-2xl font-extrabold mb-2">Tạo tài khoản</h1>
          <p className="text-sm mb-8" style={{ color: "#8892a4" }}>
            Đã có tài khoản?{" "}
            <Link href="/auth/login" className="font-semibold" style={{ color: "#a78bfa" }}>Đăng nhập</Link>
          </p>

          {error && (
            <div className="mb-6 p-4 rounded-xl text-sm" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role selector */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "#f1f5ff" }}>Bạn là</label>
              <div className="grid grid-cols-3 gap-2">
                {roles.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setForm({ ...form, role: r.value })}
                    className="p-3 rounded-xl text-center transition-all duration-200"
                    style={{
                      background: form.role === r.value ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${form.role === r.value ? "rgba(124,58,237,0.5)" : "rgba(255,255,255,0.08)"}`,
                    }}
                  >
                    <p className="text-sm font-semibold" style={{ color: form.role === r.value ? "#a78bfa" : "#f1f5ff" }}>{r.label}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: "#8892a4" }}>{r.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "#f1f5ff" }}>Tên đăng nhập</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#8892a4" }} />
                <input type="text" required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="nguyenvana" className="input-base pl-11" />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "#f1f5ff" }}>Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#8892a4" }} />
                <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" className="input-base pl-11" />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "#f1f5ff" }}>Mật khẩu</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#8892a4" }} />
                <input type={showPw ? "text" : "password"} required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Tối thiểu 6 ký tự" className="input-base pl-11 pr-11" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: "#8892a4" }}>
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "#f1f5ff" }}>Xác nhận mật khẩu</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#8892a4" }} />
                <input type="password" required value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} placeholder="Nhập lại mật khẩu" className="input-base pl-11" />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3.5 text-base disabled:opacity-50">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang tạo tài khoản...
                </span>
              ) : (
                <>Tạo tài khoản <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <p className="text-xs text-center mt-6" style={{ color: "#8892a4" }}>
            Bằng việc đăng ký, bạn đồng ý với{" "}
            <Link href="/terms" style={{ color: "#a78bfa" }}>Điều khoản</Link>{" "}và{" "}
            <Link href="/privacy" style={{ color: "#a78bfa" }}>Chính sách bảo mật</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
