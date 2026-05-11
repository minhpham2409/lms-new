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

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

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
  const [childGrades, setChildGrades] = useState<any[]>([]);
  const [tab, setTab] = useState<"overview" | "courses" | "grades" | "payments" | "requests">("overview");
  const [qrPopup, setQrPopup] = useState<{url: string, amount: number, id: string} | null>(null);

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
      const [coursesR, dashR, progressR, gradesR] = await Promise.all([
        fetch(`${API}/parents/children/${childId}/courses`, { headers }).then(r => r.ok ? r.json() : []),
        fetch(`${API}/parents/children/${childId}/dashboard`, { headers }).then(r => r.ok ? r.json() : null),
        fetch(`${API}/parents/children/${childId}/progress`, { headers }).then(r => r.ok ? r.json() : null),
        fetch(`${API}/parents/children/${childId}/grades`, { headers }).then(r => r.ok ? r.json() : []),
      ]);
      setChildCourses(Array.isArray(coursesR) ? coursesR : []);
      setChildDashboard(dashR);
      setChildProgress(progressR);
      setChildGrades(Array.isArray(gradesR) ? gradesR : []);
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
  const gradedCount = childGrades.filter((g: any) => g.status === 'graded').length;
  const tabs = [
    { id: "requests" as const, label: "Liên kết", icon: UserPlus },
    { id: "overview" as const, label: "Tổng quan", icon: BarChart3 },
    { id: "courses" as const, label: "Khóa học", icon: BookOpen },
    { id: "grades" as const, label: "Bảng điểm", icon: Award, badge: gradedCount },
    { id: "payments" as const, label: "Thanh toán", icon: CreditCard, badge: pendingOrders.length },
  ];

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <Navbar />

      {/* QR Popup overlay */}
      {qrPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm" style={{ background: "rgba(0,0,0,0.7)" }} onClick={() => setQrPopup(null)}>
          <div className="card-base max-w-sm w-full text-center relative p-8 animate-scale-in" onClick={e => e.stopPropagation()}>
            <button onClick={() => setQrPopup(null)} className="absolute top-4 right-4 opacity-70 hover:opacity-100 transition-opacity">
              <XCircle className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold mb-2">Quét mã thanh toán</h2>
            <p className="text-sm mb-6" style={{ color: "var(--foreground-muted)" }}>
              Đơn hàng <span className="font-mono" style={{ color: "#7c3aed" }}>#{qrPopup.id?.substring(0, 8)}</span>
            </p>
            <div className="bg-white p-2 rounded-2xl mx-auto w-fit mb-6">
              <img src={qrPopup.url} alt="QR Code Lớn" className="w-72 h-72 object-contain" 
                   onError={(e) => { (e.target as HTMLImageElement).src = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`Thanh toan ${qrPopup.amount} VND`)}`; }} />
            </div>
            <p className="text-3xl font-extrabold gradient-text mb-2">{qrPopup.amount.toLocaleString()} ₫</p>
            <p className="text-xs" style={{ color: "#f59e0b" }}>Dùng ứng dụng ngân hàng để quét mã QR</p>
          </div>
        </div>
      )}

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
                                <p className="text-xs mt-1" style={{ color: "var(--foreground-muted)" }}>Tiến độ: {Number(enrollment.progress || 0).toFixed(2)}%</p>
                                <div className="progress-bar mt-2"><div className="progress-fill" style={{ width: `${Math.min(100, enrollment.progress || 0)}%` }} /></div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {/* Grades (Bảng điểm) */}
              {tab === "grades" && (
                <div>
                  <h3 className="text-lg font-extrabold mb-4 flex items-center gap-2">
                    <Award className="w-5 h-5" style={{ color: "#f59e0b" }} /> Bảng điểm {child ? `— ${child.firstName || child.username}` : ""}
                  </h3>
                  {childGrades.length === 0 ? (
                    <div className="card-base text-center py-12">
                      <Award className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--foreground-muted)" }} />
                      <h3 className="font-bold mb-2">Chưa có bài tập nào</h3>
                      <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>Khi con nộp bài và giáo viên chấm điểm, kết quả sẽ hiển thị ở đây</p>
                    </div>
                  ) : (() => {
                    // Group by course
                    const courseMap = new Map<string, { title: string; subs: any[] }>();
                    for (const sub of childGrades) {
                      const cId = sub.assignment?.lesson?.section?.course?.id || "unknown";
                      const cTitle = sub.assignment?.lesson?.section?.course?.title || "Khóa học";
                      if (!courseMap.has(cId)) courseMap.set(cId, { title: cTitle, subs: [] });
                      courseMap.get(cId)!.subs.push(sub);
                    }
                    const courses = Array.from(courseMap.entries());

                    return (
                      <div className="space-y-6">
                        {courses.map(([courseId, { title: courseTitle, subs }]) => {
                          const graded = subs.filter((s: any) => s.status === "graded");
                          const avg = graded.length > 0
                            ? graded.reduce((s: number, g: any) => s + (g.score || 0), 0) / graded.length
                            : 0;
                          const pending = subs.filter((s: any) => s.status !== "graded").length;

                          return (
                            <div key={courseId} className="card-base overflow-hidden">
                              {/* Course header */}
                              <div className="flex items-center gap-3 mb-4 pb-3" style={{ borderBottom: "1px solid var(--border)" }}>
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(124,58,237,0.12)" }}>
                                  <BookOpen className="w-5 h-5" style={{ color: "#7c3aed" }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-bold text-sm truncate">{courseTitle}</h4>
                                  <div className="flex items-center gap-3 mt-0.5 text-[10px]" style={{ color: "var(--foreground-muted)" }}>
                                    <span>{graded.length} đã chấm</span>
                                    {pending > 0 && <span style={{ color: "#f59e0b" }}>⏳ {pending} chờ chấm</span>}
                                  </div>
                                </div>
                                {graded.length > 0 && (
                                  <div className="text-right flex-shrink-0">
                                    <p className="text-xl font-extrabold" style={{ color: avg >= 5 ? "#10b981" : "#ef4444" }}>{avg.toFixed(1)}</p>
                                    <p className="text-[10px]" style={{ color: "var(--foreground-muted)" }}>Điểm TB</p>
                                  </div>
                                )}
                              </div>

                              {/* Submissions list */}
                              <div className="space-y-2.5">
                                {subs.map((sub: any) => {
                                  const a = sub.assignment;
                                  const lesson = a?.lesson;
                                  const isGraded = sub.status === "graded";
                                  const maxS = a?.maxScore || 10;
                                  const pct = isGraded ? Math.min(100, (sub.score / maxS) * 100) : 0;
                                  const passed = pct >= 50;

                                  return (
                                    <div key={sub.id} className="p-3 rounded-xl" style={{
                                      background: "var(--muted)",
                                      borderLeft: isGraded ? `3px solid ${passed ? "#10b981" : "#f59e0b"}` : "3px solid var(--border)"
                                    }}>
                                      <div className="flex items-center justify-between gap-2 mb-1">
                                        <div className="flex-1 min-w-0">
                                          <p className="text-xs font-semibold truncate">{a?.title || "Bài tập"}</p>
                                          {lesson && <p className="text-[10px]" style={{ color: "var(--foreground-muted)" }}>{lesson.title}</p>}
                                        </div>
                                        {isGraded ? (
                                          <span className="text-lg font-extrabold flex-shrink-0" style={{ color: passed ? "#10b981" : "#ef4444" }}>
                                            {sub.score}<span className="text-[10px] font-normal" style={{ color: "var(--foreground-muted)" }}>/{maxS}</span>
                                          </span>
                                        ) : (
                                          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b" }}>⏳ Chờ</span>
                                        )}
                                      </div>
                                      {isGraded && (
                                        <>
                                          <div className="w-full h-1 rounded-full mb-1.5" style={{ background: "var(--border)" }}>
                                            <div className="h-full rounded-full" style={{
                                              width: `${pct}%`,
                                              background: passed ? "linear-gradient(to right, #10b981, #0891b2)" : "linear-gradient(to right, #ef4444, #f59e0b)"
                                            }} />
                                          </div>
                                          {sub.feedback && (
                                            <p className="text-[11px] mt-1 p-2 rounded-lg" style={{ background: "var(--background)", border: "1px solid var(--border)" }}>
                                              💬 {sub.feedback}
                                            </p>
                                          )}
                                          <p className="text-[10px] mt-1" style={{ color: "var(--foreground-muted)" }}>
                                            {sub.gradedAt ? new Date(sub.gradedAt).toLocaleString("vi-VN") : ""}
                                          </p>
                                        </>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}

                        {/* Overall summary */}
                        {childGrades.some((g: any) => g.status === "graded") && (
                          <div className="card-base" style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.08), rgba(8,145,178,0.05))" }}>
                            <h4 className="text-sm font-bold mb-3">📊 Tổng kết chung</h4>
                            <div className="grid grid-cols-4 gap-3 text-center">
                              <div>
                                <p className="text-xl font-extrabold" style={{ color: "#7c3aed" }}>{courses.length}</p>
                                <p className="text-[10px]" style={{ color: "var(--foreground-muted)" }}>Khóa học</p>
                              </div>
                              <div>
                                <p className="text-xl font-extrabold" style={{ color: "#10b981" }}>{childGrades.filter((g: any) => g.status === "graded").length}</p>
                                <p className="text-[10px]" style={{ color: "var(--foreground-muted)" }}>Đã chấm</p>
                              </div>
                              <div>
                                <p className="text-xl font-extrabold" style={{ color: "#0891b2" }}>
                                  {(() => {
                                    const g = childGrades.filter((x: any) => x.status === "graded");
                                    return g.length ? (g.reduce((s: number, x: any) => s + (x.score || 0), 0) / g.length).toFixed(1) : "—";
                                  })()}
                                </p>
                                <p className="text-[10px]" style={{ color: "var(--foreground-muted)" }}>Điểm TB</p>
                              </div>
                              <div>
                                <p className="text-xl font-extrabold" style={{ color: "#f59e0b" }}>{childGrades.filter((g: any) => g.status !== "graded").length}</p>
                                <p className="text-[10px]" style={{ color: "var(--foreground-muted)" }}>Chờ chấm</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
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
                            <div className="text-center mt-4">
                              <p className="text-2xl font-extrabold gradient-text mb-3">
                                {(order.finalPrice || order.totalPrice || 0).toLocaleString()} ₫
                              </p>
                              <div 
                                className="w-48 h-48 mx-auto rounded-xl flex items-center justify-center mb-3 cursor-pointer hover:opacity-80 transition-opacity" 
                                style={{ background: "white", border: "2px solid var(--border)" }}
                                onClick={() => {
                                  const imgUrl = `https://img.vietqr.io/image/MB-0389999999-compact2.png?amount=${order.finalPrice || order.totalPrice || 0}&addInfo=${encodeURIComponent(`HL-${order.id?.substring(0, 8)}`)}&accountName=${encodeURIComponent('NGUYEN VAN MINH')}`;
                                  setQrPopup({ url: imgUrl, amount: order.finalPrice || order.totalPrice || 0, id: order.id });
                                }}
                              >
                                <img
                                  src={`https://img.vietqr.io/image/MB-0389999999-compact2.png?amount=${order.finalPrice || order.totalPrice || 0}&addInfo=${encodeURIComponent(`HL-${order.id?.substring(0, 8)}`)}&accountName=${encodeURIComponent('NGUYEN VAN MINH')}`}
                                  alt="QR" className="w-44 h-44 object-contain pointer-events-none"
                                  onError={(e) => { (e.target as HTMLImageElement).src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`Thanh toan ${order.finalPrice || order.totalPrice} VND`)}`; }}
                                />
                              </div>
                              <p className="text-xs mb-2" style={{ color: "var(--foreground-muted)" }}>Nhấn vào mã QR để phóng to</p>
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
