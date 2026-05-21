"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/ui/logo";

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
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left - Illustration + benefits */}
      <div
        className="hidden md:flex md:w-1/2 flex-col items-center justify-center p-12 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 45%, #0e7490 100%)" }}
      >
        <div className="absolute top-[10%] left-[10%] w-72 h-72 orb orb-violet opacity-40" />
        <div className="absolute bottom-[10%] right-[5%] w-56 h-56 orb orb-teal opacity-35" />
        <div className="absolute inset-0 dot-pattern opacity-25" />
        <div className="relative z-10 max-w-md text-center">
          <div className="rounded-3xl overflow-hidden border-4 border-white/10 shadow-2xl mb-8">
            <img src="/images/login_illustration_lumi.png" alt="Đăng ký tài khoản" className="w-full aspect-square object-cover" />
          </div>
          <h2 className="text-2xl font-extrabold text-white mb-3">Bắt đầu hành trình học tập</h2>
          <div className="space-y-2.5 mt-4">
            {[
              { text: "Hoàn toàn miễn phí để bắt đầu", color: "#a5b4fc" },
              { text: "500+ khóa học chất lượng cao", color: "#22d3ee" },
              { text: "Chứng chỉ khi hoàn thành", color: "#fbbf24" },
              { text: "Phụ huynh theo dõi tiến độ", color: "#34d399" },
            ].map(({ text, color }) => (
              <div key={text} className="flex items-center gap-3 text-sm text-left rounded-xl px-3.5 py-2.5"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color }} />
                <span className="text-white/80 font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right - Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-10 md:px-12 bg-[#f8f7ff] dark:bg-[#0d0b1e]">
        <div className="w-full max-w-[420px]">
          <div className="mb-6 md:hidden">
            <Link href="/"><Logo size="lg" /></Link>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-4"
            style={{ background: "rgba(99,102,241,0.1)", color: "#6366f1", border: "1px solid rgba(99,102,241,0.2)" }}>
            ✨ Tạo tài khoản mới
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold mb-2 text-foreground">Đăng ký LumiLearn</h1>
          <p className="text-sm text-foreground/60 mb-5">Bắt đầu hành trình học tập ngay hôm nay.</p>

          {error && (
            <div className="mb-4 p-3.5 rounded-xl text-sm font-medium flex items-center gap-2"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#dc2626" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Role selector */}
            <div>
              <label className="block text-sm font-semibold mb-1.5 text-foreground">Bạn là</label>
              <div className="grid grid-cols-2 gap-2">
                {roles.map((r) => (
                  <button key={r.value} type="button" onClick={() => setForm({ ...form, role: r.value })}
                    className="p-3 text-center transition-all rounded-xl text-sm font-semibold"
                    style={form.role === r.value
                      ? { background: "linear-gradient(135deg,#6366f1,#7c3aed)", color: "#fff", border: "2px solid #6366f1" }
                      : { background: "#fff", border: "1.5px solid rgba(199,210,254,0.7)", color: "#374151" }}>
                    {r.label}
                    <p className="text-[10px] opacity-70 mt-0.5">{r.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Fields helper */}
            {([
              { field: "username", label: "Tên đăng nhập", type: "text", placeholder: "nguyenvana", icon: "👤" },
              { field: "email", label: "Email", type: "email", placeholder: "email@example.com", icon: "✉️" },
            ] as { field: keyof typeof form; label: string; type: string; placeholder: string; icon: string }[]).map(({ field, label, type, placeholder }) => (
              <div key={field}>
                <label className="block text-sm font-semibold mb-1.5 text-foreground">{label}</label>
                <input type={type} required value={form[field]}
                  onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                  placeholder={placeholder}
                  className="w-full px-4 py-3 rounded-xl border bg-white dark:bg-[#1a1535] text-foreground outline-none text-sm placeholder:text-foreground/30 transition-all"
                  style={{ borderColor: "rgba(199,210,254,0.7)" }}
                  onFocus={e => { e.target.style.borderColor = "#6366f1"; e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.15)"; }}
                  onBlur={e => { e.target.style.borderColor = "rgba(199,210,254,0.7)"; e.target.style.boxShadow = "none"; }}
                />
              </div>
            ))}

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold mb-1.5 text-foreground">Mật khẩu</label>
              <div className="relative">
                <input type={showPw ? "text" : "password"} required value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Tối thiểu 6 ký tự"
                  className="w-full px-4 py-3 pr-12 rounded-xl border bg-white dark:bg-[#1a1535] text-foreground outline-none text-sm placeholder:text-foreground/30 transition-all"
                  style={{ borderColor: "rgba(199,210,254,0.7)" }}
                  onFocus={e => { e.target.style.borderColor = "#6366f1"; e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.15)"; }}
                  onBlur={e => { e.target.style.borderColor = "rgba(199,210,254,0.7)"; e.target.style.boxShadow = "none"; }}
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-[#6366f1] transition-colors">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-sm font-semibold mb-1.5 text-foreground">Xác nhận mật khẩu</label>
              <input type="password" required value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                placeholder="Nhập lại mật khẩu"
                className="w-full px-4 py-3 rounded-xl border bg-white dark:bg-[#1a1535] text-foreground outline-none text-sm placeholder:text-foreground/30 transition-all"
                style={{ borderColor: "rgba(199,210,254,0.7)" }}
                onFocus={e => { e.target.style.borderColor = "#6366f1"; e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.15)"; }}
                onBlur={e => { e.target.style.borderColor = "rgba(199,210,254,0.7)"; e.target.style.boxShadow = "none"; }}
              />
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-sm text-white transition-all hover:-translate-y-0.5 disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg,#6366f1,#7c3aed)", boxShadow: "0 6px 20px rgba(99,102,241,0.35)" }}>
              {loading ? (<><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Đang tạo...</>) : (<>Đăng ký <ArrowRight className="w-4 h-4" /></>)}
            </button>
          </form>

          <div className="mt-5 pt-5 border-t text-center" style={{ borderColor: "rgba(199,210,254,0.5)" }}>
            <span className="text-sm text-foreground/60">Đã có tài khoản? </span>
            <Link href="/auth/login" className="text-sm font-bold text-[#6366f1] hover:text-[#4f46e5] transition-colors">Đăng nhập</Link>
          </div>
          <p className="text-xs text-center mt-3 text-foreground/40">
            Bằng việc đăng ký, bạn đồng ý với{" "}
            <Link href="/terms" className="text-[#6366f1] hover:underline">Điều khoản</Link>{" "}và{" "}
            <Link href="/privacy" className="text-[#6366f1] hover:underline">Chính sách bảo mật</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
