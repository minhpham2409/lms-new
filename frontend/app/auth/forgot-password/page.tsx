"use client";

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
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
      else { const d = await res.json(); toast.error(d.message || "Lỗi gửi email"); }
    } catch { toast.error("Lỗi kết nối"); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <Navbar />
      <div className="pt-20 pb-24 flex items-center justify-center min-h-[80vh]">
        <div className="w-full max-w-md px-4">
          {sent ? (
            <div className="card-base text-center py-12">
              <CheckCircle2 className="w-16 h-16 mx-auto mb-4" style={{ color: "#10b981" }} />
              <h2 className="text-xl font-extrabold mb-2">Đã gửi email!</h2>
              <p className="text-sm mb-6" style={{ color: "var(--foreground-muted)" }}>Kiểm tra hộp thư để đặt lại mật khẩu.</p>
              <Link href="/auth/login" className="btn-primary">Quay lại đăng nhập</Link>
            </div>
          ) : (
            <div className="card-base">
              <h1 className="text-2xl font-extrabold mb-2">Quên mật khẩu</h1>
              <p className="text-sm mb-6" style={{ color: "var(--foreground-muted)" }}>Nhập email để nhận liên kết đặt lại mật khẩu.</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--foreground-muted)" }} />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" className="input-base pl-11" required />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Gửi liên kết
                </button>
              </form>
              <Link href="/auth/login" className="flex items-center gap-1 text-sm mt-4 justify-center" style={{ color: "var(--foreground-muted)" }}>
                <ArrowLeft className="w-3 h-3" /> Quay lại đăng nhập
              </Link>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
