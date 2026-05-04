"use client";

import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Package, ChevronRight, CheckCircle2, Clock, XCircle } from "lucide-react";

const orders = [
  { id: "ORD-001", date: "2026-05-01", total: 199000, status: "completed", items: ["Vật lý nâng cao — Lớp 8"] },
  { id: "ORD-002", date: "2026-04-28", total: 149000, status: "pending", items: ["Hóa học vui — Lớp 9"] },
  { id: "ORD-003", date: "2026-04-20", total: 0, status: "completed", items: ["Toán học cơ bản — Lớp 6"] },
];

const statusMap: Record<string, { label: string; color: string; icon: any }> = {
  completed: { label: "Hoàn thành", color: "#10b981", icon: CheckCircle2 },
  pending: { label: "Chờ xử lý", color: "#f59e0b", icon: Clock },
  cancelled: { label: "Đã hủy", color: "#ef4444", icon: XCircle },
};

export default function OrdersPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <Navbar />
      <div className="pt-20 pb-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-extrabold mb-6 flex items-center gap-2">
            <Package className="w-6 h-6" style={{ color: "#7c3aed" }} /> Đơn hàng của tôi
          </h1>
          <div className="space-y-3">
            {orders.map((order) => {
              const st = statusMap[order.status];
              const Icon = st.icon;
              return (
                <div key={order.id} className="card-base card-hover">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-bold" style={{ color: "#a78bfa" }}>{order.id}</span>
                      <span className="text-xs" style={{ color: "#8892a4" }}>{order.date}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Icon className="w-4 h-4" style={{ color: st.color }} />
                      <span className="text-xs font-semibold" style={{ color: st.color }}>{st.label}</span>
                    </div>
                  </div>
                  {order.items.map((item) => (
                    <p key={item} className="text-sm" style={{ color: "#8892a4" }}>• {item}</p>
                  ))}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                    <span className="font-bold">{order.total === 0 ? "Miễn phí" : `${(order.total / 1000).toFixed(0)}k ₫`}</span>
                    <ChevronRight className="w-4 h-4" style={{ color: "#8892a4" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
