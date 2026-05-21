"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/components/auth/auth-state";
import { Package, ChevronRight, CheckCircle2, Clock, XCircle, Loader2, ShoppingBag, ArrowRight } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

const statusMap: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  completed: { label: "Hoàn thành", color: "#15803d", bg: "#dcfce7", icon: CheckCircle2 },
  paid: { label: "Đã thanh toán", color: "#15803d", bg: "#dcfce7", icon: CheckCircle2 },
  pending: { label: "Chờ thanh toán", color: "#92400e", bg: "#fef3c7", icon: Clock },
  cancelled: { label: "Đã hủy", color: "#b91c1c", bg: "#fee2e2", icon: XCircle },
};

export default function OrdersPage() {
  const router = useRouter();
  const { token, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !token) router.push("/auth/login");
    else if (token) fetchOrders();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, authLoading]);

  async function fetchOrders() {
    try {
      const res = await fetch(`${API}/orders/me`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setOrders(Array.isArray(data) ? data : []);
      }
    } catch {} finally { setLoading(false); }
  }

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#1c1d1f]">
      <Loader2 className="w-8 h-8 animate-spin text-[#FFCCAA]" />
    </div>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-[#1c1d1f]">
      <Navbar />

      {/* Header */}
      <div className="border-b border-[#d1d7dc] dark:border-[#3e4143] pt-[70px]">
        <div className="max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold text-[#2d2f31] dark:text-white flex items-center gap-2.5">
            <Package className="w-6 h-6 text-[#F8B486]" /> Lịch sử đơn hàng
          </h1>
          <p className="text-sm text-[#6a6f73] mt-1">Xem lại các khóa học bạn đã mua</p>
        </div>
      </div>

      <div className="max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#FFCCAA]" />
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white dark:bg-[#2d2f31] border border-[#d1d7dc] dark:border-[#3e4143] rounded p-16 text-center">
            <div className="w-16 h-16 bg-[#f7f9fa] dark:bg-[#3e4143] rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-8 h-8 text-[#6a6f73]" />
            </div>
            <h3 className="text-lg font-bold text-[#2d2f31] dark:text-white mb-2">Chưa có đơn hàng nào</h3>
            <p className="text-sm text-[#6a6f73] mb-6">Hãy khám phá và đăng ký các khóa học hấp dẫn</p>
            <Link href="/courses" className="inline-flex items-center gap-2 px-6 py-3 bg-[#FFCCAA] hover:bg-[#8710d8] text-white font-bold text-sm transition-colors rounded">
              Khám phá khóa học <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const st = statusMap[order.status] || statusMap.pending;
              const Icon = st.icon;
              const total = order.finalPrice || order.totalPrice || 0;
              return (
                <div key={order.id} className="bg-white dark:bg-[#2d2f31] border border-[#d1d7dc] dark:border-[#3e4143] rounded hover:shadow-sm transition-shadow">
                  {/* Order header */}
                  <div className="flex items-center justify-between px-5 py-4 border-b border-[#d1d7dc] dark:border-[#3e4143]">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-xs text-[#6a6f73] mb-0.5">Mã đơn hàng</p>
                        <p className="font-mono text-sm font-bold text-[#2d2f31] dark:text-white">{order.id.substring(0, 8).toUpperCase()}</p>
                      </div>
                      <div className="hidden sm:block">
                        <p className="text-xs text-[#6a6f73] mb-0.5">Ngày đặt</p>
                        <p className="text-sm text-[#2d2f31] dark:text-white">{new Date(order.createdAt).toLocaleDateString("vi-VN", { day: "2-digit", month: "long", year: "numeric" })}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold" style={{ background: st.bg, color: st.color }}>
                        <Icon className="w-3.5 h-3.5" /> {st.label}
                      </span>
                    </div>
                  </div>

                  {/* Order items */}
                  <div className="px-5 py-4">
                    {order.items?.map((item: any) => (
                      <div key={item.id} className="flex items-center gap-3 py-2">
                        <div className="w-12 h-9 bg-[#f7f9fa] dark:bg-[#3e4143] rounded flex-shrink-0 flex items-center justify-center">
                          <Package className="w-4 h-4 text-[#6a6f73]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#2d2f31] dark:text-white truncate">
                            {item.course?.title || "Khóa học"}
                          </p>
                          <p className="text-xs text-[#6a6f73]">{item.price === 0 ? "Miễn phí" : `${Number(item.price).toLocaleString("vi-VN")} ₫`}</p>
                        </div>
                        {item.course && (
                          <Link href={`/courses/${item.courseId || item.course?.id}`} className="flex-shrink-0 text-xs font-bold text-[#F8B486] dark:text-[#c0a5f7] hover:underline flex items-center gap-1">
                            Xem khóa học <ChevronRight className="w-3 h-3" />
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Order footer */}
                  <div className="flex items-center justify-between px-5 py-3 bg-[#f7f9fa] dark:bg-[#1c1d1f] rounded-b border-t border-[#d1d7dc] dark:border-[#3e4143]">
                    <span className="text-xs text-[#6a6f73]">{order.items?.length || 0} khóa học</span>
                    <div className="text-right">
                      <p className="text-xs text-[#6a6f73]">Tổng thanh toán</p>
                      <p className="text-base font-bold text-[#2d2f31] dark:text-white">
                        {total === 0 ? "Miễn phí" : `${Number(total).toLocaleString("vi-VN")} ₫`}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
