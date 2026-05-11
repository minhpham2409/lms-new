"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/components/auth/auth-state";
import {
  ShoppingCart, Trash2, Tag, BookOpen, ArrowRight, ShieldCheck,
  QrCode, CheckCircle2, X, Clock, Send, Loader2, AlertTriangle, UserPlus, Gift,
} from "lucide-react";
import { toast } from "sonner";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

export default function CartPage() {
  const router = useRouter();
  const { user, token, isLoggedIn, loading } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [cartLoading, setCartLoading] = useState(true);
  const [coupon, setCoupon] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [paymentSent, setPaymentSent] = useState(false);
  const [hasParent, setHasParent] = useState<boolean | null>(null);
  const [sending, setSending] = useState(false);
  const [myCoupons, setMyCoupons] = useState<any[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number; savings: number } | null>(null);

  useEffect(() => {
    if (!loading && isLoggedIn && user?.role !== "student") router.push("/dashboard");
  }, [user, isLoggedIn, loading, router]);

  useEffect(() => {
    if (token) { fetchCart(); checkParent(); fetchMyCoupons(); }
  }, [token]);

  async function fetchCart() {
    try {
      const res = await fetch(`${API}/cart`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const data = await res.json(); setItems(data.items || []); }
    } catch {} finally { setCartLoading(false); }
  }

  async function checkParent() {
    try {
      // Check if the student has any accepted parent-child link
      const profileRes = await fetch(`${API}/auth/profile`, { headers: { Authorization: `Bearer ${token}` } });
      if (profileRes.ok) {
        const profile = await profileRes.json();
        // childLinks = student's accepted parent links
        if (profile.childLinks?.length > 0) {
          setHasParent(true);
          return;
        }
      }
      // Check incoming requests (pending = parent sent request)
      const res = await fetch(`${API}/parents/link-requests/incoming`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setHasParent(true);
          return;
        }
      }
      setHasParent(false); // No parent — block
    } catch {
      setHasParent(false);
    }
  }

  async function fetchMyCoupons() {
    try {
      const res = await fetch(`${API}/coupons/my-coupons`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        if (data) setMyCoupons(data);
      }
    } catch {}
  }

  async function removeItem(itemId: string) {
    try {
      await fetch(`${API}/cart/item/${itemId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      setItems(items.filter(i => i.id !== itemId));
      setAppliedCoupon(null); // Reset applied coupon since total changed
      toast.success("Đã xóa khỏi giỏ hàng");
    } catch { toast.error("Không thể xóa"); }
  }

  async function applyCoupon(code?: string) {
    const couponCode = code || coupon.trim();
    if (!couponCode) return;
    try {
      const res = await fetch(`${API}/cart/apply-coupon`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code: couponCode }),
      });
      if (res.ok) {
        const data = await res.json();
        setAppliedCoupon({ code: data.code, discount: data.discount, savings: data.savings });
        setCoupon(data.code);
        toast.success(`Đã áp dụng mã giảm giá ${data.discount}%!`);
      }
      else { const d = await res.json(); toast.error(d.message || "Mã không hợp lệ"); }
    } catch { toast.error("Lỗi"); }
  }

  async function clearCart() {
    if (!confirm("Xóa toàn bộ giỏ hàng?")) return;
    try {
      await fetch(`${API}/cart/clear`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      setItems([]); setAppliedCoupon(null); setCoupon(""); toast.success("Đã xóa giỏ hàng");
    } catch { toast.error("Lỗi"); }
  }

  function removeCoupon() {
    setAppliedCoupon(null);
    setCoupon("");
    toast.success("Đã hủy mã giảm giá");
  }

  const total = items.reduce((s, i) => s + (i.course?.price || 0), 0);
  const finalTotal = appliedCoupon ? total * (1 - appliedCoupon.discount / 100) : total;
  const colors = ["#7c3aed", "#3b82f6", "#f59e0b", "#10b981", "#ec4899"];

  async function handleCheckout() {
    if (hasParent === false) {
      toast.error("Bạn cần liên kết tài khoản phụ huynh trước khi thanh toán!");
      return;
    }
    setShowPayment(true);
  }

  async function handleSendToParent() {
    setSending(true);
    try {
      // 1. Create order from cart (with coupon if applied)
      const orderRes = await fetch(`${API}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(appliedCoupon ? { couponCode: appliedCoupon.code } : {}),
      });
      if (!orderRes.ok) {
        const d = await orderRes.json();
        toast.error(d.message || "Không thể tạo đơn hàng");
        setSending(false);
        return;
      }
      const order = await orderRes.json();

      // 2. Generate QR for the order
      await fetch(`${API}/payments/qr`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orderId: order.id }),
      }).catch(() => {});

      // 3. Create pending enrollments for each course
      for (const item of items) {
        await fetch(`${API}/enrollments/pending`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ courseId: item.course?.id || item.courseId }),
        }).catch(() => {});
      }

      // 4. Send notification to parent (the backend handles this via the order/payment flow)
      // The parent will see the pending order with QR on their dashboard

      setPaymentSent(true);
      setItems([]);
      toast.success("Đã gửi mã QR đến phụ huynh!");
    } catch { toast.error("Lỗi tạo đơn hàng"); }
    finally { setSending(false); }
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <Navbar />
      <div className="pt-20 pb-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-extrabold mb-6 flex items-center gap-2">
            <ShoppingCart className="w-6 h-6" style={{ color: "#7c3aed" }} /> Giỏ hàng
            <span className="text-sm font-normal" style={{ color: "var(--foreground-muted)" }}>({items.length} khóa học)</span>
          </h1>

          {/* No parent warning */}
          {hasParent === false && items.length > 0 && (
            <div className="card-base mb-4 flex items-center gap-3" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)" }}>
              <AlertTriangle className="w-5 h-5 flex-shrink-0" style={{ color: "#f59e0b" }} />
              <div className="flex-1">
                <p className="text-sm font-semibold" style={{ color: "#f59e0b" }}>Chưa liên kết phụ huynh</p>
                <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>Bạn cần liên kết tài khoản phụ huynh để phụ huynh thanh toán cho bạn.</p>
              </div>
              <Link href="/dashboard" className="btn-secondary text-xs px-3 flex-shrink-0">
                <UserPlus className="w-3 h-3" /> Liên kết
              </Link>
            </div>
          )}

          {cartLoading ? (
            <div className="card-base flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#7c3aed" }} />
            </div>
          ) : items.length === 0 ? (
            <div className="card-base text-center py-16">
              <ShoppingCart className="w-14 h-14 mx-auto mb-4" style={{ color: "var(--foreground-muted)" }} />
              <h2 className="text-lg font-bold mb-2">Giỏ hàng trống</h2>
              <p className="text-sm mb-6" style={{ color: "var(--foreground-muted)" }}>Hãy khám phá và thêm khóa học bạn yêu thích</p>
              <Link href="/courses" className="btn-primary">Xem khóa học</Link>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-3">
                {items.map((item, i) => (
                  <div key={item.id} className="card-base flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background: `${colors[i % colors.length]}22` }}>
                      <BookOpen className="w-7 h-7" style={{ color: colors[i % colors.length] }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm truncate">{item.course?.title || "Khóa học"}</h3>
                      <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>{item.course?.author?.firstName || item.course?.author?.username || "Giáo viên"}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold" style={{ color: "#a78bfa" }}>{(item.course?.price || 0).toLocaleString()} ₫</p>
                      <button onClick={() => removeItem(item.id)} className="text-xs flex items-center gap-1 mt-1" style={{ color: "#ef4444" }}>
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
                  <div className="flex justify-between" style={{ color: "var(--foreground-muted)" }}><span>Tạm tính</span><span>{total.toLocaleString()} ₫</span></div>
                  {appliedCoupon && (
                    <>
                      <div className="flex justify-between items-center" style={{ color: "#10b981" }}>
                        <span className="flex items-center gap-1.5">
                          <Tag className="w-3 h-3" />
                          Giảm {appliedCoupon.discount}%
                          <button onClick={removeCoupon} className="ml-1 opacity-60 hover:opacity-100 transition-opacity"><X className="w-3 h-3" /></button>
                        </span>
                        <span>−{appliedCoupon.savings.toLocaleString()} ₫</span>
                      </div>
                    </>
                  )}
                  <div className="divider" />
                  <div className="flex justify-between font-bold text-base"><span>Tổng cộng</span><span className="gradient-text">{finalTotal.toLocaleString()} ₫</span></div>
                </div>

                {/* Voucher picker */}
                {myCoupons.length > 0 && !appliedCoupon && (
                  <div className="mb-4">
                    <p className="text-xs font-semibold mb-2 flex items-center gap-1.5" style={{ color: "#f59e0b" }}>
                      <Gift className="w-3.5 h-3.5" /> Voucher dành cho bạn
                    </p>
                    <div className="space-y-2">
                      {myCoupons.map(c => (
                        <button
                          key={c.id}
                          onClick={() => applyCoupon(c.code)}
                          className="w-full p-3 rounded-xl text-left transition-all hover:scale-[1.02] cursor-pointer"
                          style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.08), rgba(245,158,11,0.08))", border: "1px solid rgba(124,58,237,0.2)" }}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-mono text-sm font-bold" style={{ color: "#a78bfa" }}>{c.code}</span>
                              <p className="text-[10px] mt-0.5" style={{ color: "var(--foreground-muted)" }}>
                                Giảm {c.discount}% · {c.expiresAt ? `Hết hạn ${new Date(c.expiresAt).toLocaleDateString("vi-VN")}` : 'Không có hạn'}
                              </p>
                            </div>
                            <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: "rgba(16,185,129,0.15)", color: "#10b981" }}>
                              Dùng
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Manual coupon input */}
                {!appliedCoupon && (
                  <div className="flex gap-2 mb-4">
                    <input value={coupon} onChange={(e) => setCoupon(e.target.value)} onKeyDown={e => e.key === "Enter" && applyCoupon()} placeholder="Nhập mã giảm giá" className="input-base flex-1 py-2.5 text-sm" />
                    <button onClick={() => applyCoupon()} className="btn-secondary px-4 py-2.5 text-sm">Áp dụng</button>
                  </div>
                )}

                <button onClick={handleCheckout} className="btn-primary w-full justify-center py-3.5 text-base">
                  Thanh toán <ArrowRight className="w-4 h-4" />
                </button>
                <button onClick={clearCart} className="btn-ghost w-full justify-center py-2 text-xs mt-2" style={{ color: "#ef4444" }}>
                  <Trash2 className="w-3 h-3" /> Xóa toàn bộ giỏ hàng
                </button>
                <div className="flex items-center justify-center gap-1.5 mt-4 text-xs" style={{ color: "var(--foreground-muted)" }}>
                  <ShieldCheck className="w-3.5 h-3.5" style={{ color: "#10b981" }} /> Thanh toán an toàn & bảo mật
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
          <div className="card-base w-full max-w-md animate-scale-in" style={{ background: "var(--popover)" }}>
            {!paymentSent ? (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-extrabold flex items-center gap-2"><QrCode className="w-5 h-5" style={{ color: "#7c3aed" }} /> Thanh toán</h2>
                  <button onClick={() => setShowPayment(false)} className="btn-ghost px-2 py-2"><X className="w-5 h-5" /></button>
                </div>
                <div className="text-center mb-6">
                  <p className="text-sm mb-4" style={{ color: "var(--foreground-muted)" }}>Mã QR sẽ được gửi đến phụ huynh của bạn</p>
                  <div className="w-56 h-56 mx-auto rounded-2xl flex items-center justify-center mb-4" style={{ background: "white", border: "2px solid var(--border)" }}>
                    <img
                      src={`https://img.vietqr.io/image/MB-0389999999-compact2.png?amount=${finalTotal}&addInfo=${encodeURIComponent(`HL - ${user?.username}`)}&accountName=${encodeURIComponent('NGUYEN VAN MINH')}`}
                      alt="QR" className="w-52 h-52 object-contain"
                      onError={(e) => { e.currentTarget.onerror = null; (e.target as HTMLImageElement).src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`Thanh toan ${finalTotal} VND`)}`; }}
                    />
                  </div>
                  <div className="flex justify-between px-4 py-2 rounded-lg text-sm" style={{ background: "var(--muted)" }}>
                    <span style={{ color: "var(--foreground-muted)" }}>Tổng</span>
                    <span className="font-bold gradient-text">{finalTotal.toLocaleString()} ₫</span>
                  </div>
                </div>
                <button onClick={handleSendToParent} disabled={sending} className="btn-primary w-full justify-center py-3">
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Gửi cho phụ huynh thanh toán
                </button>
                <p className="text-[10px] mt-3 text-center" style={{ color: "var(--foreground-muted)" }}>
                  Sau khi phụ huynh thanh toán, giáo viên sẽ duyệt và thêm bạn vào lớp
                </p>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4" style={{ background: "rgba(16,185,129,0.15)" }}>
                  <CheckCircle2 className="w-10 h-10" style={{ color: "#10b981" }} />
                </div>
                <h2 className="text-xl font-extrabold mb-2">Đã gửi thành công!</h2>
                <p className="text-sm mb-4" style={{ color: "var(--foreground-muted)" }}>Mã QR đã gửi đến phụ huynh. Sau khi thanh toán, giáo viên sẽ duyệt để thêm bạn vào lớp.</p>
                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2 justify-center px-4 py-2.5 rounded-xl" style={{ background: "rgba(245,158,11,0.1)" }}>
                    <Clock className="w-4 h-4" style={{ color: "#f59e0b" }} />
                    <span className="text-sm font-medium" style={{ color: "#f59e0b" }}>Bước 1: Chờ phụ huynh thanh toán</span>
                  </div>
                  <div className="flex items-center gap-2 justify-center px-4 py-2.5 rounded-xl" style={{ background: "var(--muted)" }}>
                    <Clock className="w-4 h-4" style={{ color: "var(--foreground-muted)" }} />
                    <span className="text-sm" style={{ color: "var(--foreground-muted)" }}>Bước 2: Giáo viên duyệt vào lớp</span>
                  </div>
                </div>
                <button onClick={() => { setShowPayment(false); setPaymentSent(false); router.push("/dashboard"); }} className="btn-primary w-full justify-center">
                  Về trang chủ
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
