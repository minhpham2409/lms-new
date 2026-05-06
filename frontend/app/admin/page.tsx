"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/components/auth/auth-state";
import {
  Users, BookOpen, DollarSign, TrendingUp, Shield, BarChart3, Search,
  Eye, Edit, Trash2, UserCheck, UserX, Plus, Download,
  Tag, Package, RefreshCw, Activity,
  CheckCircle2, Clock, XCircle, Loader2,
} from "lucide-react";
import { toast } from "sonner";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

const roleColors: Record<string, string> = { student: "#7c3aed", teacher: "#0891b2", parent: "#f59e0b", admin: "#ef4444" };
const roleLabels: Record<string, string> = { student: "Học sinh", teacher: "Giáo viên", parent: "Phụ huynh", admin: "Admin" };
const statusIcons: Record<string, { color: string; Icon: any }> = {
  completed: { color: "#10b981", Icon: CheckCircle2 }, paid: { color: "#10b981", Icon: CheckCircle2 },
  pending: { color: "#f59e0b", Icon: Clock }, refunded: { color: "#ef4444", Icon: XCircle },
  active: { color: "#10b981", Icon: CheckCircle2 }, expired: { color: "#ef4444", Icon: XCircle },
};

type Tab = "overview" | "users" | "courses" | "orders" | "coupons";

export default function AdminPage() {
  const router = useRouter();
  const { user, token, isLoggedIn, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<Tab>("overview");
  const [search, setSearch] = useState("");

  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!isLoggedIn) { router.push("/auth/login"); return; }
    if (user?.role !== "admin") {
      if (user?.role === "teacher") router.push("/teacher");
      else if (user?.role === "parent") router.push("/parent");
      else router.push("/dashboard");
    }
  }, [user, isLoggedIn, authLoading, router]);

  useEffect(() => {
    if (token && user?.role === "admin") fetchAll();
  }, [token, user]);

  async function fetchAll() {
    setDataLoading(true);
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [statsR, usersR, coursesR, ordersR, couponsR] = await Promise.all([
        fetch(`${API}/admin/dashboard`, { headers }).then(r => r.ok ? r.json() : null),
        fetch(`${API}/admin/users`, { headers }).then(r => r.ok ? r.json() : []),
        fetch(`${API}/admin/courses`, { headers }).then(r => r.ok ? r.json() : []),
        fetch(`${API}/admin/orders`, { headers }).then(r => r.ok ? r.json() : []),
        fetch(`${API}/coupons`, { headers }).then(r => r.ok ? r.json() : []),
      ]);
      setStats(statsR);
      setUsers(Array.isArray(usersR) ? usersR : []);
      setCourses(Array.isArray(coursesR) ? coursesR : []);
      setOrders(Array.isArray(ordersR) ? ordersR : []);
      setCoupons(Array.isArray(couponsR) ? couponsR : []);
    } catch {} finally { setDataLoading(false); }
  }

  async function deleteUser(id: string) {
    if (!confirm("Xóa người dùng này?")) return;
    try {
      const res = await fetch(`${API}/admin/users/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { setUsers(users.filter(u => u.id !== id)); toast.success("Đã xóa"); }
    } catch { toast.error("Lỗi"); }
  }

  async function publishCourse(id: string) {
    try {
      const res = await fetch(`${API}/admin/courses/${id}/publish`, { method: "PUT", headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { setCourses(courses.map(c => c.id === id ? { ...c, status: "published" } : c)); toast.success("Đã xuất bản"); }
    } catch { toast.error("Lỗi"); }
  }

  async function rejectCourse(id: string) {
    if (!confirm("Từ chối khóa học này?")) return;
    try {
      const res = await fetch(`${API}/admin/courses/${id}/reject`, { method: "PUT", headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { setCourses(courses.map(c => c.id === id ? { ...c, status: "rejected" } : c)); toast.success("Đã từ chối"); }
    } catch { toast.error("Lỗi"); }
  }

  async function deleteCourse(id: string) {
    if (!confirm("Xóa khóa học này?")) return;
    try {
      const res = await fetch(`${API}/admin/courses/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { setCourses(courses.filter(c => c.id !== id)); toast.success("Đã xóa"); }
    } catch { toast.error("Lỗi"); }
  }

  async function createUser(data: any) {
    try {
      const res = await fetch(`${API}/admin/users`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(data) });
      if (res.ok) { fetchAll(); toast.success("Đã tạo người dùng"); }
      else { const d = await res.json(); toast.error(d.message || "Lỗi"); }
    } catch { toast.error("Lỗi"); }
  }

  async function updateUser(id: string, data: any) {
    try {
      const res = await fetch(`${API}/admin/users/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(data) });
      if (res.ok) { fetchAll(); toast.success("Đã cập nhật"); }
    } catch { toast.error("Lỗi"); }
  }

  async function createCoupon(data: any) {
    try {
      const res = await fetch(`${API}/coupons`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(data) });
      if (res.ok) { fetchAll(); toast.success("Đã tạo mã giảm giá"); }
      else { const d = await res.json(); toast.error(d.message || "Lỗi"); }
    } catch { toast.error("Lỗi"); }
  }

  if (authLoading || !user || user.role !== "admin") {
    return (<div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
      <div className="w-8 h-8 border-2 border-[#ef4444] border-t-transparent rounded-full animate-spin" />
    </div>);
  }

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "overview", label: "Tổng quan", icon: BarChart3 },
    { id: "users", label: "Người dùng", icon: Users },
    { id: "courses", label: "Khóa học", icon: BookOpen },
    { id: "orders", label: "Đơn hàng", icon: Package },
    { id: "coupons", label: "Mã giảm giá", icon: Tag },
  ];

  const filteredUsers = users.filter(u => !search || u.username?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <Navbar />
      <div className="pt-20 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
            <button onClick={fetchAll} className="btn-secondary text-sm"><RefreshCw className="w-4 h-4" /> Làm mới</button>
          </div>

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

          {dataLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" style={{ color: "#7c3aed" }} /></div>
          ) : (
            <>
              {/* OVERVIEW */}
              {tab === "overview" && (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {[
                      { label: "Tổng người dùng", value: stats?.totalUsers ?? users.length, icon: Users, color: "#7c3aed" },
                      { label: "Khóa học", value: stats?.totalCourses ?? courses.length, icon: BookOpen, color: "#0891b2" },
                      { label: "Đơn hàng", value: stats?.totalOrders ?? orders.length, icon: Package, color: "#10b981" },
                      { label: "Doanh thu", value: stats?.totalRevenue ? `${(stats.totalRevenue / 1000000).toFixed(1)}M ₫` : "—", icon: DollarSign, color: "#f59e0b" },
                    ].map(({ label, value, icon: Icon, color }) => (
                      <div key={label} className="card-base">
                        <div className="flex items-center justify-between mb-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
                            <Icon className="w-5 h-5" style={{ color }} />
                          </div>
                        </div>
                        <p className="text-2xl font-extrabold">{value}</p>
                        <p className="text-xs mt-1" style={{ color: "var(--foreground-muted)" }}>{label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: "Học sinh", value: users.filter(u => u.role === "student").length, color: "#7c3aed" },
                      { label: "Giáo viên", value: users.filter(u => u.role === "teacher").length, color: "#0891b2" },
                      { label: "Phụ huynh", value: users.filter(u => u.role === "parent").length, color: "#f59e0b" },
                      { label: "Khóa xuất bản", value: courses.filter(c => c.status === "published").length, color: "#10b981" },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="card-base text-center">
                        <p className="text-xl font-extrabold" style={{ color }}>{value}</p>
                        <p className="text-xs mt-1" style={{ color: "var(--foreground-muted)" }}>{label}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* USERS */}
              {tab === "users" && (
                <div className="card-base overflow-hidden">
                  <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3" style={{ borderBottom: "1px solid var(--border)" }}>
                    <h2 className="font-bold">Quản lý người dùng <span className="text-xs font-normal" style={{ color: "var(--foreground-muted)" }}>({users.length} người)</span></h2>
                    <div className="relative sm:w-56">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--foreground-muted)" }} />
                      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm kiếm..." className="input-base pl-9 py-2 text-sm" />
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr style={{ borderBottom: "1px solid var(--border)" }}>
                        {["Username", "Email", "Vai trò", "Trạng thái", "Ngày tham gia", ""].map(h => (
                          <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: "var(--foreground-muted)" }}>{h}</th>
                        ))}
                      </tr></thead>
                      <tbody>
                        {filteredUsers.map(u => (
                          <tr key={u.id} className="transition-colors hover:bg-[var(--muted)]" style={{ borderBottom: "1px solid var(--border)" }}>
                            <td className="px-4 py-3.5 font-semibold">{u.firstName || u.username}</td>
                            <td className="px-4 py-3.5" style={{ color: "var(--foreground-muted)" }}>{u.email}</td>
                            <td className="px-4 py-3.5"><span className="badge" style={{ background: `${roleColors[u.role] || "#7c3aed"}18`, color: roleColors[u.role] || "#7c3aed", border: `1px solid ${roleColors[u.role] || "#7c3aed"}33` }}>{roleLabels[u.role] || u.role}</span></td>
                            <td className="px-4 py-3.5">
                              <span className="flex items-center gap-1 text-xs">
                                {u.isActive ? <UserCheck className="w-3 h-3" style={{ color: "#10b981" }} /> : <UserX className="w-3 h-3" style={{ color: "#ef4444" }} />}
                                <span style={{ color: u.isActive ? "#10b981" : "#ef4444" }}>{u.isActive ? "Active" : "Inactive"}</span>
                              </span>
                            </td>
                            <td className="px-4 py-3.5" style={{ color: "var(--foreground-muted)" }}>{new Date(u.createdAt).toLocaleDateString("vi-VN")}</td>
                            <td className="px-4 py-3.5"><div className="flex gap-1">
                              <button onClick={() => deleteUser(u.id)} className="btn-ghost px-2 py-1"><Trash2 className="w-3.5 h-3.5" style={{ color: "#ef4444" }} /></button>
                            </div></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* COURSES */}
              {tab === "courses" && (
                <div className="card-base overflow-hidden">
                  <div className="p-5 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
                    <h2 className="font-bold">Quản lý khóa học <span className="text-xs font-normal" style={{ color: "var(--foreground-muted)" }}>({courses.length})</span></h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr style={{ borderBottom: "1px solid var(--border)" }}>
                        {["Khóa học", "Giáo viên", "Giá", "Học sinh", "Trạng thái", ""].map(h => (
                          <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: "var(--foreground-muted)" }}>{h}</th>
                        ))}
                      </tr></thead>
                      <tbody>
                        {courses.map(c => (
                          <tr key={c.id} className="transition-colors hover:bg-[var(--muted)]" style={{ borderBottom: "1px solid var(--border)" }}>
                            <td className="px-4 py-3.5 font-semibold max-w-[200px] truncate">{c.title}</td>
                            <td className="px-4 py-3.5" style={{ color: "var(--foreground-muted)" }}>{c.author?.username || "—"}</td>
                            <td className="px-4 py-3.5" style={{ color: "#10b981" }}>{c.price > 0 ? `${c.price.toLocaleString()} ₫` : "Miễn phí"}</td>
                            <td className="px-4 py-3.5">{c._count?.enrollments || 0}</td>
                            <td className="px-4 py-3.5"><span className={`badge ${c.status === "published" ? "badge-success" : "badge-warning"} text-[10px]`}>{c.status === "published" ? "Xuất bản" : c.status === "draft" ? "Nháp" : c.status}</span></td>
                            <td className="px-4 py-3.5"><div className="flex gap-1">
                              {c.status !== "published" && <button onClick={() => publishCourse(c.id)} className="btn-ghost px-2 py-1 text-xs" style={{ color: "#10b981" }}>Duyệt</button>}
                              {c.status !== "published" && c.status !== "rejected" && <button onClick={() => rejectCourse(c.id)} className="btn-ghost px-2 py-1 text-xs" style={{ color: "#ef4444" }}>Từ chối</button>}
                              <button onClick={() => window.open(`/courses/${c.id}`, '_blank')} className="btn-ghost px-2 py-1"><Eye className="w-3.5 h-3.5" /></button>
                            </div></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ORDERS */}
              {tab === "orders" && (
                <div className="card-base overflow-hidden">
                  <div className="p-5 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
                    <h2 className="font-bold">Quản lý đơn hàng <span className="text-xs font-normal" style={{ color: "var(--foreground-muted)" }}>({orders.length})</span></h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr style={{ borderBottom: "1px solid var(--border)" }}>
                        {["Mã đơn", "Khách hàng", "Số tiền", "Trạng thái", "Ngày"].map(h => (
                          <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: "var(--foreground-muted)" }}>{h}</th>
                        ))}
                      </tr></thead>
                      <tbody>
                        {orders.length === 0 ? (
                          <tr><td colSpan={5} className="px-4 py-8 text-center text-sm" style={{ color: "var(--foreground-muted)" }}>Chưa có đơn hàng nào</td></tr>
                        ) : orders.map(o => {
                          const st = statusIcons[o.status] || statusIcons.pending;
                          return (
                            <tr key={o.id} className="transition-colors hover:bg-[var(--muted)]" style={{ borderBottom: "1px solid var(--border)" }}>
                              <td className="px-4 py-3.5 font-mono font-bold" style={{ color: "#a78bfa" }}>{o.id.substring(0, 8)}</td>
                              <td className="px-4 py-3.5">{o.user?.username || "—"}</td>
                              <td className="px-4 py-3.5 font-semibold">{(o.finalPrice || o.totalPrice || 0).toLocaleString()} ₫</td>
                              <td className="px-4 py-3.5"><span className="flex items-center gap-1 text-xs"><st.Icon className="w-3 h-3" style={{ color: st.color }} /><span style={{ color: st.color }}>{o.status}</span></span></td>
                              <td className="px-4 py-3.5" style={{ color: "var(--foreground-muted)" }}>{new Date(o.createdAt).toLocaleDateString("vi-VN")}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* COUPONS */}
              {tab === "coupons" && (
                <>
                  {coupons.length === 0 ? (
                    <div className="card-base text-center py-12">
                      <Tag className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--foreground-muted)" }} />
                      <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>Chưa có mã giảm giá nào</p>
                    </div>
                  ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {coupons.map(c => {
                        const st = statusIcons[c.isActive ? "active" : "expired"] || statusIcons.active;
                        return (
                          <div key={c.id} className="card-base card-hover">
                            <div className="flex items-center justify-between mb-3">
                              <span className="font-mono font-bold text-lg" style={{ color: "#a78bfa" }}>{c.code}</span>
                              <span className="flex items-center gap-1 text-xs"><st.Icon className="w-3 h-3" style={{ color: st.color }} /><span style={{ color: st.color }}>{c.isActive ? "active" : "expired"}</span></span>
                            </div>
                            <p className="text-2xl font-extrabold mb-3 gradient-text">{c.discount}%</p>
                            <div className="space-y-2 text-xs" style={{ color: "var(--foreground-muted)" }}>
                              <div className="flex justify-between"><span>Đã dùng</span><span className="font-semibold" style={{ color: "var(--foreground)" }}>{c.usedCount}/{c.maxUses || "∞"}</span></div>
                              {c.maxUses && <div className="progress-bar"><div className="progress-fill" style={{ width: `${(c.usedCount / c.maxUses) * 100}%` }} /></div>}
                              {c.expiresAt && <div className="flex justify-between"><span>Hết hạn</span><span>{new Date(c.expiresAt).toLocaleDateString("vi-VN")}</span></div>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
