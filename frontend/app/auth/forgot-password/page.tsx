"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { toast } from "sonner";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/forgot-password`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (res.ok) setSent(true);
      else { const d = await res.json(); toast.error(d.message || "Email không tồn tại"); }
    } catch { toast.error("Lỗi kết nối"); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <div className="hidden md:flex md:w-1/2 relative overflow-hidden bg-[#051025]">
        <img src="/images/lumilearn_auth_banner.jpg" alt="LumiLearn" className="absolute inset-0 w-full h-full object-cover" />
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12 md:px-12" style={{ background: "var(--background)" }}>
        <div className="w-full max-w-[400px]">
          <div className="mb-8"><Link href="/"><Logo size="lg" /></Link></div>

          {sent ? (
            <div>
              <p className="text-3xl mb-2">✓</p>
              <h1 className="text-2xl font-extrabold mb-2">Email đã được gửi!</h1>
              <p className="text-sm mb-2" style={{ color: "var(--muted-foreground)" }}>Liên kết đặt lại mật khẩu đã gửi đến:</p>
              <p className="text-sm font-bold mb-6" style={{ color: "var(--primary)" }}>{email}</p>
              <div className="p-4 rounded-lg mb-6 text-xs" style={{ background: "var(--muted)", border: "1px solid var(--border)" }}>
                Không nhận được? Kiểm tra spam hoặc <button onClick={() => setSent(false)} className="font-bold hover:underline" style={{ color: "var(--primary)" }}>gửi lại</button>.
              </div>
              <Link href="/auth/login" className="block w-full text-center py-3.5 rounded-lg font-bold text-sm transition-all hover:-translate-y-0.5"
                style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>Quay lại đăng nhập</Link>
            </div>
          ) : (
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.15em] mb-3" style={{ color: "var(--primary)" }}>Quên mật khẩu</p>
              <h1 className="text-2xl sm:text-3xl font-extrabold mb-2">Đặt lại mật khẩu</h1>
              <p className="text-sm mb-6" style={{ color: "var(--muted-foreground)" }}>Nhập email đăng ký để nhận liên kết.</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Email của bạn</label>
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="email@example.com" className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all"
                    style={{ background: "var(--input)", border: "1.5px solid var(--border)", color: "var(--foreground)" }}
                    onFocus={e => e.target.style.borderColor = "var(--primary)"} onBlur={e => e.target.style.borderColor = "var(--border)"} />
                </div>
                <button type="submit" disabled={loading || !email.trim()}
                  className="w-full py-3.5 rounded-lg font-bold text-sm transition-all hover:-translate-y-0.5 disabled:opacity-60"
                  style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
                  {loading ? "Đang gửi..." : "Đặt lại mật khẩu →"}
                </button>
              </form>
              <div className="mt-6 pt-6 text-center" style={{ borderTop: "1px solid var(--border)" }}>
                <Link href="/auth/login" className="text-sm font-bold" style={{ color: "var(--primary)" }}>← Quay lại đăng nhập</Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
