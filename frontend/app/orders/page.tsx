"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/components/auth/auth-state";
import { Package, ChevronRight, CheckCircle2, Clock, XCircle, Loader2 } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

const statusMap: Record<string, { label: string; color: string; icon: any }> = {
  completed: { label: "Hoàn thành", color: "#10b981", icon: CheckCircle2 },
  paid: { label: "Đã thanh toán", color: "#10b981", icon: CheckCircle2 },
  pending: { label: "Chờ xử lý", color: "#f59e0b", icon: Clock },
  cancelled: { label: "Đã hủy", color: "#ef4444", icon: XCircle },
};

export default function OrdersPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) fetchOrders();
  }, [token]);

  async function fetchOrders() {
    try {
      const res = await fetch(`${API}/orders/me`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setOrders(Array.isArray(data) ? data : []);
      }
    } catch {} finally { setLoading(false); }
  }

  async function viewOrder(id: string) {
    try {
      const res = await fetch(`${API}/orders/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setSelectedOrder(await res.json());
    } catch {}
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <Navbar />
      <div className="pt-20 pb-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-extrabold mb-6 flex items-center gap-2">
            <Package className="w-6 h-6" style={{ color: "#7c3aed" }} /> Đơn hàng của tôi
          </h1>

          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin" style={{ color: "#7c3aed" }} /></div>
          ) : orders.length === 0 ? (
            <div className="card-base text-center py-16">
              <Package className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--foreground-muted)" }} />
              <h3 className="font-bold mb-2">Chưa có đơn hàng</h3>
              <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>Đơn hàng của bạn sẽ hiện ở đây</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => {
                const st = statusMap[order.status] || statusMap.pending;
                const Icon = st.icon;
                return (
                  <div key={order.id} className="card-base card-hover cursor-pointer" onClick={() => viewOrder(order.id)}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-bold" style={{ color: "#a78bfa" }}>{order.id.substring(0, 8)}</span>
                        <span className="text-xs" style={{ color: "var(--foreground-muted)" }}>{new Date(order.createdAt).toLocaleDateString("vi-VN")}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Icon className="w-4 h-4" style={{ color: st.color }} />
                        <span className="text-xs font-semibold" style={{ color: st.color }}>{st.label}</span>
                      </div>
                    </div>
                    {order.items?.map((item: any) => (
                      <p key={item.id} className="text-sm" style={{ color: "var(--foreground-muted)" }}>• {item.course?.title || "Khóa học"}</p>
                    ))}
                    <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                      <span className="font-bold">{(order.finalPrice || order.totalPrice || 0) === 0 ? "Miễn phí" : `${(order.finalPrice || order.totalPrice).toLocaleString()} ₫`}</span>
                      <ChevronRight className="w-4 h-4" style={{ color: "var(--foreground-muted)" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
