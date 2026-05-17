"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/components/auth/auth-state";
import { Bell, CheckCircle2, Clock, Info, Loader2, Trash2, XCircle, Zap, Gift, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

const typeConfig: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  success: { icon: CheckCircle2, color: "#15803d", bg: "#dcfce7", label: "Thành công" },
  info: { icon: Info, color: "#0369a1", bg: "#e0f2fe", label: "Thông tin" },
  warning: { icon: AlertTriangle, color: "#92400e", bg: "#fef3c7", label: "Cảnh báo" },
  error: { icon: XCircle, color: "#b91c1c", bg: "#fee2e2", label: "Lỗi" },
  achievement: { icon: Zap, color: "#7c3aed", bg: "#ede9fe", label: "Thành tích" },
  reward: { icon: Gift, color: "#be185d", bg: "#fce7f3", label: "Phần thưởng" },
};

export default function NotificationsPage() {
  const router = useRouter();
  const { token, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    if (!authLoading && !token) router.push("/auth/login");
    else if (token) fetchNotifications();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, authLoading]);

  async function fetchNotifications() {
    try {
      const res = await fetch(`${API}/notifications`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setNotifications(Array.isArray(data) ? data : []);
      }
    } catch {} finally { setLoading(false); }
  }

  async function markAllRead() {
    try {
      await fetch(`${API}/notifications/read-all`, { method: "PUT", headers: { Authorization: `Bearer ${token}` } });
      setNotifications(n => n.map(item => ({ ...item, isRead: true })));
      toast.success("Đã đánh dấu tất cả là đã đọc");
    } catch {}
  }

  async function markRead(id: string) {
    try {
      await fetch(`${API}/notifications/${id}/read`, { method: "PUT", headers: { Authorization: `Bearer ${token}` } });
      setNotifications(n => n.map(item => item.id === id ? { ...item, isRead: true } : item));
    } catch {}
  }

  async function deleteNotification(id: string) {
    try {
      await fetch(`${API}/notifications/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      setNotifications(n => n.filter(item => item.id !== id));
      toast.success("Đã xóa thông báo");
    } catch {}
  }

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#1c1d1f]">
      <Loader2 className="w-8 h-8 animate-spin text-[#a435f0]" />
    </div>
  );

  const unread = notifications.filter(n => !n.isRead);
  const displayed = filter === "unread" ? unread : notifications;

  return (
    <div className="min-h-screen bg-white dark:bg-[#1c1d1f]">
      <Navbar />

      {/* Header */}
      <div className="border-b border-[#d1d7dc] dark:border-[#3e4143] pt-[70px]">
        <div className="max-w-[750px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#2d2f31] dark:text-white flex items-center gap-2.5">
                <Bell className="w-6 h-6 text-[#5624d0]" />
                Thông báo
                {unread.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-bold bg-[#a435f0] text-white">
                    {unread.length}
                  </span>
                )}
              </h1>
              <p className="text-sm text-[#6a6f73] mt-1">{notifications.length} thông báo · {unread.length} chưa đọc</p>
            </div>
            {unread.length > 0 && (
              <button onClick={markAllRead} className="text-sm font-bold text-[#5624d0] dark:text-[#c0a5f7] hover:underline">
                Đánh dấu tất cả đã đọc
              </button>
            )}
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1 mt-5">
            {[{ id: "all", label: `Tất cả (${notifications.length})` }, { id: "unread", label: `Chưa đọc (${unread.length})` }].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as "all" | "unread")}
                className={`px-4 py-2 text-sm font-medium rounded transition-colors ${filter === tab.id ? "bg-[#2d2f31] dark:bg-white text-white dark:text-[#2d2f31]" : "text-[#6a6f73] hover:text-[#2d2f31] dark:hover:text-white"}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-[750px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-[#a435f0]" />
          </div>
        ) : displayed.length === 0 ? (
          <div className="bg-white dark:bg-[#2d2f31] border border-[#d1d7dc] dark:border-[#3e4143] rounded p-16 text-center">
            <div className="w-16 h-16 bg-[#f7f9fa] dark:bg-[#3e4143] rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-[#6a6f73]" />
            </div>
            <h3 className="font-bold text-[#2d2f31] dark:text-white mb-1">
              {filter === "unread" ? "Không có thông báo chưa đọc" : "Chưa có thông báo"}
            </h3>
            <p className="text-sm text-[#6a6f73]">
              {filter === "unread" ? "Bạn đã đọc hết tất cả thông báo" : "Bạn sẽ nhận thông báo khi có cập nhật mới"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {displayed.map((n) => {
              const cfg = typeConfig[n.type] || typeConfig.info;
              const Icon = cfg.icon;
              const linkMatch = n.message?.match(/\[LINK:(\/[^\]]+)\]/);
              const notifLink = linkMatch?.[1] || null;
              const displayMessage = n.message?.replace(/\s*\[LINK:[^\]]+\]/, "") || "";
              const isUnread = !n.isRead;

              return (
                <div
                  key={n.id}
                  onClick={() => { if (isUnread) markRead(n.id); if (notifLink) window.location.href = notifLink; }}
                  className={`bg-white dark:bg-[#2d2f31] border rounded cursor-pointer transition-all hover:shadow-sm group ${isUnread ? "border-l-4 border-[#a435f0] border-y-[#d1d7dc] border-r-[#d1d7dc] dark:border-y-[#3e4143] dark:border-r-[#3e4143]" : "border-[#d1d7dc] dark:border-[#3e4143]"}`}
                  style={{ background: isUnread ? "rgba(164,53,240,0.02)" : undefined }}
                >
                  <div className="flex items-start gap-4 p-4">
                    <div className="w-10 h-10 rounded flex-shrink-0 flex items-center justify-center" style={{ background: cfg.bg }}>
                      <Icon className="w-5 h-5" style={{ color: cfg.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${isUnread ? "font-bold text-[#2d2f31] dark:text-white" : "font-medium text-[#2d2f31] dark:text-[#b0b5b9]"}`}>{n.title}</p>
                          <p className="text-xs text-[#6a6f73] mt-0.5 line-clamp-2">{displayMessage}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {isUnread && <div className="w-2 h-2 rounded-full bg-[#a435f0]" />}
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[#fee2e2] rounded transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-[#ef4444]" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <p className="text-[11px] text-[#6a6f73]">
                          {new Date(n.createdAt).toLocaleDateString("vi-VN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </p>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: cfg.bg, color: cfg.color }}>
                          {cfg.label}
                        </span>
                        {notifLink && (
                          <span className="text-[11px] font-bold text-[#5624d0] dark:text-[#c0a5f7]">
                            Xem chi tiết →
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Load more placeholder */}
        {displayed.length >= 20 && (
          <div className="text-center mt-6">
            <button className="inline-flex items-center gap-2 px-6 py-2.5 border border-[#d1d7dc] dark:border-[#6a6f73] text-[#2d2f31] dark:text-white font-bold text-sm hover:bg-[#f7f9fa] dark:hover:bg-[#3e4143] transition-colors rounded">
              <Clock className="w-4 h-4" /> Tải thêm
            </button>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
