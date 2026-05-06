"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/components/auth/auth-state";
import {
  Users, BookOpen, Clock, TrendingUp, Award, BarChart3, Calendar,
  Bell, Loader2, UserPlus, UserMinus, CheckCircle2, XCircle, ChevronRight, Send, RefreshCw,
  QrCode, CreditCard,
} from "lucide-react";
import { toast } from "sonner";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

export default function ParentPage() {
  const router = useRouter();
  const { user, token, isLoggedIn, loading: authLoading } = useAuth();
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChild, setSelectedChild] = useState<any>(null);
  const [childCourses, setChildCourses] = useState<any[]>([]);
  const [childDashboard, setChildDashboard] = useState<any>(null);
  const [childProgress, setChildProgress] = useState<any>(null);
  const [outgoingRequests, setOutgoingRequests] = useState<any[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [linkUsername, setLinkUsername] = useState("");
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [tab, setTab] = useState<"overview" | "courses" | "payments" | "requests">("overview");

  useEffect(() => {
    if (authLoading) return;
    if (!isLoggedIn) { router.push("/auth/login"); return; }
    if (user?.role !== "parent") {
      if (user?.role === "admin") router.push("/admin");
      else if (user?.role === "teacher") router.push("/teacher");
      else router.push("/dashboard");
    }
  }, [user, isLoggedIn, authLoading, router]);

  useEffect(() => {
    if (token && user?.role === "parent") fetchAll();
  }, [token, user]);

  async function fetchAll() {
    setDataLoading(true);
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [childrenR, outR, inR] = await Promise.all([
        fetch(`${API}/parents/me/children`, { headers }).then(r => r.ok ? r.json() : []),
        fetch(`${API}/parents/link-requests/outgoing`, { headers }).then(r => r.ok ? r.json() : []),
        fetch(`${API}/parents/link-requests/incoming`, { headers }).then(r => r.ok ? r.json() : []),
      ]);
      const kids = Array.isArray(childrenR) ? childrenR : [];
      setChildren(kids);
      setOutgoingRequests(Array.isArray(outR) ? outR : []);
      setIncomingRequests(Array.isArray(inR) ? inR : []);
      if (kids.length > 0 && !selectedChild) {
        selectChild(kids[0]);
      }
      // Fetch pending orders from children
      const allOrders: any[] = [];
      for (const kid of kids) {
        const childId = kid.child?.id || kid.childId;
        console.log('Checking orders for kid:', kid, 'childId:', childId);
        if (!childId) continue;
        try {
          const ordersR = await fetch(`${API}/parents/children/${childId}/orders`, { headers }).then(r => { console.log('Orders for child', childId, 'status:', r.status); return r.ok ? r.json() : []; });
          // filter for pending orders (parent sees child’s pending)
          if (Array.isArray(ordersR)) {
            ordersR.filter((o: any) => o.status === 'pending').forEach((o: any) => allOrders.push({ ...o, childName: kid.child?.firstName || kid.child?.username || 'Con' }));
          }
        } catch {}
      }
      setPendingOrders(allOrders);
    } catch {} finally { setDataLoading(false); }
  }

  async function selectChild(c: any) {
    setSelectedChild(c);
    const childId = c.child?.id || c.childId;
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [coursesR, dashR, progressR] = await Promise.all([
        fetch(`${API}/parents/children/${childId}/courses`, { headers }).then(r => r.ok ? r.json() : []),
        fetch(`${API}/parents/children/${childId}/dashboard`, { headers }).then(r => r.ok ? r.json() : null),
        fetch(`${API}/parents/children/${childId}/progress`, { headers }).then(r => r.ok ? r.json() : null),
      ]);
      setChildCourses(Array.isArray(coursesR) ? coursesR : []);
      setChildDashboard(dashR);
      setChildProgress(progressR);
    } catch {}
  }

  async function linkChild() {
    if (!linkUsername.trim()) return;
    try {
      const res = await fetch(`${API}/parents/link-child`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ identifier: linkUsername.trim() }),
      });
      if (res.ok) { setLinkUsername(""); toast.success("Đã gửi yêu cầu liên kết! Chờ học sinh xác nhận."); fetchAll(); }
      else { const d = await res.json(); toast.error(d.message || "Không tìm thấy học sinh"); }
    } catch { toast.error("Lỗi kết nối"); }
  }

  async function acceptRequest(id: string) {
    try {
      const res = await fetch(`${API}/parents/link-request/${id}/accept`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { toast.success("Đã chấp nhận!"); fetchAll(); }
    } catch { toast.error("Lỗi"); }
  }

  async function rejectRequest(id: string) {
    try {
      const res = await fetch(`${API}/parents/link-request/${id}/reject`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { toast.success("Đã từ chối"); fetchAll(); }
    } catch { toast.error("Lỗi"); }
  }

  async function deleteRequest(id: string) {
    try {
      await fetch(`${API}/parents/link-requests/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      toast.success("Đã xóa"); fetchAll();
    } catch { toast.error("Lỗi"); }
  }

  async function unlinkChild(childId: string) {
    if (!confirm("Hủy liên kết với con?")) return;
    try {
      await fetch(`${API}/parents/children/${childId}/link`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      toast.success("Đã hủy liên kết"); setSelectedChild(null); fetchAll();
    } catch { toast.error("Lỗi"); }
  }

  if (authLoading || !user || user.role !== "parent") {
    return (<div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
      <div className="w-8 h-8 border-2 border-[#f59e0b] border-t-transparent rounded-full animate-spin" />
    </div>);
  }

  const child = selectedChild?.child || selectedChild;
  const tabs = [
    { id: "overview" as const, label: "Tổng quan", icon: BarChart3 },
    { id: "courses" as const, label: "Khóa học", icon: BookOpen },
    { id: "payments" as const, label: "Thanh toán", icon: CreditCard, badge: pendingOrders.length },
    { id: "requests" as const, label: "Liên kết", icon: UserPlus },
  ];

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <Navbar />
      <div className="pt-20 pb-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-extrabold mb-1">Phụ huynh Dashboard</h1>
              <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>Theo dõi tiến độ học tập của con em</p>
            </div>
            <button onClick={fetchAll} className="btn-secondary text-sm"><RefreshCw className="w-4 h-4" /> Làm mới</button>
          </div>

          {dataLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" style={{ color: "#f59e0b" }} /></div>
          ) : (
            <>
              {/* Link child input */}
              <div className="card-base mb-6 flex gap-2 items-center">
                <UserPlus className="w-5 h-5 flex-shrink-0" style={{ color: "#7c3aed" }} />
                <input value={linkUsername} onChange={e => setLinkUsername(e.target.value)} onKeyDown={e => e.key === "Enter" && linkChild()} placeholder="Nhập email học sinh để liên kết..." className="input-base flex-1 py-2 text-sm" />
                <button onClick={linkChild} className="btn-primary text-sm px-4"><Send className="w-4 h-4" /> Liên kết</button>
              </div>

              {/* Children selector */}
              {children.length > 0 && (
                <div className="flex gap-3 mb-6 overflow-x-auto pb-1">
                  {children.map((c) => {
                    const kid = c.child || c;
                    const isActive = child?.id === kid.id;
                    return (
                      <button key={c.id} onClick={() => selectChild(c)}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all whitespace-nowrap"
                        style={{
                          background: isActive ? "rgba(124,58,237,0.15)" : "var(--card)",
                          border: `1px solid ${isActive ? "rgba(124,58,237,0.3)" : "var(--border)"}`,
                        }}>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white" style={{ background: "linear-gradient(135deg, #7c3aed, #0891b2)" }}>
                          {(kid.firstName || kid.username || "?").charAt(0).toUpperCase()}
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-semibold">{kid.firstName || kid.username}</p>
                          <p className="text-[10px]" style={{ color: "var(--foreground-muted)" }}>{kid.email}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

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
                    {(t as any).badge > 0 && (
                      <span className="w-5 h-5 rounded-full text-[10px] flex items-center justify-center text-white" style={{ background: "#ef4444" }}>
                        {(t as any).badge}
                      </span>
                    )}
                    {t.id === "requests" && (incomingRequests.length + outgoingRequests.length > 0) && !(t as any).badge && (
                      <span className="w-5 h-5 rounded-full text-[10px] flex items-center justify-center text-white" style={{ background: "#ef4444" }}>
                        {incomingRequests.length + outgoingRequests.length}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Overview */}
              {tab === "overview" && child && (
                <>
                  {/* Child profile card */}
                  <div className="card-base mb-6" style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.08), rgba(8,145,178,0.05))" }}>
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white" style={{ background: "linear-gradient(135deg, #7c3aed, #0891b2)" }}>
                          {(child.firstName || child.username || "?").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h2 className="text-lg font-extrabold">{child.firstName ? `${child.firstName} ${child.lastName || ""}`.trim() : child.username}</h2>
                          <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>{child.email}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: "rgba(16,185,129,0.15)", color: "#10b981" }}>
                              {child.isActive !== false ? "Đang hoạt động" : "Không hoạt động"}
                            </span>
                            {child.createdAt && (
                              <span className="text-[10px] flex items-center gap-1" style={{ color: "var(--foreground-muted)" }}>
                                <Calendar className="w-3 h-3" /> Tham gia {new Date(child.createdAt).toLocaleDateString("vi-VN")}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button onClick={() => unlinkChild(child.id)} className="btn-ghost text-xs" style={{ color: "#ef4444" }}>
                        <UserMinus className="w-3 h-3" /> Hủy liên kết
                      </button>
                    </div>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
                    {[
                      { label: "Khóa học", value: childDashboard?.enrollments?.length ?? childCourses.length, icon: BookOpen, color: "#7c3aed", sub: "đã đăng ký" },
                      { label: "Bài học xong", value: childDashboard?.activity?.videoLessonsCompleted ?? 0, icon: CheckCircle2, color: "#10b981", sub: "hoàn thành" },
                      { label: "Quiz đã làm", value: childDashboard?.activity?.quizAttempts ?? 0, icon: Award, color: "#f59e0b", sub: "lần làm quiz" },
                      { label: "Bài tập nộp", value: childDashboard?.activity?.assignmentSubmissions ?? 0, icon: TrendingUp, color: "#0891b2", sub: "bài tập" },
                      { label: "Chứng chỉ", value: childDashboard?.certificates?.length ?? 0, icon: Award, color: "#ec4899", sub: "đã nhận" },
                    ].map(({ label, value, icon: Icon, color, sub }) => (
                      <div key={label} className="card-base text-center py-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2" style={{ background: `${color}18` }}>
                          <Icon className="w-5 h-5" style={{ color }} />
                        </div>
                        <p className="text-2xl font-extrabold">{value}</p>
                        <p className="text-[10px] mt-0.5" style={{ color: "var(--foreground-muted)" }}>{sub}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid lg:grid-cols-2 gap-6">
                    {/* Enrollments with progress */}
                    <div className="card-base">
                      <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                        <BookOpen className="w-4 h-4" style={{ color: "#7c3aed" }} /> Tiến độ khóa học
                      </h3>
                      {(childDashboard?.enrollments || childCourses || []).length === 0 ? (
                        <p className="text-xs text-center py-4" style={{ color: "var(--foreground-muted)" }}>Chưa tham gia khóa học nào</p>
                      ) : (
                        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                          {(childDashboard?.enrollments || childCourses || []).map((e: any) => {
                            const course = e.course || e;
                            const totalL = e.stats?.totalLessons || 0;
                            const doneL = e.stats?.completedLessons || 0;
                            const pct = totalL > 0 ? Math.round((doneL / totalL) * 100) : (e.progress || 0);
                            return (
                              <div key={e.id} className="p-3 rounded-xl" style={{ background: "var(--muted)" }}>
                                <div className="flex items-center justify-between mb-1">
                                  <p className="text-xs font-semibold truncate flex-1">{course.title}</p>
                                  <span className={`text-[10px] font-bold ${pct >= 100 ? "text-green-500" : ""}`} style={{ color: pct >= 100 ? "#10b981" : "#a78bfa" }}>{pct}%</span>
                                </div>
                                <div className="progress-bar"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
                                <div className="flex items-center justify-between mt-1.5 text-[10px]" style={{ color: "var(--foreground-muted)" }}>
                                  <span>{doneL}/{totalL} bài học</span>
                                  <span>{e.status === "pending" ? "⏳ Chờ duyệt" : pct >= 100 ? "✅ Hoàn thành" : "📖 Đang học"}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Certificates + activity */}
                    <div className="space-y-6">
                      {/* Certificates */}
                      <div className="card-base">
                        <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                          <Award className="w-4 h-4" style={{ color: "#f59e0b" }} /> Chứng chỉ đạt được
                        </h3>
                        {(childDashboard?.certificates || []).length === 0 ? (
                          <p className="text-xs text-center py-4" style={{ color: "var(--foreground-muted)" }}>Chưa có chứng chỉ</p>
                        ) : (
                          <div className="space-y-2">
                            {(childDashboard?.certificates || []).map((cert: any) => (
                              <div key={cert.id} className="flex items-center gap-3 p-2.5 rounded-xl" style={{ background: "rgba(245,158,11,0.08)" }}>
                                <Award className="w-8 h-8" style={{ color: "#f59e0b" }} />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold truncate">{cert.course?.title || "Khóa học"}</p>
                                  <p className="text-[10px]" style={{ color: "var(--foreground-muted)" }}>
                                    Cấp ngày {cert.issuedAt ? new Date(cert.issuedAt).toLocaleDateString("vi-VN") : "—"}
                                  </p>
                                </div>
                                <span className="text-[10px] font-mono px-2 py-1 rounded" style={{ background: "var(--muted)" }}>{cert.code || cert.id?.substring(0, 8)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Activity summary */}
                      <div className="card-base">
                        <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                          <BarChart3 className="w-4 h-4" style={{ color: "#0891b2" }} /> Hoạt động gần đây
                        </h3>
                        <div className="space-y-2.5">
                          {[
                            { icon: "🎬", label: "Video đã hoàn thành", value: childDashboard?.activity?.videoLessonsCompleted ?? 0 },
                            { icon: "📝", label: "Quiz đã làm", value: childDashboard?.activity?.quizAttempts ?? 0 },
                            { icon: "📄", label: "Bài tập đã nộp", value: childDashboard?.activity?.assignmentSubmissions ?? 0 },
                            { icon: "🏆", label: "Chứng chỉ đạt được", value: childDashboard?.certificates?.length ?? 0 },
                          ].map(({ icon, label, value }) => (
                            <div key={label} className="flex items-center justify-between p-2 rounded-lg" style={{ background: "var(--muted)" }}>
                              <span className="text-xs flex items-center gap-2">{icon} {label}</span>
                              <span className="text-sm font-bold">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {tab === "overview" && !child && children.length === 0 && (
                <div className="card-base text-center py-12">
                  <Users className="w-12 h-12 mx-auto mb-4" style={{ color: "var(--foreground-muted)" }} />
                  <h3 className="font-bold mb-2">Chưa liên kết con em</h3>
                  <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>Nhập username ở trên để bắt đầu theo dõi</p>
                </div>
              )}

              {/* Courses */}
              {tab === "courses" && (
                <>
                  <h3 className="font-bold mb-3 flex items-center gap-2"><BookOpen className="w-5 h-5" style={{ color: "#7c3aed" }} /> Khóa học đang theo học</h3>
                  {childCourses.length === 0 ? (
                    <div className="card-base text-center py-8">
                      <BookOpen className="w-10 h-10 mx-auto mb-2" style={{ color: "var(--foreground-muted)" }} />
                      <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>Con chưa tham gia khóa học nào</p>
                    </div>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-4">
                      {childCourses.map((enrollment: any) => {
                        const course = enrollment.course || enrollment;
                        return (
                          <div key={enrollment.id} className="card-base card-hover">
                            <div className="flex items-start gap-3">
                              <div className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background: "rgba(124,58,237,0.12)" }}>
                                <BookOpen className="w-6 h-6" style={{ color: "#7c3aed" }} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-sm truncate">{course.title}</h4>
                                <p className="text-xs mt-1" style={{ color: "var(--foreground-muted)" }}>Tiến độ: {Math.round(enrollment.progress || 0)}%</p>
                                <div className="progress-bar mt-2"><div className="progress-fill" style={{ width: `${enrollment.progress || 0}%` }} /></div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {/* Payments */}
              {tab === "payments" && (
                <div>
                  <h3 className="text-lg font-extrabold mb-4 flex items-center gap-2">
                    <CreditCard className="w-5 h-5" style={{ color: "#7c3aed" }} /> Thanh toán chờ xử lý
                  </h3>
                  {pendingOrders.length === 0 ? (
                    <div className="card-base text-center py-12">
                      <CheckCircle2 className="w-12 h-12 mx-auto mb-3" style={{ color: "#10b981" }} />
                      <h3 className="font-bold mb-2">Không có thanh toán chờ</h3>
                      <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>Tất cả đơn hàng đã được xử lý</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pendingOrders.map((order: any) => (
                        <div key={order.id} className="card-base">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <p className="text-sm font-semibold">Đơn hàng #{order.id?.substring(0, 8)}</p>
                              <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>
                                Từ: <strong>{order.childName || "Con"}</strong> • {order.createdAt ? new Date(order.createdAt).toLocaleDateString("vi-VN") : ""}
                              </p>
                            </div>
                            <span className="badge badge-warning text-[10px]">Chờ thanh toán</span>
                          </div>
                          {order.items?.map((item: any) => (
                            <p key={item.id} className="text-sm mb-1" style={{ color: "var(--foreground-muted)" }}>
                              • {item.course?.title || "Khóa học"}
                            </p>
                          ))}
                          <div className="mt-4 text-center">
                            <p className="text-2xl font-extrabold gradient-text mb-3">
                              {(order.finalPrice || order.totalPrice || 0).toLocaleString()} ₫
                            </p>
                            <div className="w-48 h-48 mx-auto rounded-xl flex items-center justify-center mb-3" style={{ background: "white", border: "2px solid var(--border)" }}>
                              <img
                                src={`https://img.vietqr.io/image/MB-0389999999-compact2.png?amount=${order.finalPrice || order.totalPrice || 0}&addInfo=${encodeURIComponent(`HL-${order.id?.substring(0, 8)}`)}&accountName=${encodeURIComponent('NGUYEN VAN MINH')}`}
                                alt="QR" className="w-44 h-44 object-contain"
                                onError={(e) => { (e.target as HTMLImageElement).src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`Thanh toan ${order.finalPrice || order.totalPrice} VND`)}`; }}
                              />
                            </div>
                            <p className="text-xs mb-2" style={{ color: "var(--foreground-muted)" }}>Quét mã QR bằng app ngân hàng để thanh toán</p>
                            <div className="p-3 rounded-xl mt-2" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
                              <p className="text-xs font-medium flex items-center gap-1.5" style={{ color: "#f59e0b" }}>
                                <Clock className="w-3.5 h-3.5" /> Sau khi chuyển tiền, giáo viên sẽ xác nhận và duyệt học sinh vào lớp
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Link Requests */}
              {tab === "requests" && (
                <div className="space-y-6">
                  {incomingRequests.length > 0 && (
                    <div className="card-base">
                      <h3 className="font-bold mb-4">Yêu cầu đến ({incomingRequests.length})</h3>
                      <div className="space-y-3">
                        {incomingRequests.map((r: any) => (
                          <div key={r.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: "var(--muted)" }}>
                            <span className="text-sm font-semibold">{r.parent?.username || r.parentId}</span>
                            <div className="flex gap-2">
                              <button onClick={() => acceptRequest(r.id)} className="btn-primary text-xs px-3 py-1"><CheckCircle2 className="w-3 h-3" /> Chấp nhận</button>
                              <button onClick={() => rejectRequest(r.id)} className="btn-ghost text-xs px-3 py-1" style={{ color: "#ef4444" }}><XCircle className="w-3 h-3" /> Từ chối</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {outgoingRequests.length > 0 && (
                    <div className="card-base">
                      <h3 className="font-bold mb-4">Yêu cầu đã gửi ({outgoingRequests.length})</h3>
                      <div className="space-y-3">
                        {outgoingRequests.map((r: any) => (
                          <div key={r.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: "var(--muted)" }}>
                            <div>
                              <span className="text-sm font-semibold">{r.child?.username || r.childId}</span>
                              <span className="badge badge-warning text-[10px] ml-2">Chờ xác nhận</span>
                            </div>
                            <button onClick={() => deleteRequest(r.id)} className="btn-ghost text-xs" style={{ color: "#ef4444" }}>Hủy</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {incomingRequests.length === 0 && outgoingRequests.length === 0 && (
                    <div className="card-base text-center py-8">
                      <UserPlus className="w-10 h-10 mx-auto mb-2" style={{ color: "var(--foreground-muted)" }} />
                      <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>Không có yêu cầu liên kết nào</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
