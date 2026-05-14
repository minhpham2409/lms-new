"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/components/auth/auth-state";
import {
  Users,
  BookOpen,
  TrendingUp,
  Award,
  BarChart3,
  Calendar,
  Loader2,
  UserPlus,
  UserMinus,
  CheckCircle2,
  XCircle,
  Send,
  RefreshCw,
  CreditCard,
  Clock,
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
  const [_childProgress, setChildProgress] = useState<any>(null);
  const [outgoingRequests, setOutgoingRequests] = useState<any[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [linkUsername, setLinkUsername] = useState("");
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [childGrades, setChildGrades] = useState<any[]>([]);
  const [tab, setTab] = useState<
    "overview" | "courses" | "grades" | "payments" | "requests"
  >("overview");
  const [qrPopup, setQrPopup] = useState<{
    url: string;
    amount: number;
    id: string;
  } | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isLoggedIn) {
      router.push("/auth/login");
      return;
    }
    if (user?.role !== "parent") {
      if (user?.role === "admin") router.push("/admin");
      else if (user?.role === "teacher") router.push("/teacher");
      else router.push("/dashboard");
    }
  }, [user, isLoggedIn, authLoading, router]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (token && user?.role === "parent") fetchAll();
  }, [token, user]);

  async function fetchAll() {
    setDataLoading(true);
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [childrenR, outR, inR] = await Promise.all([
        fetch(`${API}/parents/me/children`, { headers }).then((r) =>
          r.ok ? r.json() : [],
        ),
        fetch(`${API}/parents/link-requests/outgoing`, { headers }).then((r) =>
          r.ok ? r.json() : [],
        ),
        fetch(`${API}/parents/link-requests/incoming`, { headers }).then((r) =>
          r.ok ? r.json() : [],
        ),
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
        console.log("Checking orders for kid:", kid, "childId:", childId);
        if (!childId) continue;
        try {
          const ordersR = await fetch(
            `${API}/parents/children/${childId}/orders`,
            { headers },
          ).then((r) => {
            console.log("Orders for child", childId, "status:", r.status);
            return r.ok ? r.json() : [];
          });
          // filter for pending orders (parent sees child’s pending)
          if (Array.isArray(ordersR)) {
            ordersR
              .filter((o: any) => o.status === "pending")
              .forEach((o: any) =>
                allOrders.push({
                  ...o,
                  childName:
                    kid.child?.firstName || kid.child?.username || "Con",
                }),
              );
          }
        } catch {}
      }
      setPendingOrders(allOrders);
    } catch {
    } finally {
      setDataLoading(false);
    }
  }

  async function selectChild(c: any) {
    setSelectedChild(c);
    const childId = c.child?.id || c.childId;
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [coursesR, dashR, progressR, gradesR] = await Promise.all([
        fetch(`${API}/parents/children/${childId}/courses`, { headers }).then(
          (r) => (r.ok ? r.json() : []),
        ),
        fetch(`${API}/parents/children/${childId}/dashboard`, { headers }).then(
          (r) => (r.ok ? r.json() : null),
        ),
        fetch(`${API}/parents/children/${childId}/progress`, { headers }).then(
          (r) => (r.ok ? r.json() : null),
        ),
        fetch(`${API}/parents/children/${childId}/grades`, { headers }).then(
          (r) => (r.ok ? r.json() : []),
        ),
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
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ identifier: linkUsername.trim() }),
      });
      if (res.ok) {
        setLinkUsername("");
        toast.success("Đã gửi yêu cầu liên kết! Chờ học sinh xác nhận.");
        fetchAll();
      } else {
        const d = await res.json();
        toast.error(d.message || "Không tìm thấy học sinh");
      }
    } catch {
      toast.error("Lỗi kết nối");
    }
  }

  async function acceptRequest(id: string) {
    try {
      const res = await fetch(`${API}/parents/link-request/${id}/accept`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success("Đã chấp nhận!");
        fetchAll();
      }
    } catch {
      toast.error("Lỗi");
    }
  }

  async function rejectRequest(id: string) {
    try {
      const res = await fetch(`${API}/parents/link-request/${id}/reject`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success("Đã từ chối");
        fetchAll();
      }
    } catch {
      toast.error("Lỗi");
    }
  }

  async function deleteRequest(id: string) {
    try {
      await fetch(`${API}/parents/link-requests/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Đã xóa");
      fetchAll();
    } catch {
      toast.error("Lỗi");
    }
  }

  async function unlinkChild(childId: string) {
    if (!confirm("Hủy liên kết với con?")) return;
    try {
      await fetch(`${API}/parents/children/${childId}/link`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Đã hủy liên kết");
      setSelectedChild(null);
      fetchAll();
    } catch {
      toast.error("Lỗi");
    }
  }

  if (authLoading || !user || user.role !== "parent") {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--background)" }}
      >
        <div className="w-8 h-8 border-2 border-[#f59e0b] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const child = selectedChild?.child || selectedChild;
  const gradedCount = childGrades.filter(
    (g: any) => g.status === "graded",
  ).length;
  const tabs = [
    { id: "requests" as const, label: "Liên kết", icon: UserPlus },
    { id: "overview" as const, label: "Tổng quan", icon: BarChart3 },
    { id: "courses" as const, label: "Khóa học", icon: BookOpen },
    {
      id: "grades" as const,
      label: "Bảng điểm",
      icon: Award,
      badge: gradedCount,
    },
    {
      id: "payments" as const,
      label: "Thanh toán",
      icon: CreditCard,
      badge: pendingOrders.length,
    },
  ];

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <Navbar />

      {/* QR Popup overlay */}
      {qrPopup && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm"
          style={{ background: "rgba(0,0,0,0.7)" }}
          onClick={() => setQrPopup(null)}
        >
          <div
            className="card-base max-w-sm w-full text-center relative p-8 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setQrPopup(null)}
              className="absolute top-4 right-4 opacity-70 hover:opacity-100 transition-opacity"
            >
              <XCircle className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold mb-2">Quét mã thanh toán</h2>
            <p
              className="text-sm mb-6"
              style={{ color: "var(--foreground-muted)" }}
            >
              Đơn hàng{" "}
              <span className="font-mono" style={{ color: "#7c3aed" }}>
                #{qrPopup.id?.substring(0, 8)}
              </span>
            </p>
            <div className="bg-white p-2 rounded-2xl mx-auto w-fit mb-6">
              <img
                src={qrPopup.url}
                alt="QR Code Lớn"
                className="w-72 h-72 object-contain"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  (e.target as HTMLImageElement).src =
                    `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`Thanh toan ${qrPopup.amount} VND`)}`;
                }}
              />
            </div>
            <p className="text-3xl font-extrabold gradient-text mb-2">
              {qrPopup.amount.toLocaleString()} ₫
            </p>
            <p className="text-xs" style={{ color: "#f59e0b" }}>
              Dùng ứng dụng ngân hàng để quét mã QR
            </p>
          </div>
        </div>
      )}

      <div className="pt-20 pb-24">
        {/* Hero Header */}
        <div
          className="relative overflow-hidden mb-8"
          style={{
            background:
              "linear-gradient(135deg, rgba(124,58,237,0.05) 0%, rgba(8,145,178,0.05) 100%)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h1
                  className="text-3xl font-extrabold mb-2 bg-clip-text text-transparent"
                  style={{
                    backgroundImage:
                      "linear-gradient(135deg, #7c3aed, #0891b2)",
                  }}
                >
                  Phụ huynh Dashboard
                </h1>
                <p
                  className="text-base font-medium"
                  style={{ color: "var(--foreground-muted)" }}
                >
                  Đồng hành cùng bước tiến học tập của con bạn mỗi ngày.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={fetchAll}
                  className="btn-secondary px-5 py-2.5 shadow-sm hover:shadow transition-all"
                >
                  <RefreshCw className="w-4 h-4" /> Làm mới dữ liệu
                </button>
              </div>
            </div>
          </div>
          {/* Decorative shapes */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl translate-y-1/2"></div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {dataLoading ? (
            <div className="flex justify-center py-20">
              <Loader2
                className="w-10 h-10 animate-spin"
                style={{ color: "#7c3aed" }}
              />
            </div>
          ) : (
            <>
              {/* Link child input */}
              <div
                className="card-base mb-8 border-none shadow-lg relative overflow-hidden"
                style={{ background: "var(--card)" }}
              >
                <div
                  className="absolute inset-0 opacity-20 pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, rgba(124,58,237,0.1), transparent)",
                  }}
                ></div>
                <div className="flex flex-col sm:flex-row gap-4 items-center relative z-10">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-inner"
                    style={{ background: "rgba(124,58,237,0.1)" }}
                  >
                    <UserPlus
                      className="w-6 h-6"
                      style={{ color: "#7c3aed" }}
                    />
                  </div>
                  <div className="flex-1 w-full">
                    <h3 className="font-bold text-sm mb-1">
                      Kết nối tài khoản học sinh
                    </h3>
                    <div className="flex gap-2">
                      <input
                        value={linkUsername}
                        onChange={(e) => setLinkUsername(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && linkChild()}
                        placeholder="Nhập email hoặc username của con..."
                        className="input-base flex-1 bg-transparent"
                        style={{
                          border: "2px solid var(--border)",
                          boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)",
                        }}
                      />
                      <button
                        onClick={linkChild}
                        className="btn-primary px-6 shadow-md shadow-purple-500/20 hover:shadow-lg hover:shadow-purple-500/30 transition-all"
                      >
                        <Send className="w-4 h-4" /> Gửi yêu cầu
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Children selector */}
              {children.length > 0 && (
                <div className="mb-8">
                  <h3
                    className="text-sm font-bold mb-4 flex items-center gap-2"
                    style={{ color: "var(--foreground-muted)" }}
                  >
                    <Users className="w-4 h-4" /> Học sinh của bạn
                  </h3>
                  <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                    {children.map((c) => {
                      const kid = c.child || c;
                      const isActive = child?.id === kid.id;
                      return (
                        <button
                          key={c.id}
                          onClick={() => selectChild(c)}
                          className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all whitespace-nowrap min-w-[200px] relative overflow-hidden group ${isActive ? "shadow-lg shadow-purple-500/10" : "hover:shadow-md"}`}
                          style={{
                            background: isActive
                              ? "var(--card)"
                              : "var(--muted)",
                            border: `2px solid ${isActive ? "#7c3aed" : "transparent"}`,
                            transform: isActive ? "scale(1.02)" : "scale(1)",
                          }}
                        >
                          {isActive && (
                            <div
                              className="absolute inset-0 opacity-10"
                              style={{
                                background:
                                  "linear-gradient(135deg, #7c3aed, #0891b2)",
                              }}
                            ></div>
                          )}
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold text-white shadow-inner relative z-10"
                            style={{
                              background: isActive
                                ? "linear-gradient(135deg, #7c3aed, #0891b2)"
                                : "var(--border)",
                              color: isActive ? "white" : "var(--foreground)",
                            }}
                          >
                            {(kid.firstName || kid.username || "?")
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                          <div className="text-left relative z-10">
                            <p
                              className={`font-bold text-base ${isActive ? "text-[var(--primary)]" : ""}`}
                            >
                              {kid.firstName || kid.username}
                            </p>
                            <p
                              className="text-xs"
                              style={{ color: "var(--foreground-muted)" }}
                            >
                              {kid.email}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tabs */}
              <div
                className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide border-b"
                style={{ borderColor: "var(--border)" }}
              >
                {tabs.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className="flex items-center gap-2 px-5 py-3 rounded-t-xl text-sm font-bold transition-all whitespace-nowrap relative"
                    style={{
                      color:
                        tab === t.id
                          ? "var(--foreground)"
                          : "var(--foreground-muted)",
                      background: tab === t.id ? "var(--card)" : "transparent",
                    }}
                  >
                    <t.icon
                      className={`w-4 h-4 ${tab === t.id ? "text-[#7c3aed]" : ""}`}
                    />{" "}
                    {t.label}
                    {(t as any).badge > 0 && (
                      <span
                        className="w-5 h-5 rounded-full text-[10px] flex items-center justify-center text-white shadow-sm"
                        style={{ background: "#ef4444" }}
                      >
                        {(t as any).badge}
                      </span>
                    )}
                    {t.id === "requests" &&
                      incomingRequests.length + outgoingRequests.length > 0 &&
                      !(t as any).badge && (
                        <span
                          className="w-5 h-5 rounded-full text-[10px] flex items-center justify-center text-white shadow-sm"
                          style={{ background: "#ef4444" }}
                        >
                          {incomingRequests.length + outgoingRequests.length}
                        </span>
                      )}
                    {tab === t.id && (
                      <div
                        className="absolute bottom-0 left-0 right-0 h-0.5"
                        style={{
                          background: "#7c3aed",
                          boxShadow: "0 -2px 10px rgba(124,58,237,0.5)",
                        }}
                      ></div>
                    )}
                  </button>
                ))}
              </div>

              {/* Overview */}
              {tab === "overview" && child && (
                <>
                  {/* Child profile card */}
                  <div
                    className="card-base mb-6"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(124,58,237,0.08), rgba(8,145,178,0.05))",
                    }}
                  >
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-4">
                        <div
                          className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white"
                          style={{
                            background:
                              "linear-gradient(135deg, #7c3aed, #0891b2)",
                          }}
                        >
                          {(child.firstName || child.username || "?")
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                        <div>
                          <h2 className="text-lg font-extrabold">
                            {child.firstName
                              ? `${child.firstName} ${child.lastName || ""}`.trim()
                              : child.username}
                          </h2>
                          <p
                            className="text-sm"
                            style={{ color: "var(--foreground-muted)" }}
                          >
                            {child.email}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <span
                              className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                              style={{
                                background: "rgba(16,185,129,0.15)",
                                color: "#10b981",
                              }}
                            >
                              {child.isActive !== false
                                ? "Đang hoạt động"
                                : "Không hoạt động"}
                            </span>
                            {child.createdAt && (
                              <span
                                className="text-[10px] flex items-center gap-1"
                                style={{ color: "var(--foreground-muted)" }}
                              >
                                <Calendar className="w-3 h-3" /> Tham gia{" "}
                                {new Date(child.createdAt).toLocaleDateString(
                                  "vi-VN",
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => unlinkChild(child.id)}
                        className="btn-ghost text-xs"
                        style={{ color: "#ef4444" }}
                      >
                        <UserMinus className="w-3 h-3" /> Hủy liên kết
                      </button>
                    </div>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
                    {[
                      {
                        label: "Khóa học",
                        value:
                          childDashboard?.enrollments?.length ??
                          childCourses.length,
                        icon: BookOpen,
                        color: "#7c3aed",
                        sub: "đã đăng ký",
                      },
                      {
                        label: "Bài học xong",
                        value:
                          childDashboard?.activity?.videoLessonsCompleted ?? 0,
                        icon: CheckCircle2,
                        color: "#10b981",
                        sub: "hoàn thành",
                      },
                      {
                        label: "Quiz đã làm",
                        value: childDashboard?.activity?.quizAttempts ?? 0,
                        icon: Award,
                        color: "#f59e0b",
                        sub: "lần làm quiz",
                      },
                      {
                        label: "Bài tập nộp",
                        value:
                          childDashboard?.activity?.assignmentSubmissions ?? 0,
                        icon: TrendingUp,
                        color: "#0891b2",
                        sub: "bài tập",
                      },
                      {
                        label: "Chứng chỉ",
                        value: childDashboard?.certificates?.length ?? 0,
                        icon: Award,
                        color: "#ec4899",
                        sub: "đã nhận",
                      },
                    ].map(({ label, value, icon: Icon, color, sub }) => (
                      <div key={label} className="card-base text-center py-4">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2"
                          style={{ background: `${color}18` }}
                        >
                          <Icon className="w-5 h-5" style={{ color }} />
                        </div>
                        <p className="text-2xl font-extrabold">{value}</p>
                        <p
                          className="text-[10px] mt-0.5"
                          style={{ color: "var(--foreground-muted)" }}
                        >
                          {sub}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="grid lg:grid-cols-2 gap-6">
                    {/* Enrollments with progress */}
                    <div className="card-base border-none shadow-md">
                      <h3 className="font-extrabold text-base mb-5 flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-purple-500/10">
                          <BookOpen className="w-5 h-5 text-purple-500" />
                        </div>{" "}
                        Tiến độ môn học
                      </h3>
                      {(childDashboard?.enrollments || childCourses || [])
                        .length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 opacity-60">
                          <BookOpen className="w-12 h-12 mb-3" />
                          <p className="text-sm font-medium">
                            Chưa tham gia khóa học nào
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                          {(
                            childDashboard?.enrollments ||
                            childCourses ||
                            []
                          ).map((e: any) => {
                            const course = e.course || e;
                            const totalL = e.stats?.totalLessons || 0;
                            const doneL = e.stats?.completedLessons || 0;
                            const pct =
                              totalL > 0
                                ? Math.round((doneL / totalL) * 100)
                                : e.progress || 0;
                            return (
                              <div
                                key={e.id}
                                className="p-4 rounded-2xl border transition-all hover:shadow-md"
                                style={{
                                  background: "var(--card)",
                                  borderColor: "var(--border)",
                                }}
                              >
                                <div className="flex justify-between items-start mb-3">
                                  <div className="flex-1 pr-4">
                                    <h4 className="font-bold text-sm leading-tight">
                                      {course.title}
                                    </h4>
                                    <p
                                      className="text-xs mt-1"
                                      style={{
                                        color: "var(--foreground-muted)",
                                      }}
                                    >
                                      {e.status === "pending"
                                        ? "Đang chờ giáo viên duyệt"
                                        : "Tiến độ học tập"}
                                    </p>
                                  </div>
                                  <div
                                    className="w-12 h-12 rounded-full flex items-center justify-center border-4"
                                    style={{
                                      borderColor:
                                        pct >= 100
                                          ? "#10b981"
                                          : pct > 0
                                            ? "#7c3aed"
                                            : "var(--muted)",
                                    }}
                                  >
                                    <span className="text-xs font-bold">
                                      {pct}%
                                    </span>
                                  </div>
                                </div>
                                <div
                                  className="w-full h-2.5 rounded-full overflow-hidden"
                                  style={{ background: "var(--muted)" }}
                                >
                                  <div
                                    className="h-full rounded-full transition-all duration-1000 ease-out relative"
                                    style={{
                                      width: `${pct}%`,
                                      background:
                                        pct >= 100
                                          ? "#10b981"
                                          : "linear-gradient(90deg, #7c3aed, #c084fc)",
                                    }}
                                  >
                                    {pct > 0 && pct < 100 && (
                                      <div className="absolute top-0 right-0 bottom-0 w-8 bg-white/30 animate-pulse"></div>
                                    )}
                                  </div>
                                </div>
                                <div
                                  className="flex justify-between text-[11px] font-semibold mt-2"
                                  style={{ color: "var(--foreground-muted)" }}
                                >
                                  <span>
                                    {doneL} / {totalL} Bài
                                  </span>
                                  <span
                                    style={{
                                      color: pct >= 100 ? "#10b981" : "inherit",
                                    }}
                                  >
                                    {pct >= 100 ? "🎉 Hoàn thành" : "Đang học"}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Right column: Activity & Certs */}
                    <div className="space-y-6">
                      <div className="card-base border-none shadow-md bg-gradient-to-br from-indigo-500/5 to-purple-500/5">
                        <h3 className="font-extrabold text-base mb-5 flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-blue-500/10">
                            <BarChart3 className="w-5 h-5 text-blue-500" />
                          </div>{" "}
                          Tổng quan Hoạt động
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            {
                              icon: "🎬",
                              label: "Video đã xem",
                              value:
                                childDashboard?.activity
                                  ?.videoLessonsCompleted ?? 0,
                              color: "text-blue-500",
                            },
                            {
                              icon: "📝",
                              label: "Quiz đã làm",
                              value:
                                childDashboard?.activity?.quizAttempts ?? 0,
                              color: "text-orange-500",
                            },
                            {
                              icon: "📄",
                              label: "Bài nộp",
                              value:
                                childDashboard?.activity
                                  ?.assignmentSubmissions ?? 0,
                              color: "text-emerald-500",
                            },
                            {
                              icon: "🏆",
                              label: "Chứng chỉ",
                              value: childDashboard?.certificates?.length ?? 0,
                              color: "text-pink-500",
                            },
                          ].map(({ icon, label, value, color }) => (
                            <div
                              key={label}
                              className="p-4 rounded-2xl bg-white/50 dark:bg-black/20 border border-white/20 shadow-sm backdrop-blur-sm"
                            >
                              <div className="text-2xl mb-2">{icon}</div>
                              <div className={`text-2xl font-black ${color}`}>
                                {value}
                              </div>
                              <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mt-1">
                                {label}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Certificates */}
                      <div className="card-base border-none shadow-md">
                        <h3 className="font-extrabold text-base mb-4 flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-amber-500/10">
                            <Award className="w-5 h-5 text-amber-500" />
                          </div>{" "}
                          Thành tựu & Chứng chỉ
                        </h3>
                        {(childDashboard?.certificates || []).length === 0 ? (
                          <div className="text-center py-6">
                            <p className="text-sm text-gray-500">
                              Chưa có chứng chỉ nào
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {(childDashboard?.certificates || []).map(
                              (cert: any) => (
                                <div
                                  key={cert.id}
                                  className="group relative flex items-center gap-4 p-4 rounded-2xl overflow-hidden"
                                  style={{
                                    background: "var(--card)",
                                    border: "1px solid var(--border)",
                                  }}
                                >
                                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                  <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0 relative z-10 shadow-inner">
                                    <Award className="w-6 h-6 text-amber-500" />
                                  </div>
                                  <div className="flex-1 min-w-0 relative z-10">
                                    <p className="font-bold text-sm truncate group-hover:text-amber-600 transition-colors">
                                      {cert.course?.title || "Khóa học"}
                                    </p>
                                    <p className="text-[11px] mt-0.5 text-gray-500">
                                      Cấp ngày:{" "}
                                      <span className="font-medium text-gray-700 dark:text-gray-300">
                                        {cert.issuedAt
                                          ? new Date(
                                              cert.issuedAt,
                                            ).toLocaleDateString("vi-VN")
                                          : "—"}
                                      </span>
                                    </p>
                                  </div>
                                  <div className="text-right relative z-10">
                                    <span className="inline-block px-2.5 py-1 text-[10px] font-mono font-bold bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                                      #{cert.code || cert.id?.substring(0, 6)}
                                    </span>
                                  </div>
                                </div>
                              ),
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {tab === "overview" && !child && children.length === 0 && (
                <div className="card-base text-center py-12">
                  <Users
                    className="w-12 h-12 mx-auto mb-4"
                    style={{ color: "var(--foreground-muted)" }}
                  />
                  <h3 className="font-bold mb-2">Chưa liên kết con em</h3>
                  <p
                    className="text-sm"
                    style={{ color: "var(--foreground-muted)" }}
                  >
                    Nhập username ở trên để bắt đầu theo dõi
                  </p>
                </div>
              )}

              {/* Courses */}
              {tab === "courses" && (
                <div className="space-y-6">
                  <h3 className="font-extrabold text-xl mb-6 flex items-center gap-3">
                    <div className="p-2 bg-purple-500/10 rounded-xl">
                      <BookOpen className="w-6 h-6 text-purple-500" />
                    </div>{" "}
                    Khóa học đang theo học
                  </h3>
                  {childCourses.length === 0 ? (
                    <div className="card-base text-center py-16 border-dashed border-2 border-gray-200 dark:border-gray-800 bg-transparent">
                      <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-700" />
                      <p className="text-base font-semibold text-gray-500">
                        Con chưa tham gia khóa học nào
                      </p>
                    </div>
                  ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {childCourses.map((enrollment: any) => {
                        const course = enrollment.course || enrollment;
                        const pct = Math.min(
                          100,
                          Number(enrollment.progress || 0),
                        );
                        return (
                          <div
                            key={enrollment.id}
                            className="card-base group hover:-translate-y-1 hover:shadow-xl transition-all duration-300 relative overflow-hidden"
                            style={{ border: "1px solid var(--border)" }}
                          >
                            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-150 transition-transform duration-700">
                              <BookOpen className="w-32 h-32" />
                            </div>
                            <div className="flex items-start gap-4 mb-6 relative z-10">
                              <div className="w-14 h-14 rounded-2xl flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-purple-500 to-indigo-500 shadow-lg shadow-purple-500/30 text-white">
                                <BookOpen className="w-7 h-7" />
                              </div>
                              <div className="flex-1 min-w-0 pt-1">
                                <h4 className="font-bold text-base truncate group-hover:text-purple-500 transition-colors">
                                  {course.title}
                                </h4>
                                <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                                  {course.category || "Học tập"}
                                </span>
                              </div>
                            </div>
                            <div className="relative z-10">
                              <div className="flex justify-between text-xs mb-2 font-semibold">
                                <span className="text-gray-500">Tiến độ</span>
                                <span
                                  className={`${pct >= 100 ? "text-emerald-500" : "text-purple-500"}`}
                                >
                                  {pct.toFixed(0)}%
                                </span>
                              </div>
                              <div className="w-full h-2 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                                <div
                                  className="h-full rounded-full transition-all duration-1000 ease-out"
                                  style={{
                                    width: `${pct}%`,
                                    background:
                                      pct >= 100
                                        ? "#10b981"
                                        : "linear-gradient(90deg, #7c3aed, #4f46e5)",
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Grades (Bảng điểm) */}
              {tab === "grades" && (
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-extrabold flex items-center gap-3">
                      <div className="p-2 bg-amber-500/10 rounded-xl">
                        <Award className="w-6 h-6 text-amber-500" />
                      </div>{" "}
                      Bảng điểm{" "}
                      {child ? `của ${child.firstName || child.username}` : ""}
                    </h3>
                  </div>

                  {childGrades.length === 0 ? (
                    <div className="card-base text-center py-20 border-dashed border-2 border-gray-200 dark:border-gray-800 bg-transparent">
                      <Award className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-700" />
                      <h3 className="font-bold text-lg mb-2 text-gray-400">
                        Chưa có bài tập nào được chấm
                      </h3>
                      <p className="text-sm text-gray-500">
                        Khi con nộp bài và giáo viên chấm điểm, kết quả sẽ hiển
                        thị ở đây.
                      </p>
                    </div>
                  ) : (
                    (() => {
                      const courseMap = new Map<
                        string,
                        { title: string; subs: any[] }
                      >();
                      for (const sub of childGrades) {
                        const cId =
                          sub.assignment?.lesson?.section?.course?.id ||
                          "unknown";
                        const cTitle =
                          sub.assignment?.lesson?.section?.course?.title ||
                          "Khóa học";
                        if (!courseMap.has(cId))
                          courseMap.set(cId, { title: cTitle, subs: [] });
                        courseMap.get(cId)!.subs.push(sub);
                      }
                      const courses = Array.from(courseMap.entries());

                      return (
                        <div className="grid gap-8">
                          {courses.map(
                            ([courseId, { title: courseTitle, subs }]) => {
                              const graded = subs.filter(
                                (s: any) => s.status === "graded",
                              );
                              const avg =
                                graded.length > 0
                                  ? graded.reduce(
                                      (s: number, g: any) => s + (g.score || 0),
                                      0,
                                    ) / graded.length
                                  : 0;
                              const pending = subs.filter(
                                (s: any) => s.status !== "graded",
                              ).length;

                              return (
                                <div
                                  key={courseId}
                                  className="card-base border-none shadow-lg overflow-hidden p-0 relative"
                                >
                                  <div
                                    className="absolute top-0 left-0 right-0 h-1"
                                    style={{
                                      background:
                                        avg >= 8
                                          ? "linear-gradient(90deg, #10b981, #34d399)"
                                          : avg >= 5
                                            ? "linear-gradient(90deg, #f59e0b, #fbbf24)"
                                            : "linear-gradient(90deg, #ef4444, #f87171)",
                                    }}
                                  ></div>
                                  <div className="p-6">
                                    {/* Course header */}
                                    <div className="flex items-center justify-between gap-4 mb-6 pb-6 border-b border-gray-100 dark:border-gray-800">
                                      <div className="flex items-center gap-4 flex-1 min-w-0">
                                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                                          <BookOpen className="w-6 h-6 text-gray-500" />
                                        </div>
                                        <div>
                                          <h4 className="font-bold text-lg truncate">
                                            {courseTitle}
                                          </h4>
                                          <div className="flex items-center gap-3 mt-1 text-xs font-medium text-gray-500">
                                            <span>
                                              {graded.length} bài đã chấm
                                            </span>
                                            {pending > 0 && (
                                              <span className="text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
                                                ⏳ {pending} chờ chấm
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                      {graded.length > 0 && (
                                        <div className="text-center px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
                                          <p
                                            className="text-3xl font-black"
                                            style={{
                                              color:
                                                avg >= 8
                                                  ? "#10b981"
                                                  : avg >= 5
                                                    ? "#f59e0b"
                                                    : "#ef4444",
                                            }}
                                          >
                                            {avg.toFixed(1)}
                                          </p>
                                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                            Trung bình
                                          </p>
                                        </div>
                                      )}
                                    </div>

                                    {/* Submissions list */}
                                    <div className="space-y-4">
                                      {subs.map((sub: any) => {
                                        const a = sub.assignment;
                                        const lesson = a?.lesson;
                                        const isGraded =
                                          sub.status === "graded";
                                        const maxS = a?.maxScore || 10;
                                        const pct = isGraded
                                          ? Math.min(
                                              100,
                                              (sub.score / maxS) * 100,
                                            )
                                          : 0;
                                        const passed = pct >= 50;

                                        return (
                                          <div
                                            key={sub.id}
                                            className="group relative p-4 rounded-2xl transition-all hover:bg-gray-50 dark:hover:bg-gray-800/50 border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                                          >
                                            <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
                                              <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                  <h5 className="font-bold text-sm text-gray-900 dark:text-gray-100">
                                                    {a?.title || "Bài tập"}
                                                  </h5>
                                                  {!isGraded && (
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                                      Đang chấm
                                                    </span>
                                                  )}
                                                </div>
                                                {lesson && (
                                                  <p className="text-xs text-gray-500 flex items-center gap-1">
                                                    <BookOpen className="w-3 h-3" />{" "}
                                                    {lesson.title}
                                                  </p>
                                                )}
                                              </div>

                                              {isGraded && (
                                                <div className="flex items-center gap-6">
                                                  <div className="w-32 hidden sm:block">
                                                    <div className="w-full h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                                                      <div
                                                        className="h-full rounded-full"
                                                        style={{
                                                          width: `${pct}%`,
                                                          background: passed
                                                            ? "#10b981"
                                                            : "#ef4444",
                                                        }}
                                                      />
                                                    </div>
                                                  </div>
                                                  <div className="text-right min-w-[60px]">
                                                    <span
                                                      className="text-2xl font-black"
                                                      style={{
                                                        color: passed
                                                          ? "#10b981"
                                                          : "#ef4444",
                                                      }}
                                                    >
                                                      {sub.score}
                                                    </span>
                                                    <span className="text-xs text-gray-400 font-medium">
                                                      /{maxS}
                                                    </span>
                                                  </div>
                                                </div>
                                              )}
                                            </div>

                                            {isGraded && sub.feedback && (
                                              <div className="mt-4 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 text-sm text-blue-800 dark:text-blue-200 relative">
                                                <div className="absolute -top-2 left-4 w-4 h-4 bg-blue-50 dark:bg-[#1e1b4b] border-t border-l border-blue-100 dark:border-blue-900/30 rotate-45"></div>
                                                <span className="font-bold mr-2">
                                                  Nhận xét:
                                                </span>
                                                {sub.feedback}
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>
                              );
                            },
                          )}

                          {/* Overall summary */}
                          {childGrades.some(
                            (g: any) => g.status === "graded",
                          ) && (
                            <div
                              className="card-base"
                              style={{
                                background:
                                  "linear-gradient(135deg, rgba(124,58,237,0.08), rgba(8,145,178,0.05))",
                              }}
                            >
                              <h4 className="text-sm font-bold mb-3">
                                📊 Tổng kết chung
                              </h4>
                              <div className="grid grid-cols-4 gap-3 text-center">
                                <div>
                                  <p
                                    className="text-xl font-extrabold"
                                    style={{ color: "#7c3aed" }}
                                  >
                                    {courses.length}
                                  </p>
                                  <p
                                    className="text-[10px]"
                                    style={{ color: "var(--foreground-muted)" }}
                                  >
                                    Khóa học
                                  </p>
                                </div>
                                <div>
                                  <p
                                    className="text-xl font-extrabold"
                                    style={{ color: "#10b981" }}
                                  >
                                    {
                                      childGrades.filter(
                                        (g: any) => g.status === "graded",
                                      ).length
                                    }
                                  </p>
                                  <p
                                    className="text-[10px]"
                                    style={{ color: "var(--foreground-muted)" }}
                                  >
                                    Đã chấm
                                  </p>
                                </div>
                                <div>
                                  <p
                                    className="text-xl font-extrabold"
                                    style={{ color: "#0891b2" }}
                                  >
                                    {(() => {
                                      const g = childGrades.filter(
                                        (x: any) => x.status === "graded",
                                      );
                                      return g.length
                                        ? (
                                            g.reduce(
                                              (s: number, x: any) =>
                                                s + (x.score || 0),
                                              0,
                                            ) / g.length
                                          ).toFixed(1)
                                        : "—";
                                    })()}
                                  </p>
                                  <p
                                    className="text-[10px]"
                                    style={{ color: "var(--foreground-muted)" }}
                                  >
                                    Điểm TB
                                  </p>
                                </div>
                                <div>
                                  <p
                                    className="text-xl font-extrabold"
                                    style={{ color: "#f59e0b" }}
                                  >
                                    {
                                      childGrades.filter(
                                        (g: any) => g.status !== "graded",
                                      ).length
                                    }
                                  </p>
                                  <p
                                    className="text-[10px]"
                                    style={{ color: "var(--foreground-muted)" }}
                                  >
                                    Chờ chấm
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()
                  )}
                </div>
              )}

              {/* Payments */}
              {tab === "payments" && (
                <div>
                  <h3 className="text-lg font-extrabold mb-4 flex items-center gap-2">
                    <CreditCard
                      className="w-5 h-5"
                      style={{ color: "#7c3aed" }}
                    />{" "}
                    Thanh toán chờ xử lý
                  </h3>
                  {pendingOrders.length === 0 ? (
                    <div className="card-base text-center py-12">
                      <CheckCircle2
                        className="w-12 h-12 mx-auto mb-3"
                        style={{ color: "#10b981" }}
                      />
                      <h3 className="font-bold mb-2">
                        Không có thanh toán chờ
                      </h3>
                      <p
                        className="text-sm"
                        style={{ color: "var(--foreground-muted)" }}
                      >
                        Tất cả đơn hàng đã được xử lý
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pendingOrders.map((order: any) => (
                        <div key={order.id} className="card-base">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <p className="text-sm font-semibold">
                                Đơn hàng #{order.id?.substring(0, 8)}
                              </p>
                              <p
                                className="text-xs"
                                style={{ color: "var(--foreground-muted)" }}
                              >
                                Từ: <strong>{order.childName || "Con"}</strong>{" "}
                                •{" "}
                                {order.createdAt
                                  ? new Date(
                                      order.createdAt,
                                    ).toLocaleDateString("vi-VN")
                                  : ""}
                              </p>
                            </div>
                            <span className="badge badge-warning text-[10px]">
                              Chờ thanh toán
                            </span>
                          </div>
                          {order.items?.map((item: any) => (
                            <p
                              key={item.id}
                              className="text-sm mb-1"
                              style={{ color: "var(--foreground-muted)" }}
                            >
                              • {item.course?.title || "Khóa học"}
                            </p>
                          ))}
                          <div className="text-center mt-4">
                            <p className="text-2xl font-extrabold gradient-text mb-3">
                              {(
                                order.finalPrice ||
                                order.totalPrice ||
                                0
                              ).toLocaleString()}{" "}
                              ₫
                            </p>
                            <div
                              className="w-48 h-48 mx-auto rounded-xl flex items-center justify-center mb-3 cursor-pointer hover:opacity-80 transition-opacity"
                              style={{
                                background: "white",
                                border: "2px solid var(--border)",
                              }}
                              onClick={() => {
                                const imgUrl = `https://img.vietqr.io/image/MB-0389999999-compact2.png?amount=${order.finalPrice || order.totalPrice || 0}&addInfo=${encodeURIComponent(`HL-${order.id?.substring(0, 8)}`)}&accountName=${encodeURIComponent("NGUYEN VAN MINH")}`;
                                setQrPopup({
                                  url: imgUrl,
                                  amount:
                                    order.finalPrice || order.totalPrice || 0,
                                  id: order.id,
                                });
                              }}
                            >
                              <img
                                src={`https://img.vietqr.io/image/MB-0389999999-compact2.png?amount=${order.finalPrice || order.totalPrice || 0}&addInfo=${encodeURIComponent(`HL-${order.id?.substring(0, 8)}`)}&accountName=${encodeURIComponent("NGUYEN VAN MINH")}`}
                                alt="QR"
                                className="w-44 h-44 object-contain pointer-events-none"
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  (e.target as HTMLImageElement).src =
                                    `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`Thanh toan ${order.finalPrice || order.totalPrice} VND`)}`;
                                }}
                              />
                            </div>
                            <p
                              className="text-xs mb-2"
                              style={{ color: "var(--foreground-muted)" }}
                            >
                              Nhấn vào mã QR để phóng to
                            </p>
                            <div
                              className="p-3 rounded-xl mt-2"
                              style={{
                                background: "rgba(245,158,11,0.08)",
                                border: "1px solid rgba(245,158,11,0.2)",
                              }}
                            >
                              <p
                                className="text-xs font-medium flex items-center gap-1.5"
                                style={{ color: "#f59e0b" }}
                              >
                                <Clock className="w-3.5 h-3.5" /> Sau khi chuyển
                                tiền, giáo viên sẽ xác nhận và duyệt học sinh
                                vào lớp
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
                      <h3 className="font-bold mb-4">
                        Yêu cầu đến ({incomingRequests.length})
                      </h3>
                      <div className="space-y-3">
                        {incomingRequests.map((r: any) => (
                          <div
                            key={r.id}
                            className="flex items-center justify-between p-3 rounded-xl"
                            style={{ background: "var(--muted)" }}
                          >
                            <span className="text-sm font-semibold">
                              {r.parent?.username || r.parentId}
                            </span>
                            <div className="flex gap-2">
                              <button
                                onClick={() => acceptRequest(r.id)}
                                className="btn-primary text-xs px-3 py-1"
                              >
                                <CheckCircle2 className="w-3 h-3" /> Chấp nhận
                              </button>
                              <button
                                onClick={() => rejectRequest(r.id)}
                                className="btn-ghost text-xs px-3 py-1"
                                style={{ color: "#ef4444" }}
                              >
                                <XCircle className="w-3 h-3" /> Từ chối
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {outgoingRequests.length > 0 && (
                    <div className="card-base">
                      <h3 className="font-bold mb-4">
                        Yêu cầu đã gửi ({outgoingRequests.length})
                      </h3>
                      <div className="space-y-3">
                        {outgoingRequests.map((r: any) => (
                          <div
                            key={r.id}
                            className="flex items-center justify-between p-3 rounded-xl"
                            style={{ background: "var(--muted)" }}
                          >
                            <div>
                              <span className="text-sm font-semibold">
                                {r.child?.username || r.childId}
                              </span>
                              <span className="badge badge-warning text-[10px] ml-2">
                                Chờ xác nhận
                              </span>
                            </div>
                            <button
                              onClick={() => deleteRequest(r.id)}
                              className="btn-ghost text-xs"
                              style={{ color: "#ef4444" }}
                            >
                              Hủy
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {incomingRequests.length === 0 &&
                    outgoingRequests.length === 0 && (
                      <div className="card-base text-center py-8">
                        <UserPlus
                          className="w-10 h-10 mx-auto mb-2"
                          style={{ color: "var(--foreground-muted)" }}
                        />
                        <p
                          className="text-sm"
                          style={{ color: "var(--foreground-muted)" }}
                        >
                          Không có yêu cầu liên kết nào
                        </p>
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
