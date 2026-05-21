"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
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
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (res.ok) setSent(true);
      else { const d = await res.json(); toast.error(d.message || "Email không tồn tại trong hệ thống"); }
    } catch { toast.error("Lỗi kết nối"); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left */}
      <div
        className="hidden md:flex md:w-1/2 flex-col items-center justify-center p-12 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 45%, #0e7490 100%)" }}
      >
        <div className="absolute top-[10%] left-[10%] w-72 h-72 orb orb-violet opacity-40" />
        <div className="absolute bottom-[10%] right-[5%] w-56 h-56 orb orb-teal opacity-35" />
        <div className="absolute inset-0 dot-pattern opacity-25" />
        <div className="relative z-10 max-w-sm text-center">
          <div className="w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6"
            style={{ background: "rgba(129,140,248,0.2)", border: "1px solid rgba(129,140,248,0.3)" }}>
            <Mail className="w-12 h-12 text-[#a5b4fc]" />
          </div>
          <h2 className="text-2xl font-extrabold text-white mb-3">Khôi phục mật khẩu</h2>
          <p className="text-slate-300 text-sm leading-relaxed">
            Nhập địa chỉ email bạn đã đăng ký. Chúng tôi sẽ gửi link đặt lại mật khẩu ngay lập tức.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            {["Nhanh chóng", "Bảo mật", "Tin cậy"].map(txt => (
              <div key={txt} className="rounded-xl px-3 py-2 text-xs font-bold text-white/80"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
                {txt}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right - Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 md:px-12 bg-[#f8f7ff] dark:bg-[#0d0b1e]">
        <div className="w-full max-w-[400px]">
          <div className="mb-8">
            <Link href="/" className="inline-block"><Logo size="lg" /></Link>
          </div>

          {sent ? (
            <div>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
                style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}>
                <CheckCircle2 className="w-8 h-8 text-[#10b981]" />
              </div>
              <h1 className="text-2xl font-extrabold mb-2 text-foreground">Email đã được gửi!</h1>
              <p className="text-sm text-foreground/60 mb-2">Chúng tôi đã gửi liên kết đặt lại mật khẩu đến:</p>
              <p className="text-sm font-bold text-[#6366f1] mb-6">{email}</p>
              <div className="p-4 rounded-xl mb-6 text-xs"
                style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)", color: "rgba(99,102,241,0.8)" }}>
                Không nhận được email? Kiểm tra thư mục spam hoặc{" "}
                <button onClick={() => setSent(false)} className="font-bold text-[#6366f1] hover:underline">gửi lại</button>.
              </div>
              <Link href="/auth/login"
                className="inline-flex items-center gap-2 w-full justify-center px-6 py-3.5 rounded-xl font-bold text-sm text-white transition-all hover:-translate-y-0.5"
                style={{ background: "linear-gradient(135deg,#6366f1,#7c3aed)", boxShadow: "0 6px 20px rgba(99,102,241,0.35)" }}>
                Quay lại đăng nhập
              </Link>
            </div>
          ) : (
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-4"
                style={{ background: "rgba(99,102,241,0.1)", color: "#6366f1", border: "1px solid rgba(99,102,241,0.2)" }}>
                🔑 Quên mật khẩu
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold mb-2 text-foreground">Quên mật khẩu?</h1>
              <p className="text-sm text-foreground/60 mb-6">Nhập email đăng ký để nhận liên kết đặt lại mật khẩu.</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-1.5 text-foreground">Email của bạn</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40 text-[#6366f1]" />
                    <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="email@example.com"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border bg-white dark:bg-[#1a1535] text-foreground outline-none text-sm placeholder:text-foreground/30 transition-all"
                      style={{ borderColor: "rgba(199,210,254,0.7)" }}
                      onFocus={e => { e.target.style.borderColor = "#6366f1"; e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.15)"; }}
                      onBlur={e => { e.target.style.borderColor = "rgba(199,210,254,0.7)"; e.target.style.boxShadow = "none"; }}
                    />
                  </div>
                </div>

                <button type="submit" disabled={loading || !email.trim()}
                  className="w-full py-3.5 rounded-xl font-bold text-sm text-white transition-all hover:-translate-y-0.5 disabled:opacity-60 flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg,#6366f1,#7c3aed)", boxShadow: "0 6px 20px rgba(99,102,241,0.35)" }}>
                  {loading ? (<><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Đang gửi...</>) : "Đặt lại mật khẩu"}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t text-center" style={{ borderColor: "rgba(199,210,254,0.5)" }}>
                <Link href="/auth/login" className="flex items-center justify-center gap-1.5 text-sm font-bold text-[#6366f1] hover:text-[#4f46e5] transition-colors">
                  <ArrowLeft className="w-4 h-4" /> Quay lại đăng nhập
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
