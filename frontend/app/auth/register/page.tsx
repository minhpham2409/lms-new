"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
    if (form.password !== form.confirmPassword) { setError("Mật khẩu xác nhận không khớp"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1"}/auth/register`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: form.username, email: form.email, password: form.password, role: form.role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Đăng ký thất bại");
      router.push("/auth/login?registered=true");
    } catch (err: any) { setError(err.message || "Đăng ký thất bại"); }
    finally { setLoading(false); }
  };

  const inputStyle = { background: "var(--input)", border: "1.5px solid var(--border)", color: "var(--foreground)" };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left */}
      <div className="hidden md:flex md:w-1/2 relative overflow-hidden bg-[#051025]">
        <img src="/images/lumilearn_auth_banner.jpg" alt="LumiLearn" className="absolute inset-0 w-full h-full object-cover" />
      </div>

      {/* Right */}
      <div className="flex-1 flex items-center justify-center px-6 py-10 md:px-12" style={{ background: "var(--background)" }}>
        <div className="w-full max-w-[400px]">
          <div className="mb-6 md:hidden"><Link href="/"><Logo size="lg" /></Link></div>
          <p className="text-xs font-bold uppercase tracking-[0.15em] mb-3" style={{ color: "var(--primary)" }}>Tạo tài khoản mới</p>
          <h1 className="text-2xl sm:text-3xl font-extrabold mb-2">Đăng ký LumiLearn</h1>
          <p className="text-sm mb-5" style={{ color: "var(--muted-foreground)" }}>Bắt đầu hành trình học tập ngay hôm nay.</p>

          {error && (
            <div className="mb-4 p-3 rounded-lg text-sm font-medium"
              style={{ background: "rgba(248,180,134,0.08)", border: "1px solid rgba(248,180,134,0.15)", color: "var(--destructive)" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-sm font-semibold mb-1.5">Bạn là</label>
              <div className="grid grid-cols-2 gap-2">
                {roles.map(r => (
                  <button key={r.value} type="button" onClick={() => setForm({ ...form, role: r.value })}
                    className="p-3 text-center transition-all rounded-lg text-sm font-semibold"
                    style={form.role === r.value
                      ? { background: "var(--primary)", color: "var(--primary-foreground)", border: "2px solid var(--primary)" }
                      : { ...inputStyle, borderWidth: "1.5px" }}>
                    {r.label}
                    <p className="text-[10px] opacity-70 mt-0.5">{r.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {[
              { field: "username" as const, label: "Tên đăng nhập", type: "text", placeholder: "nguyenvana" },
              { field: "email" as const, label: "Email", type: "email", placeholder: "email@example.com" },
            ].map(({ field, label, type, placeholder }) => (
              <div key={field}>
                <label className="block text-sm font-semibold mb-1.5">{label}</label>
                <input type={type} required value={form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                  placeholder={placeholder} className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all" style={inputStyle}
                  onFocus={e => e.target.style.borderColor = "var(--primary)"} onBlur={e => e.target.style.borderColor = "var(--border)"} />
              </div>
            ))}

            <div>
              <label className="block text-sm font-semibold mb-1.5">Mật khẩu</label>
              <div className="relative">
                <input type={showPw ? "text" : "password"} required value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Tối thiểu 6 ký tự"
                  className="w-full px-4 py-3 pr-16 rounded-lg text-sm outline-none transition-all" style={inputStyle}
                  onFocus={e => e.target.style.borderColor = "var(--primary)"} onBlur={e => e.target.style.borderColor = "var(--border)"} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold" style={{ color: "var(--muted-foreground)" }}>
                  {showPw ? "Ẩn" : "Hiện"}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5">Xác nhận mật khẩu</label>
              <input type="password" required value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} placeholder="Nhập lại mật khẩu"
                className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all" style={inputStyle}
                onFocus={e => e.target.style.borderColor = "var(--primary)"} onBlur={e => e.target.style.borderColor = "var(--border)"} />
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3.5 rounded-lg font-bold text-sm transition-all hover:-translate-y-0.5 disabled:opacity-60"
              style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
              {loading ? "Đang tạo..." : "Đăng ký →"}
            </button>
          </form>

          <div className="mt-5 pt-5 text-center" style={{ borderTop: "1px solid var(--border)" }}>
            <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>Đã có tài khoản? </span>
            <Link href="/auth/login" className="text-sm font-bold" style={{ color: "var(--primary)" }}>Đăng nhập</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
