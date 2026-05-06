"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/components/auth/auth-state";
import {
  Users, BookOpen, DollarSign, TrendingUp, Shield, BarChart3, Search,
  MoreVertical, Eye, Edit, Trash2, UserCheck, UserX, Plus, Download,
  Tag, Package, Filter, RefreshCw, ArrowUpRight, Activity, Globe,
  Calendar, CreditCard, CheckCircle2, Clock, XCircle, ChevronLeft, ChevronRight,
} from "lucide-react";

const users = [
  { id: 1, name: "Nguyễn Văn A", email: "a@email.com", role: "student", status: "active", date: "2026-05-01", courses: 3, spent: "348k" },
  { id: 2, name: "Trần Thị B", email: "b@email.com", role: "teacher", status: "active", date: "2026-04-28", courses: 5, spent: "0" },
  { id: 3, name: "Lê Văn C", email: "c@email.com", role: "student", status: "inactive", date: "2026-04-25", courses: 1, spent: "199k" },
  { id: 4, name: "Phạm Thị D", email: "d@email.com", role: "parent", status: "active", date: "2026-04-22", courses: 0, spent: "0" },
  { id: 5, name: "Hoàng Văn E", email: "e@email.com", role: "student", status: "active", date: "2026-04-20", courses: 2, spent: "149k" },
  { id: 6, name: "Ngô Thị F", email: "f@email.com", role: "teacher", status: "active", date: "2026-04-18", courses: 8, spent: "0" },
];

const courses = [
  { id: 1, title: "Toán học cơ bản — Lớp 6", author: "Thầy Minh", students: 1250, rating: 4.9, revenue: 0, status: "published", cat: "Toán" },
  { id: 2, title: "Vật lý nâng cao — Lớp 8", author: "Cô Hương", students: 870, rating: 4.8, revenue: 173130, status: "published", cat: "Lý" },
  { id: 3, title: "Tiếng Anh giao tiếp", author: "Thầy John", students: 2100, rating: 4.7, revenue: 0, status: "published", cat: "Anh văn" },
  { id: 4, title: "Hóa học vui — Lớp 9", author: "Cô Lan", students: 650, rating: 4.6, revenue: 96850, status: "published", cat: "Hóa" },
  { id: 5, title: "Toán nâng cao — Lớp 7", author: "Thầy Minh", students: 0, rating: 0, revenue: 0, status: "draft", cat: "Toán" },
];

const orders = [
  { id: "ORD-001", user: "Nguyễn Văn A", amount: 199000, status: "completed", date: "2026-05-01", method: "MoMo" },
  { id: "ORD-002", user: "Lê Văn C", amount: 149000, status: "pending", date: "2026-04-28", method: "Bank" },
  { id: "ORD-003", user: "Hoàng Văn E", amount: 199000, status: "completed", date: "2026-04-25", method: "ZaloPay" },
  { id: "ORD-004", user: "Nguyễn Văn A", amount: 149000, status: "refunded", date: "2026-04-20", method: "Bank" },
];

const coupons = [
  { id: 1, code: "WELCOME20", discount: "20%", used: 156, limit: 500, expires: "2026-06-30", status: "active" },
  { id: 2, code: "SUMMER50K", discount: "50k", used: 89, limit: 200, expires: "2026-07-15", status: "active" },
  { id: 3, code: "FREESHIP", discount: "Free", used: 300, limit: 300, expires: "2026-04-30", status: "expired" },
];

const roleColors: Record<string, string> = { student: "#7c3aed", teacher: "#0891b2", parent: "#f59e0b", admin: "#ef4444" };
const roleLabels: Record<string, string> = { student: "Học sinh", teacher: "Giáo viên", parent: "Phụ huynh", admin: "Admin" };
const statusIcons: Record<string, { color: string; Icon: any }> = {
  completed: { color: "#10b981", Icon: CheckCircle2 }, pending: { color: "#f59e0b", Icon: Clock },
  refunded: { color: "#ef4444", Icon: XCircle }, active: { color: "#10b981", Icon: CheckCircle2 },
  expired: { color: "#ef4444", Icon: XCircle },
};

type Tab = "overview" | "users" | "courses" | "orders" | "coupons";

export default function AdminPage() {
  const router = useRouter();
  const { user, isLoggedIn, loading } = useAuth();
  const [tab, setTab] = useState<Tab>("overview");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!isLoggedIn) {
      router.push("/auth/login");
      return;
    }
    if (user?.role !== "admin") {
      // Redirect non-admin to their dashboard
      if (user?.role === "teacher") router.push("/teacher");
      else if (user?.role === "parent") router.push("/parent");
      else router.push("/dashboard");
    }
  }, [user, isLoggedIn, loading, router]);

  if (loading || !user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
        <div className="w-8 h-8 border-2 border-[#ef4444] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "overview", label: "Tổng quan", icon: BarChart3 },
    { id: "users", label: "Người dùng", icon: Users },
    { id: "courses", label: "Khóa học", icon: BookOpen },
    { id: "orders", label: "Đơn hàng", icon: Package },
    { id: "coupons", label: "Mã giảm giá", icon: Tag },
  ];

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <Navbar />
      <div className="pt-20 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: "rgba(239,68,68,0.15)" }}>
                <Shield className="w-6 h-6" style={{ color: "#ef4444" }} />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold">Admin Panel</h1>
                <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>Quản lý toàn bộ hệ thống</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="btn-secondary text-sm"><Download className="w-4 h-4" /> Xuất báo cáo</button>
              <button className="btn-secondary text-sm"><RefreshCw className="w-4 h-4" /> Làm mới</button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1.5 mb-6 overflow-x-auto pb-1">
            {tabs.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap"
                style={{
                  background: tab === t.id ? "rgba(124,58,237,0.15)" : "var(--muted)",
                  border: `1px solid ${tab === t.id ? "rgba(124,58,237,0.3)" : "var(--border)"}`,
                  color: tab === t.id ? "#a78bfa" : "var(--foreground-muted)",
                }}>
                <t.icon className="w-4 h-4" /> {t.label}
              </button>
            ))}
          </div>

          {/* ========== OVERVIEW ========== */}
          {tab === "overview" && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[
                  { label: "Tổng người dùng", value: "10,234", icon: Users, color: "#7c3aed", change: "+12%", sub: "↑ 156 tuần này" },
                  { label: "Khóa học", value: "523", icon: BookOpen, color: "#0891b2", change: "+5%", sub: "4 đang chờ duyệt" },
                  { label: "Doanh thu tháng", value: "45.2M ₫", icon: DollarSign, color: "#10b981", change: "+18%", sub: "↑ 6.8M vs tháng trước" },
                  { label: "Truy cập hôm nay", value: "1,847", icon: Activity, color: "#f59e0b", change: "+8%", sub: "Peak: 14:00" },
                ].map(({ label, value, icon: Icon, color, change, sub }) => (
                  <div key={label} className="card-base">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
                        <Icon className="w-5 h-5" style={{ color }} />
                      </div>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(16,185,129,0.15)", color: "#10b981" }}>{change}</span>
                    </div>
                    <p className="text-2xl font-extrabold">{value}</p>
                    <p className="text-xs mt-1" style={{ color: "var(--foreground-muted)" }}>{label}</p>
                    <p className="text-[10px] mt-1" style={{ color: "var(--foreground-muted)" }}>{sub}</p>
                  </div>
                ))}
              </div>

              <div className="grid lg:grid-cols-2 gap-6 mb-6">
                {/* Chart */}
                <div className="card-base">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-sm flex items-center gap-2"><BarChart3 className="w-4 h-4" style={{ color: "#7c3aed" }} /> Người dùng mới (30 ngày)</h3>
                    <span className="text-xs" style={{ color: "var(--foreground-muted)" }}>Tổng: 1,234</span>
                  </div>
                  <div className="flex items-end gap-1 h-36">
                    {Array.from({ length: 30 }, (_, i) => {
                      const h = 20 + Math.sin(i * 0.3) * 30 + Math.random() * 30;
                      return <div key={i} className="flex-1 rounded-t transition-all hover:opacity-80" style={{ height: `${h}%`, background: i === 29 ? "linear-gradient(to top, #7c3aed, #0891b2)" : "rgba(124,58,237,0.2)", minHeight: 4 }} />;
                    })}
                  </div>
                </div>

                {/* Revenue chart */}
                <div className="card-base">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-sm flex items-center gap-2"><DollarSign className="w-4 h-4" style={{ color: "#10b981" }} /> Doanh thu (7 ngày)</h3>
                    <span className="text-xs" style={{ color: "var(--foreground-muted)" }}>Tổng: 12.5M ₫</span>
                  </div>
                  <div className="flex items-end gap-3 h-36">
                    {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((d, i) => {
                      const heights = [55, 72, 48, 85, 65, 35, 45];
                      return (
                        <div key={d} className="flex-1 flex flex-col items-center gap-1">
                          <div className="w-full rounded-lg" style={{ height: `${heights[i]}%`, background: `linear-gradient(to top, #10b981, #0891b2)`, opacity: i === 3 ? 1 : 0.6, minHeight: 8 }} />
                          <span className="text-[10px]" style={{ color: "var(--foreground-muted)" }}>{d}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Quick stats row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Tỷ lệ hoàn thành", value: "73%", color: "#10b981" },
                  { label: "Đánh giá trung bình", value: "4.7 ⭐", color: "#f59e0b" },
                  { label: "Tỷ lệ giữ chân", value: "89%", color: "#7c3aed" },
                  { label: "Hỗ trợ chờ xử lý", value: "12", color: "#ef4444" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="card-base text-center">
                    <p className="text-xl font-extrabold" style={{ color }}>{value}</p>
                    <p className="text-xs mt-1" style={{ color: "var(--foreground-muted)" }}>{label}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ========== USERS ========== */}
          {tab === "users" && (
            <div className="card-base overflow-hidden">
              <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3" style={{ borderBottom: "1px solid var(--border)" }}>
                <h2 className="font-bold">Quản lý người dùng <span className="text-xs font-normal" style={{ color: "var(--foreground-muted)" }}>({users.length} người)</span></h2>
                <div className="flex gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-56">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--foreground-muted)" }} />
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm kiếm..." className="input-base pl-9 py-2 text-sm" />
                  </div>
                  <button className="btn-primary text-sm px-4 py-2"><Plus className="w-4 h-4" /> Thêm</button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr style={{ borderBottom: "1px solid var(--border)" }}>
                    {["Tên", "Email", "Vai trò", "Trạng thái", "Khóa học", "Chi tiêu", "Ngày tham gia", ""].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: "var(--foreground-muted)" }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {users.filter((u) => !search || u.name.toLowerCase().includes(search.toLowerCase())).map((u) => (
                      <tr key={u.id} className="transition-colors hover:bg-[var(--muted)]" style={{ borderBottom: "1px solid var(--border)" }}>
                        <td className="px-4 py-3.5 font-semibold">{u.name}</td>
                        <td className="px-4 py-3.5" style={{ color: "var(--foreground-muted)" }}>{u.email}</td>
                        <td className="px-4 py-3.5"><span className="badge" style={{ background: `${roleColors[u.role]}18`, color: roleColors[u.role], border: `1px solid ${roleColors[u.role]}33` }}>{roleLabels[u.role]}</span></td>
                        <td className="px-4 py-3.5">
                          <span className="flex items-center gap-1 text-xs">
                            {u.status === "active" ? <UserCheck className="w-3 h-3" style={{ color: "#10b981" }} /> : <UserX className="w-3 h-3" style={{ color: "#ef4444" }} />}
                            <span style={{ color: u.status === "active" ? "#10b981" : "#ef4444" }}>{u.status === "active" ? "Active" : "Inactive"}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3.5" style={{ color: "var(--foreground-muted)" }}>{u.courses}</td>
                        <td className="px-4 py-3.5" style={{ color: "var(--foreground-muted)" }}>{u.spent} ₫</td>
                        <td className="px-4 py-3.5" style={{ color: "var(--foreground-muted)" }}>{u.date}</td>
                        <td className="px-4 py-3.5"><div className="flex gap-1">
                          <button className="btn-ghost px-2 py-1"><Eye className="w-3.5 h-3.5" /></button>
                          <button className="btn-ghost px-2 py-1"><Edit className="w-3.5 h-3.5" /></button>
                          <button className="btn-ghost px-2 py-1"><Trash2 className="w-3.5 h-3.5" style={{ color: "#ef4444" }} /></button>
                        </div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 flex items-center justify-between" style={{ borderTop: "1px solid var(--border)" }}>
                <span className="text-xs" style={{ color: "var(--foreground-muted)" }}>Hiển thị 1-6 / 10,234</span>
                <div className="flex gap-1">
                  <button className="btn-ghost px-2 py-1"><ChevronLeft className="w-4 h-4" /></button>
                  {[1, 2, 3].map((p) => <button key={p} className="px-3 py-1 rounded-lg text-xs font-medium" style={{ background: p === 1 ? "rgba(124,58,237,0.2)" : "transparent", color: p === 1 ? "#a78bfa" : "var(--foreground-muted)" }}>{p}</button>)}
                  <button className="btn-ghost px-2 py-1"><ChevronRight className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          )}

          {/* ========== COURSES ========== */}
          {tab === "courses" && (
            <div className="card-base overflow-hidden">
              <div className="p-5 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
                <h2 className="font-bold">Quản lý khóa học</h2>
                <button className="btn-primary text-sm px-4 py-2"><Plus className="w-4 h-4" /> Tạo khóa học</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr style={{ borderBottom: "1px solid var(--border)" }}>
                    {["Khóa học", "Giáo viên", "Danh mục", "Học sinh", "Đánh giá", "Doanh thu", "Trạng thái", ""].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: "var(--foreground-muted)" }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {courses.map((c) => (
                      <tr key={c.id} className="transition-colors hover:bg-[var(--muted)]" style={{ borderBottom: "1px solid var(--border)" }}>
                        <td className="px-4 py-3.5 font-semibold max-w-[200px] truncate">{c.title}</td>
                        <td className="px-4 py-3.5" style={{ color: "var(--foreground-muted)" }}>{c.author}</td>
                        <td className="px-4 py-3.5"><span className="badge badge-primary text-[10px]">{c.cat}</span></td>
                        <td className="px-4 py-3.5">{c.students.toLocaleString()}</td>
                        <td className="px-4 py-3.5">{c.rating > 0 ? `⭐ ${c.rating}` : "—"}</td>
                        <td className="px-4 py-3.5" style={{ color: "#10b981" }}>{c.revenue > 0 ? `${(c.revenue / 1000).toFixed(0)}k ₫` : "Miễn phí"}</td>
                        <td className="px-4 py-3.5"><span className={`badge ${c.status === "published" ? "badge-success" : "badge-warning"} text-[10px]`}>{c.status === "published" ? "Đã xuất bản" : "Nháp"}</span></td>
                        <td className="px-4 py-3.5"><div className="flex gap-1">
                          <button className="btn-ghost px-2 py-1"><Eye className="w-3.5 h-3.5" /></button>
                          <button className="btn-ghost px-2 py-1"><Edit className="w-3.5 h-3.5" /></button>
                        </div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========== ORDERS ========== */}
          {tab === "orders" && (
            <div className="card-base overflow-hidden">
              <div className="p-5 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
                <h2 className="font-bold">Quản lý đơn hàng</h2>
                <button className="btn-secondary text-sm"><Download className="w-4 h-4" /> Xuất CSV</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr style={{ borderBottom: "1px solid var(--border)" }}>
                    {["Mã đơn", "Khách hàng", "Số tiền", "Phương thức", "Trạng thái", "Ngày", ""].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: "var(--foreground-muted)" }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {orders.map((o) => {
                      const st = statusIcons[o.status] || statusIcons.pending;
                      return (
                        <tr key={o.id} className="transition-colors hover:bg-[var(--muted)]" style={{ borderBottom: "1px solid var(--border)" }}>
                          <td className="px-4 py-3.5 font-mono font-bold" style={{ color: "#a78bfa" }}>{o.id}</td>
                          <td className="px-4 py-3.5">{o.user}</td>
                          <td className="px-4 py-3.5 font-semibold">{(o.amount / 1000).toFixed(0)}k ₫</td>
                          <td className="px-4 py-3.5" style={{ color: "var(--foreground-muted)" }}>{o.method}</td>
                          <td className="px-4 py-3.5"><span className="flex items-center gap-1 text-xs"><st.Icon className="w-3 h-3" style={{ color: st.color }} /><span style={{ color: st.color }}>{o.status}</span></span></td>
                          <td className="px-4 py-3.5" style={{ color: "var(--foreground-muted)" }}>{o.date}</td>
                          <td className="px-4 py-3.5"><button className="btn-ghost px-2 py-1"><Eye className="w-3.5 h-3.5" /></button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========== COUPONS ========== */}
          {tab === "coupons" && (
            <>
              <div className="flex justify-end mb-4">
                <button className="btn-primary text-sm"><Plus className="w-4 h-4" /> Tạo mã giảm giá</button>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {coupons.map((c) => {
                  const st = statusIcons[c.status] || statusIcons.active;
                  return (
                    <div key={c.id} className="card-base card-hover">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-mono font-bold text-lg" style={{ color: "#a78bfa" }}>{c.code}</span>
                        <span className="flex items-center gap-1 text-xs"><st.Icon className="w-3 h-3" style={{ color: st.color }} /><span style={{ color: st.color }}>{c.status}</span></span>
                      </div>
                      <p className="text-2xl font-extrabold mb-3 gradient-text">{c.discount}</p>
                      <div className="space-y-2 text-xs" style={{ color: "var(--foreground-muted)" }}>
                        <div className="flex justify-between"><span>Đã dùng</span><span className="font-semibold" style={{ color: "var(--foreground)" }}>{c.used}/{c.limit}</span></div>
                        <div className="progress-bar"><div className="progress-fill" style={{ width: `${(c.used / c.limit) * 100}%` }} /></div>
                        <div className="flex justify-between"><span>Hết hạn</span><span>{c.expires}</span></div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <button className="btn-secondary text-xs flex-1 justify-center py-2"><Edit className="w-3 h-3" /> Sửa</button>
                        <button className="btn-ghost text-xs px-3 py-2" style={{ color: "#ef4444" }}><Trash2 className="w-3 h-3" /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
