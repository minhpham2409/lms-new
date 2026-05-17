"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Key, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

function ResetPasswordForm() {
  const params = useSearchParams();
  const tokenParam = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { toast.error("Mật khẩu không khớp"); return; }
    if (password.length < 6) { toast.error("Tối thiểu 6 ký tự"); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tokenParam, newPassword: password }),
      });
      if (res.ok) setDone(true);
      else { const d = await res.json(); toast.error(d.message || "Liên kết đã hết hạn"); }
    } catch { toast.error("Lỗi kết nối"); }
    finally { setLoading(false); }
  }

  if (done) {
    return (
      <div className="card-base text-center py-12">
        <CheckCircle2 className="w-16 h-16 mx-auto mb-4" style={{ color: "#10b981" }} />
        <h2 className="text-xl font-extrabold mb-2">Đã đặt lại mật khẩu!</h2>
        <Link href="/auth/login" className="btn-primary mt-4">Đăng nhập</Link>
      </div>
    );
  }

  return (
    <div className="card-base">
      <h1 className="text-2xl font-extrabold mb-6">Đặt lại mật khẩu</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Mật khẩu mới</label>
          <div className="relative">
            <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#6a6f73" }} />
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="input-base pl-11" required />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Xác nhận</label>
          <div className="relative">
            <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#6a6f73" }} />
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="••••••••" className="input-base pl-11" required />
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Đặt lại
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <Navbar />
      <div className="pt-20 pb-24 flex items-center justify-center min-h-[80vh]">
        <div className="w-full max-w-md px-4">
          <Suspense fallback={<div className="card-base text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
      <Footer />
    </div>
  );
}
