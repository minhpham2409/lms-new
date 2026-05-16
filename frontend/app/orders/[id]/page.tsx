"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/components/auth/auth-state";
import {
  ArrowLeft, Package, CheckCircle2, BookOpen, Calendar,
  CreditCard, FileText, Loader2, XCircle, Clock, AlertTriangle,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "Chờ thanh toán", color: "#f59e0b", icon: Clock },
  paid: { label: "Đã thanh toán", color: "#10b981", icon: CheckCircle2 },
  failed: { label: "Thất bại", color: "#ef4444", icon: XCircle },
  cancelled: { label: "Đã hủy", color: "#6b7280", icon: XCircle },
};

const PAYMENT_STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: "Chờ xử lý", color: "#f59e0b" },
  completed: { label: "Hoàn thành", color: "#10b981" },
  failed: { label: "Thất bại", color: "#ef4444" },
};

export default function OrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { token, loading: authLoading } = useAuth();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading || !token) return;
    fetchOrder();
  }, [token, authLoading]);

  async function fetchOrder() {
    try {
      const res = await fetch(`${API}/orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setError("Không tìm thấy đơn hàng");
        return;
      }
      setOrder(await res.json());
    } catch {
      setError("Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#7c3aed" }} />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen" style={{ background: "var(--background)" }}>
        <Navbar />
        <div className="pt-20 pb-24 max-w-3xl mx-auto px-4 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4" style={{ color: "#f59e0b" }} />
          <h2 className="text-xl font-bold mb-2">{error || "Không tìm thấy đơn hàng"}</h2>
          <Link href="/orders" className="btn-secondary inline-flex mt-4">
            <ArrowLeft className="w-4 h-4" /> Quay lại
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const statusInfo = STATUS_MAP[order.status] || STATUS_MAP.pending;
  const StatusIcon = statusInfo.icon;
  const paymentInfo = order.payment ? (PAYMENT_STATUS_MAP[order.payment.status] || PAYMENT_STATUS_MAP.pending) : null;

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <Navbar />
      <div className="pt-20 pb-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/orders" className="flex items-center gap-1 text-sm mb-6" style={{ color: "#8892a4" }}>
            <ArrowLeft className="w-4 h-4" /> Quay lại đơn hàng
          </Link>

          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-extrabold flex items-center gap-2">
              <Package className="w-6 h-6" style={{ color: "#7c3aed" }} />
              Đơn hàng <span className="font-mono text-sm" style={{ color: "#a78bfa" }}>#{(order.id as string).substring(0, 8)}</span>
            </h1>
            <span className="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"
              style={{ background: `${statusInfo.color}15`, color: statusInfo.color, border: `1px solid ${statusInfo.color}30` }}>
              <StatusIcon className="w-3.5 h-3.5" /> {statusInfo.label}
            </span>
          </div>

          {/* Order info */}
          <div className="card-base mb-6">
            <h3 className="font-bold mb-4">Thông tin đơn hàng</h3>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              {[
                { icon: Calendar, label: "Ngày đặt", value: new Date(order.createdAt).toLocaleString("vi-VN") },
                { icon: CreditCard, label: "Phương thức", value: "Chuyển khoản QR" },
                {
                  icon: CheckCircle2, label: "Thanh toán",
                  value: paymentInfo ? paymentInfo.label : "Chưa tạo",
                  color: paymentInfo?.color,
                },
                { icon: FileText, label: "Mã giao dịch", value: order.payment?.txnRef ? order.payment.txnRef.substring(0, 12) + "..." : "—" },
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} className="flex items-center gap-3">
                  <Icon className="w-4 h-4 flex-shrink-0" style={{ color: color || "#7c3aed" }} />
                  <div>
                    <p className="text-xs" style={{ color: "#8892a4" }}>{label}</p>
                    <p className="font-medium" style={color ? { color } : undefined}>{value}</p>
                  </div>
                </div>
              ))}
            </div>
            {order.payment?.paidAt && (
              <div className="mt-3 pt-3 text-xs" style={{ borderTop: "1px solid var(--border)", color: "var(--foreground-muted)" }}>
                Thanh toán lúc: {new Date(order.payment.paidAt).toLocaleString("vi-VN")}
              </div>
            )}
          </div>

          {/* Items */}
          <div className="card-base mb-6">
            <h3 className="font-bold mb-4">Khóa học đã mua ({order.items?.length || 0})</h3>
            <div className="space-y-3">
              {order.items?.map((item: any) => (
                <div key={item.id} className="flex items-center gap-4 p-4 rounded-xl" style={{ background: "var(--muted)" }}>
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(59,130,246,0.15)" }}>
                    {item.course?.thumbnail ? (
                      <img src={item.course.thumbnail} alt="" className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <BookOpen className="w-6 h-6" style={{ color: "#3b82f6" }} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm truncate">{item.course?.title || "Khóa học"}</h4>
                  </div>
                  <p className="font-bold text-sm flex-shrink-0" style={{ color: "#a78bfa" }}>
                    {Number(item.price).toLocaleString()} ₫
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="card-base">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between" style={{ color: "#8892a4" }}>
                <span>Tạm tính</span>
                <span>{Number(order.totalPrice).toLocaleString()} ₫</span>
              </div>
              {order.coupon && (
                <div className="flex justify-between" style={{ color: "#10b981" }}>
                  <span>Giảm giá ({order.coupon.code} - {order.coupon.discount}%)</span>
                  <span>-{(Number(order.totalPrice) - Number(order.finalPrice)).toLocaleString()} ₫</span>
                </div>
              )}
              {!order.coupon && (
                <div className="flex justify-between" style={{ color: "#8892a4" }}>
                  <span>Giảm giá</span><span>0 ₫</span>
                </div>
              )}
              <div className="divider" />
              <div className="flex justify-between font-bold text-base">
                <span>Tổng cộng</span>
                <span className="gradient-text">{Number(order.finalPrice).toLocaleString()} ₫</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
