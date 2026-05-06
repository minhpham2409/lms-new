"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/components/auth/auth-state";
import {
  ShoppingCart, Trash2, Tag, BookOpen, ArrowRight, ShieldCheck,
  QrCode, CheckCircle2, X, Clock, CreditCard, Send,
} from "lucide-react";

const initialItems = [
  { id: "2", title: "Vật lý nâng cao — Lớp 8", author: "Cô Hương", price: 199000, color: "#3b82f6" },
  { id: "4", title: "Hóa học vui — Lớp 9", author: "Cô Lan", price: 149000, color: "#f59e0b" },
];

export default function CartPage() {
  const router = useRouter();
  const { user, isLoggedIn, loading } = useAuth();
  const [items, setItems] = useState(initialItems);
  const [coupon, setCoupon] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [paymentSent, setPaymentSent] = useState(false);

  useEffect(() => {
    if (!loading && isLoggedIn && user?.role !== "student") {
      router.push("/dashboard");
    }
  }, [user, isLoggedIn, loading, router]);

  const total = items.reduce((s, i) => s + i.price, 0);

  const handleCheckout = () => {
    setShowPayment(true);
  };

  const handleSendToParent = () => {
    setPaymentSent(true);
    // TODO: Call API to send notification + QR to parent
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <Navbar />
      <div className="pt-20 pb-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-extrabold mb-6 flex items-center gap-2">
            <ShoppingCart className="w-6 h-6" style={{ color: "#7c3aed" }} /> Giỏ hàng
            <span className="text-sm font-normal" style={{ color: "var(--foreground-muted)" }}>({items.length} khóa học)</span>
          </h1>

          {items.length === 0 ? (
            <div className="card-base text-center py-16">
              <ShoppingCart className="w-14 h-14 mx-auto mb-4" style={{ color: "var(--foreground-muted)" }} />
              <h2 className="text-lg font-bold mb-2">Giỏ hàng trống</h2>
              <p className="text-sm mb-6" style={{ color: "var(--foreground-muted)" }}>Hãy khám phá và thêm khóa học bạn yêu thích</p>
              <Link href="/courses" className="btn-primary">Xem khóa học</Link>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="card-base flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background: `${item.color}22` }}>
                      <BookOpen className="w-7 h-7" style={{ color: item.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm truncate">{item.title}</h3>
                      <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>{item.author}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold" style={{ color: "#a78bfa" }}>
                        {(item.price / 1000).toFixed(0)}k ₫
                      </p>
                      <button
                        onClick={() => setItems(items.filter((i) => i.id !== item.id))}
                        className="text-xs flex items-center gap-1 mt-1" style={{ color: "#ef4444" }}
                      >
                        <Trash2 className="w-3 h-3" /> Xóa
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="glass-card rounded-2xl p-6 h-fit sticky top-24" style={{ boxShadow: "0 24px 64px rgba(0,0,0,0.15)" }}>
                <h3 className="font-bold mb-4">Tóm tắt đơn hàng</h3>
                <div className="space-y-3 text-sm mb-4">
                  <div className="flex justify-between" style={{ color: "var(--foreground-muted)" }}>
                    <span>Tạm tính</span>
                    <span>{(total / 1000).toFixed(0)}k ₫</span>
                  </div>
                  <div className="flex justify-between" style={{ color: "var(--foreground-muted)" }}>
                    <span>Giảm giá</span>
                    <span>0 ₫</span>
                  </div>
                  <div className="divider" />
                  <div className="flex justify-between font-bold text-base">
                    <span>Tổng cộng</span>
                    <span className="gradient-text">{(total / 1000).toFixed(0)}k ₫</span>
                  </div>
                </div>

                {/* Coupon */}
                <div className="flex gap-2 mb-4">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--foreground-muted)" }} />
                    <input value={coupon} onChange={(e) => setCoupon(e.target.value)} placeholder="Mã giảm giá" className="input-base pl-9 py-2.5 text-sm" />
                  </div>
                  <button className="btn-secondary px-4 py-2.5 text-sm">Áp dụng</button>
                </div>

                <button onClick={handleCheckout} className="btn-primary w-full justify-center py-3.5 text-base">
                  Thanh toán <ArrowRight className="w-4 h-4" />
                </button>

                <div className="flex items-center justify-center gap-1.5 mt-4 text-xs" style={{ color: "var(--foreground-muted)" }}>
                  <ShieldCheck className="w-3.5 h-3.5" style={{ color: "#10b981" }} />
                  Thanh toán an toàn & bảo mật
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal with QR */}
      {showPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
          <div className="card-base w-full max-w-md animate-scale-in" style={{ background: "var(--popover)" }}>
            {!paymentSent ? (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-extrabold flex items-center gap-2">
                    <QrCode className="w-5 h-5" style={{ color: "#7c3aed" }} /> Thanh toán
                  </h2>
                  <button onClick={() => setShowPayment(false)} className="btn-ghost px-2 py-2">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="text-center mb-6">
                  <p className="text-sm mb-4" style={{ color: "var(--foreground-muted)" }}>
                    Quét mã QR để thanh toán hoặc gửi cho phụ huynh
                  </p>

                  {/* QR Code */}
                  <div className="w-56 h-56 mx-auto rounded-2xl flex items-center justify-center mb-4" style={{ background: "white", border: "2px solid var(--border)" }}>
                    <img
                      src={`https://img.vietqr.io/image/MB-0389999999-compact2.png?amount=${total}&addInfo=${encodeURIComponent(`Thanh toan khoa hoc - ${user?.username}`)}&accountName=${encodeURIComponent('NGUYEN VAN MINH')}`}
                      alt="QR Thanh toán"
                      className="w-52 h-52 object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`Thanh toan ${total} VND - ${user?.username}`)}`;
                      }}
                    />
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between px-4 py-2 rounded-lg" style={{ background: "var(--muted)" }}>
                      <span style={{ color: "var(--foreground-muted)" }}>Số tiền</span>
                      <span className="font-bold gradient-text">{total.toLocaleString()} ₫</span>
                    </div>
                    <div className="flex justify-between px-4 py-2 rounded-lg" style={{ background: "var(--muted)" }}>
                      <span style={{ color: "var(--foreground-muted)" }}>Nội dung CK</span>
                      <span className="font-mono text-xs">HL {user?.username}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <button onClick={handleSendToParent} className="btn-primary w-full justify-center py-3">
                    <Send className="w-4 h-4" /> Gửi cho phụ huynh thanh toán
                  </button>
                  <p className="text-xs text-center" style={{ color: "var(--foreground-muted)" }}>
                    Mã QR sẽ được gửi đến phụ huynh qua thông báo để thanh toán
                  </p>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4" style={{ background: "rgba(16,185,129,0.15)" }}>
                  <CheckCircle2 className="w-10 h-10" style={{ color: "#10b981" }} />
                </div>
                <h2 className="text-xl font-extrabold mb-2">Đã gửi thành công!</h2>
                <p className="text-sm mb-6" style={{ color: "var(--foreground-muted)" }}>
                  Mã QR thanh toán đã được gửi đến phụ huynh. Bạn sẽ nhận thông báo khi thanh toán hoàn tất.
                </p>
                <div className="flex items-center gap-2 justify-center mb-6 px-4 py-3 rounded-xl" style={{ background: "var(--muted)" }}>
                  <Clock className="w-4 h-4" style={{ color: "#f59e0b" }} />
                  <span className="text-sm font-medium" style={{ color: "#f59e0b" }}>Đang chờ thanh toán</span>
                </div>
                <button onClick={() => { setShowPayment(false); setPaymentSent(false); }} className="btn-secondary w-full justify-center">
                  Đóng
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
