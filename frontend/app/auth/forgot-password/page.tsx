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
    <div className="min-h-screen flex flex-col md:flex-row bg-white dark:bg-[#1c1d1f]">
      {/* Left - Illustration */}
      <div className="hidden md:flex md:w-1/2 items-center justify-center p-12 bg-[#f7f9fa] dark:bg-[#2d2f31] border-r border-[#d1d7dc] dark:border-[#3e4143]">
        <div className="max-w-sm text-center">
          <div className="w-24 h-24 bg-[#f3f0ff] dark:bg-[rgba(164,53,240,0.15)] rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="w-12 h-12 text-[#a435f0]" />
          </div>
          <h2 className="text-2xl font-bold text-[#2d2f31] dark:text-white mb-3">
            Khôi phục mật khẩu
          </h2>
          <p className="text-sm text-[#6a6f73]">
            Nhập địa chỉ email bạn đã đăng ký. Chúng tôi sẽ gửi link đặt lại mật khẩu ngay lập tức.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-3">
            {["Nhanh chóng", "Bảo mật", "Tin cậy"].map(txt => (
              <div key={txt} className="bg-white dark:bg-[#1c1d1f] border border-[#d1d7dc] dark:border-[#3e4143] rounded p-3 text-center">
                <p className="text-xs font-bold text-[#2d2f31] dark:text-white">{txt}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right - Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 md:px-12">
        <div className="w-full max-w-[400px]">
          {/* Logo */}
          <div className="mb-8">
            <Link href="/" className="inline-block">
              <Logo size="lg" />
            </Link>
          </div>

          {sent ? (
            /* Success state */
            <div>
              <div className="w-16 h-16 bg-[#dcfce7] rounded-full flex items-center justify-center mb-5">
                <CheckCircle2 className="w-8 h-8 text-[#16a34a]" />
              </div>
              <h1 className="text-[1.75rem] font-bold mb-2 text-[#2d2f31] dark:text-white">
                Email đã được gửi!
              </h1>
              <p className="text-sm text-[#6a6f73] mb-2">
                Chúng tôi đã gửi liên kết đặt lại mật khẩu đến:
              </p>
              <p className="text-sm font-bold text-[#2d2f31] dark:text-white mb-6">{email}</p>
              <div className="bg-[#f7f9fa] dark:bg-[#3e4143] border border-[#d1d7dc] dark:border-[#3e4143] rounded p-4 mb-6">
                <p className="text-xs text-[#6a6f73]">
                  Không nhận được email? Kiểm tra thư mục spam hoặc <button onClick={() => setSent(false)} className="font-bold text-[#5624d0] hover:underline">gửi lại</button>.
                </p>
              </div>
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#a435f0] hover:bg-[#8710d8] text-white font-bold text-sm transition-colors rounded w-full justify-center"
              >
                Quay lại đăng nhập
              </Link>
            </div>
          ) : (
            /* Form */
            <div>
              <h1 className="text-[1.75rem] font-bold mb-2 text-[#2d2f31] dark:text-white">
                Quên mật khẩu?
              </h1>
              <p className="text-sm text-[#6a6f73] mb-6">
                Nhập email đăng ký để nhận liên kết đặt lại mật khẩu.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold mb-1.5 text-[#2d2f31] dark:text-white">
                    Email của bạn
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6a6f73]" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="email@example.com"
                      className="w-full pl-11 pr-4 py-3 border border-[#2d2f31] dark:border-[#6a6f73] bg-transparent text-[#2d2f31] dark:text-white rounded outline-none focus:ring-1 focus:ring-[#5624d0] placeholder:text-[#b0b5b9] text-sm transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="w-full bg-[#a435f0] hover:bg-[#8710d8] text-white font-bold py-3 text-sm transition-colors rounded disabled:opacity-60"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Đang gửi...
                    </span>
                  ) : "Gửi liên kết đặt lại mật khẩu"}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-[#d1d7dc] dark:border-[#3e4143]">
                <Link href="/auth/login" className="flex items-center justify-center gap-1.5 text-sm font-bold text-[#5624d0] dark:text-[#c0a5f7] hover:underline">
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
