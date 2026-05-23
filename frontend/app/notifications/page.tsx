"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/components/auth/auth-state";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  CheckCircle2,
  Clock,
  Gift,
  Inbox,
  Info,
  Loader2,
  MailCheck,
  MailOpen,
  Trash2,
  XCircle,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

const typeConfig: Record<string, { icon: any; color: string; bg: string; border: string; label: string }> = {
  success: { icon: CheckCircle2, color: "#15803d", bg: "#dcfce7", border: "#86efac", label: "Thành công" },
  info: { icon: Info, color: "#0369a1", bg: "#e0f2fe", border: "#7dd3fc", label: "Thông tin" },
  warning: { icon: AlertTriangle, color: "#92400e", bg: "#fef3c7", border: "#fcd34d", label: "Cảnh báo" },
  error: { icon: XCircle, color: "#b91c1c", bg: "#fee2e2", border: "#fca5a5", label: "Lỗi" },
  achievement: { icon: Zap, color: "#7c3aed", bg: "#ede9fe", border: "#c4b5fd", label: "Thành tích" },
  reward: { icon: Gift, color: "#be185d", bg: "#fce7f3", border: "#f9a8d4", label: "Phần thưởng" },
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
      <Loader2 className="w-8 h-8 animate-spin text-[#FFCCAA]" />
    </div>
  );

  const unread = notifications.filter(n => !n.isRead);
  const displayed = filter === "unread" ? unread : notifications;
  const readCount = Math.max(notifications.length - unread.length, 0);

  return (
    <div className="min-h-screen bg-[#f7f9fa] dark:bg-[#051025]">
      <Navbar />

      <section className="border-b border-border bg-white pt-[70px] dark:bg-[#07152e]">
        <div className="mx-auto max-w-[1100px] px-4 py-7 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-xs font-bold text-foreground-muted">
                <Bell className="h-3.5 w-3.5 text-primary" />
                Trung tâm thông báo
              </div>
              <h1 className="text-2xl font-extrabold text-foreground sm:text-3xl">Thông báo của bạn</h1>
              <p className="mt-2 text-sm text-foreground-muted">
                Theo dõi cập nhật khóa học, thanh toán, thành tích và các nhắc nhở quan trọng.
              </p>
            </div>
            {unread.length > 0 && (
              <button onClick={markAllRead} className="btn-secondary w-full justify-center px-4 py-2.5 sm:w-auto">
                <MailCheck className="h-4 w-4" />
                Đánh dấu tất cả đã đọc
              </button>
            )}
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs font-bold uppercase text-foreground-muted">Tổng thông báo</p>
              <p className="mt-2 text-2xl font-extrabold text-foreground">{notifications.length}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs font-bold uppercase text-foreground-muted">Chưa đọc</p>
              <p className="mt-2 text-2xl font-extrabold text-primary">{unread.length}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs font-bold uppercase text-foreground-muted">Đã xử lý</p>
              <p className="mt-2 text-2xl font-extrabold text-foreground">{readCount}</p>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-[1100px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-4 flex flex-col gap-3 rounded-lg border border-border bg-card p-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="grid grid-cols-2 gap-1">
            {[{ id: "all", label: "Tất cả", count: notifications.length, icon: Inbox }, { id: "unread", label: "Chưa đọc", count: unread.length, icon: MailOpen }].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id as "all" | "unread")}
                  className={`flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-bold transition-colors ${filter === tab.id ? "bg-primary text-primary-foreground" : "text-foreground-muted hover:bg-muted hover:text-foreground"}`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${filter === tab.id ? "bg-white/20" : "bg-muted"}`}>{tab.count}</span>
                </button>
              );
            })}
          </div>
          <p className="px-2 text-xs text-foreground-muted sm:text-right">
            {displayed.length === 0 ? "Không có mục nào" : `Đang hiển thị ${displayed.length} mục`}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center rounded-lg border border-border bg-card py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : displayed.length === 0 ? (
          <div className="rounded-lg border border-border bg-card px-6 py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Bell className="w-8 h-8 text-foreground-muted" />
            </div>
            <h3 className="mb-1 font-bold text-foreground">
              {filter === "unread" ? "Không có thông báo chưa đọc" : "Chưa có thông báo"}
            </h3>
            <p className="text-sm text-foreground-muted">
              {filter === "unread" ? "Bạn đã đọc hết tất cả thông báo" : "Bạn sẽ nhận thông báo khi có cập nhật mới"}
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border bg-card">
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
                  className={`group cursor-pointer border-b border-border transition-colors last:border-b-0 hover:bg-muted/60 ${isUnread ? "bg-primary/5" : "bg-card"}`}
                >
                  <div className="flex items-start gap-3 p-4 sm:gap-4 sm:p-5">
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg border" style={{ background: cfg.bg, borderColor: cfg.border }}>
                      <Icon className="w-5 h-5" style={{ color: cfg.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="mb-1 flex flex-wrap items-center gap-2">
                            <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: cfg.bg, color: cfg.color }}>
                              {cfg.label}
                            </span>
                            {isUnread && <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">Mới</span>}
                          </div>
                          <p className={`break-words text-sm ${isUnread ? "font-extrabold text-foreground" : "font-semibold text-foreground"}`}>{n.title}</p>
                          <p className="mt-1 line-clamp-2 break-words text-sm leading-6 text-foreground-muted">{displayMessage}</p>
                        </div>
                        <div className="flex flex-shrink-0 items-center gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                            className="rounded-md p-2 text-foreground-muted transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
                            aria-label="Xóa thông báo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-foreground-muted">
                        <p className="inline-flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          {new Date(n.createdAt).toLocaleDateString("vi-VN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </p>
                        {notifLink && (
                          <span className="inline-flex items-center gap-1 font-bold text-primary">
                            Xem chi tiết <ArrowRight className="h-3.5 w-3.5" />
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
            <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-6 py-2.5 text-sm font-bold text-foreground transition-colors hover:bg-muted">
              <Clock className="w-4 h-4" /> Tải thêm
            </button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
