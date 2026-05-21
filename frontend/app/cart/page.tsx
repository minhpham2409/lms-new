"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/components/auth/auth-state";
import {
  ShoppingCart, Trash2, Tag, BookOpen, ArrowRight, ShieldCheck,
  QrCode, CheckCircle2, X, Clock, Send, Loader2, AlertTriangle, UserPlus, Gift, PlayCircle
} from "lucide-react";
import { toast } from "sonner";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

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
  const [qrPayment, setQrPayment] = useState<{ vietQrUrl: string; txnRef: string; addInfo: string; amount: number } | null>(null);

  const couponUnsupportedItems = items.filter(
    (item) => item.course?.allowPlatformPromotions === false,
  );
  const hasCouponUnsupportedItems = couponUnsupportedItems.length > 0;

  useEffect(() => {
    if (!loading && !isLoggedIn) { router.push("/auth/login"); return; }
    if (!loading && isLoggedIn && user?.role !== "student") router.push("/dashboard");
  }, [user, isLoggedIn, loading, router]);

  useEffect(() => {
    if (token) { fetchCart(); checkParent(); fetchMyCoupons(); }
    else if (!loading) { setCartLoading(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, loading]);

  async function fetchCart() {
    try {
      const res = await fetch(`${API}/cart`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const data = await res.json(); setItems(data.items || []); }
    } catch {} finally { setCartLoading(false); }
  }

  async function checkParent() {
    try {
      const profileRes = await fetch(`${API}/auth/profile`, { headers: { Authorization: `Bearer ${token}` } });
      if (profileRes.ok) {
        const profile = await profileRes.json();
        if (profile.childLinks?.length > 0) {
          setHasParent(true);
          return;
        }
      }
      const res = await fetch(`${API}/parents/link-requests/incoming`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setHasParent(true);
          return;
        }
      }
      setHasParent(false);
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
      setAppliedCoupon(null);
      toast.success("Đã xóa khỏi giỏ hàng");
    } catch { toast.error("Không thể xóa"); }
  }

  async function applyCoupon(code?: string) {
    const couponCode = code || coupon.trim();
    if (!couponCode) return;
    if (hasCouponUnsupportedItems) {
      toast.error("Giỏ hàng có khóa học không áp dụng mã giảm giá.");
      return;
    }
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

  async function handleCheckout() {
    if (user?.role === "student" && hasParent !== true) {
      toast.error("Bạn cần liên kết tài khoản phụ huynh trước khi thanh toán!");
      return;
    }
    setShowPayment(true);
    setSending(true);
    setQrPayment(null);

    try {
      const orderRes = await fetch(`${API}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(appliedCoupon ? { couponCode: appliedCoupon.code } : {}),
      });
      if (!orderRes.ok) {
        const d = await orderRes.json();
        toast.error(d.message || "Không thể tạo đơn hàng");
        setShowPayment(false);
        setSending(false);
        return;
      }
      const order = await orderRes.json();

      const qrRes = await fetch(`${API}/payments/qr`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orderId: order.id }),
      });
      if (!qrRes.ok) {
        toast.error("Không thể tạo mã QR. Vui lòng thử lại.");
        setShowPayment(false);
        setSending(false);
        return;
      }
      const qrData = await qrRes.json();
      await Promise.all(
        (order.items || [])
          .map((item: any) => item.courseId)
          .filter(Boolean)
          .map((courseId: string) =>
            fetch(`${API}/enrollments/pending`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({ courseId }),
            }).catch(() => null)
          )
      );
      setQrPayment({
        vietQrUrl: qrData.vietQrUrl,
        txnRef: qrData.txnRef,
        addInfo: qrData.addInfo,
        amount: Number(qrData.amount),
      });
      setItems([]);
    } catch {
      toast.error("Lỗi tạo đơn hàng");
      setShowPayment(false);
    } finally {
      setSending(false);
    }
  }

  function handleConfirmSent() {
    setPaymentSent(true);
    toast.success("Đã gửi mã QR đến phụ huynh!");
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--background)" }}>
      <Navbar />
      
      <section className="bg-[#f7f9fa] dark:bg-[#2d2f31] pt-24 pb-8 border-b border-gray-700">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
           <h1 className="text-4xl font-bold">Giỏ hàng của bạn</h1>
        </div>
      </section>

      <section className="flex-1 py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
           
           <p className="font-bold text-lg mb-4">{items.length} Khóa học trong giỏ hàng</p>

          {/* No parent warning */}
          {hasParent !== true && user?.role === "student" && items.length > 0 && (
            <div className="border border-yellow-500/50 bg-yellow-500/10 rounded-lg p-4 mb-6 flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 shrink-0 text-yellow-500" />
              <div className="flex-1">
                <p className="font-bold text-yellow-500 mb-1">Cần liên kết phụ huynh</p>
                <p className="text-sm text-foreground-muted">Tài khoản học sinh không thể tự thanh toán trực tiếp. Vui lòng liên kết với phụ huynh để gửi hóa đơn.</p>
              </div>
              <Link href="/dashboard" className="px-4 py-2 border border-border bg-card text-sm font-bold hover:bg-muted transition-colors rounded">
                Liên kết ngay
              </Link>
            </div>
          )}

          {cartLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : items.length === 0 ? (
            <div className="text-center py-20 border border-border rounded-lg bg-card shadow-sm">
               <div className="w-32 h-32 mx-auto bg-muted rounded-full flex items-center justify-center mb-6">
                  <ShoppingCart className="w-12 h-12 text-foreground-muted" />
               </div>
               <p className="text-foreground-muted mb-6">Giỏ hàng của bạn đang trống. Hãy tiếp tục mua sắm để tìm một khóa học!</p>
               <Link href="/courses" className="btn-primary px-8 py-3">Tiếp tục mua sắm</Link>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-8 items-start">
              <div className="lg:col-span-2 space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex flex-col sm:flex-row gap-4 p-4 border border-border rounded-lg bg-card shadow-sm">
                    <div className="w-full sm:w-32 aspect-video bg-muted relative shrink-0 border border-border flex items-center justify-center">
                       <PlayCircle className="w-8 h-8 text-primary/50" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/courses/${item.courseId}`}>
                         <h3 className="font-bold line-clamp-2 hover:text-primary transition-colors">{item.course?.title}</h3>
                      </Link>
                      <p className="text-xs text-foreground-muted mt-1">{item.course?.author?.firstName || item.course?.author?.username || "Giáo viên"}</p>
                      <div className="mt-2 text-xs flex items-center gap-2 text-foreground-muted">
                         <span className="bg-muted px-2 py-1 rounded">Tất cả trình độ</span>
                         {item.course?.allowPlatformPromotions === false && (
                           <span className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-2 py-1 rounded">
                             Không áp dụng mã giảm giá
                           </span>
                         )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end justify-between sm:w-28 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-border">
                      <p className="font-bold text-lg text-primary">{(item.course?.price || 0).toLocaleString()} ₫</p>
                      <button onClick={() => removeItem(item.id)} className="text-sm text-foreground hover:text-red-500 transition-colors mt-2 font-bold">Xóa</button>
                    </div>
                  </div>
                ))}
                
                <button onClick={clearCart} className="text-sm font-bold text-foreground-muted hover:text-red-500 transition-colors">Xóa toàn bộ giỏ hàng</button>
              </div>

              {/* Summary */}
              <div className="p-6 border border-border rounded-lg bg-card shadow-sm sticky top-24">
                <p className="text-foreground-muted font-bold mb-2">Tổng cộng:</p>
                <p className="text-4xl font-extrabold mb-4">{finalTotal.toLocaleString()} ₫</p>
                {appliedCoupon && (
                   <p className="text-sm line-through text-foreground-muted mb-2">{total.toLocaleString()} ₫</p>
                )}
                
                {appliedCoupon && (
                   <div className="mb-4 text-sm bg-green-500/10 text-green-500 p-2 border border-green-500/20 rounded flex items-center justify-between">
                      <span className="font-bold">Giảm {appliedCoupon.discount}% (tiết kiệm {appliedCoupon.savings.toLocaleString()} ₫)</span>
                      <button onClick={removeCoupon}><X className="w-4 h-4 hover:text-green-700" /></button>
                   </div>
                )}

                <button onClick={handleCheckout} className="w-full bg-primary text-white font-bold py-4 hover:bg-primary/90 transition-colors mb-4 flex justify-center items-center gap-2">
                  Thanh toán <ArrowRight className="w-5 h-5" />
                </button>

                <hr className="border-border my-6" />

                <p className="font-bold mb-2">Mã giảm giá</p>
                {hasCouponUnsupportedItems && (
                  <div className="mb-4 rounded border border-yellow-500/30 bg-yellow-500/10 p-3">
                    <p className="text-xs font-bold text-yellow-500 mb-2 flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" />
                      Không thể áp dụng mã giảm giá cho giỏ hàng hiện tại
                    </p>
                    <p className="text-xs text-foreground-muted mb-2">
                      Các khóa học sau không nhận mã giảm giá:
                    </p>
                    <ul className="space-y-1">
                      {couponUnsupportedItems.map((item) => (
                        <li key={item.id} className="text-xs font-semibold text-foreground">
                          • {item.course?.title || "Khóa học"}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {!appliedCoupon ? (
                   <div className="flex gap-2 mb-4">
                     <input
                       value={coupon}
                       onChange={(e) => setCoupon(e.target.value)}
                       placeholder="Nhập mã giảm giá"
                       disabled={hasCouponUnsupportedItems}
                       className="w-full px-3 py-2 border border-border bg-background focus:outline-none focus:border-primary text-sm disabled:opacity-60"
                     />
                     <button
                       onClick={() => applyCoupon()}
                       disabled={hasCouponUnsupportedItems}
                       className="px-4 py-2 bg-foreground text-background font-bold hover:bg-foreground/90 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                     >
                       Áp dụng
                     </button>
                   </div>
                ) : (
                   <p className="text-sm text-foreground-muted mb-4 italic">Đã áp dụng mã: <strong>{appliedCoupon.code}</strong></p>
                )}

                {myCoupons.length > 0 && !appliedCoupon && (
                  <div className="mt-4">
                    <p className="text-xs font-bold text-yellow-500 mb-2 flex items-center gap-1"><Gift className="w-4 h-4" /> Voucher có sẵn</p>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                      {myCoupons.map(c => (
                        <div key={c.id} className="border border-border border-dashed p-3 bg-muted/50 cursor-pointer hover:bg-muted transition-colors flex justify-between items-center group" onClick={() => applyCoupon(c.code)}>
                           <div>
                              <p className="font-bold text-sm text-primary">{c.code}</p>
                              <p className="text-xs text-foreground-muted">Giảm {c.discount}%</p>
                           </div>
                           <span className="text-xs font-bold text-foreground opacity-0 group-hover:opacity-100 transition-opacity">Sử dụng</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}
        </div>
      </section>

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
          <div className="card-base w-full max-w-md animate-scale-in" style={{ background: "var(--popover)" }}>
            {!paymentSent ? (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-extrabold flex items-center gap-2"><QrCode className="w-5 h-5" style={{ color: "#F8B486" }} /> Thanh toán</h2>
                  <button onClick={() => setShowPayment(false)} className="btn-ghost px-2 py-2"><X className="w-5 h-5" /></button>
                </div>

                {sending ? (
                  <div className="text-center py-12">
                    <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4" style={{ color: "#F8B486" }} />
                    <p className="text-sm font-semibold">Đang tạo đơn hàng & mã QR...</p>
                  </div>
                ) : qrPayment ? (
                  <div className="text-center mb-6">
                    <p className="text-sm mb-4" style={{ color: "#6a6f73" }}>Quét mã QR bên dưới để thanh toán</p>
                    <div className="w-56 h-56 mx-auto rounded-2xl flex items-center justify-center mb-4" style={{ background: "white", border: "2px solid var(--border)" }}>
                      <img src={qrPayment.vietQrUrl} alt="VietQR Payment" className="w-52 h-52 object-contain" />
                    </div>
                    <p className="text-xs mb-1 font-mono px-3 py-2 rounded bg-muted border border-border inline-block">
                      Nội dung CK: <span className="font-bold">{qrPayment.addInfo}</span>
                    </p>
                    <div className="flex justify-between px-4 py-3 rounded text-sm mt-4 bg-muted">
                      <span className="text-foreground-muted font-bold">Số tiền</span>
                      <span className="font-bold text-primary">{qrPayment.amount.toLocaleString()} ₫</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm" style={{ color: "#F8B486" }}>Không thể tạo mã QR. Vui lòng đóng và thử lại.</p>
                  </div>
                )}

                {qrPayment && !sending && (
                  <button onClick={handleConfirmSent} className="btn-primary w-full justify-center py-3">
                    <Send className="w-4 h-4" /> Gửi cho phụ huynh thanh toán
                  </button>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <CheckCircle2 className="w-16 h-16 mx-auto text-green-500 mb-4" />
                <h2 className="text-xl font-bold mb-2">Đã gửi thành công!</h2>
                <p className="text-sm text-foreground-muted mb-6">Phụ huynh thanh toán xong hệ thống sẽ duyệt tự động.</p>
                <button onClick={() => { setShowPayment(false); setPaymentSent(false); router.push("/dashboard"); }} className="btn-secondary w-full justify-center">
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
