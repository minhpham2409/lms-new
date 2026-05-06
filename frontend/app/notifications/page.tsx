"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/components/auth/auth-state";
import { Bell, CheckCircle2, BookOpen, Award, MessageCircle, Clock, Info, Loader2 } from "lucide-react";
import { toast } from "sonner";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

const typeConfig: Record<string, { icon: any; color: string }> = {
  success: { icon: CheckCircle2, color: "#10b981" },
  info: { icon: Info, color: "#3b82f6" },
  warning: { icon: Clock, color: "#f59e0b" },
  error: { icon: Bell, color: "#ef4444" },
};

export default function NotificationsPage() {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) fetchNotifications();
  }, [token]);

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
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      toast.success("Đã đánh dấu tất cả đã đọc");
    } catch {}
  }

  async function markRead(id: string) {
    try {
      await fetch(`${API}/notifications/${id}/read`, { method: "PUT", headers: { Authorization: `Bearer ${token}` } });
      setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch {}
  }

  async function deleteNotification(id: string) {
    try {
      await fetch(`${API}/notifications/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      setNotifications(notifications.filter(n => n.id !== id));
      toast.success("Đã xóa");
    } catch {}
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <Navbar />
      <div className="pt-20 pb-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-extrabold flex items-center gap-2">
              <Bell className="w-6 h-6" style={{ color: "#7c3aed" }} /> Thông báo
              {notifications.filter(n => !n.isRead).length > 0 && (
                <span className="text-sm font-normal ml-2 px-2 py-0.5 rounded-full" style={{ background: "rgba(124,58,237,0.15)", color: "#a78bfa" }}>
                  {notifications.filter(n => !n.isRead).length} mới
                </span>
              )}
            </h1>
            {notifications.some(n => !n.isRead) && (
              <button onClick={markAllRead} className="text-sm" style={{ color: "#a78bfa" }}>Đánh dấu tất cả đã đọc</button>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin" style={{ color: "#7c3aed" }} /></div>
          ) : notifications.length === 0 ? (
            <div className="card-base text-center py-16">
              <Bell className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--foreground-muted)" }} />
              <h3 className="font-bold mb-2">Không có thông báo</h3>
              <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>Bạn sẽ nhận thông báo khi có cập nhật mới</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((n) => {
                const cfg = typeConfig[n.type] || typeConfig.info;
                const Icon = cfg.icon;
                return (
                  <div key={n.id} onClick={() => !n.isRead && markRead(n.id)}
                    className="card-base flex items-start gap-4 cursor-pointer transition-all hover:border-[rgba(124,58,237,0.3)]"
                    style={{ borderLeft: n.isRead ? undefined : `3px solid ${cfg.color}`, background: n.isRead ? undefined : "rgba(124,58,237,0.05)" }}>
                    <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background: `${cfg.color}22` }}>
                      <Icon className="w-5 h-5" style={{ color: cfg.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold">{n.title}</h3>
                      <p className="text-xs mt-1" style={{ color: "var(--foreground-muted)" }}>{n.message}</p>
                      <p className="text-xs mt-2" style={{ color: "var(--foreground-muted)" }}>
                        {new Date(n.createdAt).toLocaleDateString("vi-VN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 flex-shrink-0">
                      {!n.isRead && <div className="w-2 h-2 rounded-full" style={{ background: cfg.color }} />}
                      <button onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }} className="text-xs mt-1" style={{ color: "#ef4444" }}>✕</button>
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
