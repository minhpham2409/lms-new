"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/components/auth/auth-state";
import {
  BookOpen, Users, DollarSign, TrendingUp, Plus, Eye, Edit, Star,
  BarChart3, MessageCircle, Play, Trash2,
  Calendar, ArrowUpRight, CheckCircle2, Settings, CreditCard, Building2, Send, Loader2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend
} from "recharts";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";
const courseColors = ["#7c3aed", "#3b82f6", "#f59e0b", "#10b981", "#ec4899", "#0891b2"];

type Tab = "overview" | "courses" | "students" | "analytics" | "reviews" | "settings";

export default function TeacherPage() {
  const router = useRouter();
  const { user, token, isLoggedIn, loading } = useAuth();
  const [tab, setTab] = useState<Tab>("overview");
  const [bankName, setBankName] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [bankOwner, setBankOwner] = useState("");

  const [myCourses, setMyCourses] = useState<any[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [pendingStudents, setPendingStudents] = useState<any[]>([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [pendingSubmissionCount, setPendingSubmissionCount] = useState(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (token) { fetchMyCourses(); fetchStats(); fetchPendingStudents(); fetchPendingSubmissions(); }
  }, [token]);

  async function fetchMyCourses() {
    try {
      const res = await fetch(`${API}/courses/my`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setMyCourses(Array.isArray(data) ? data : []);
      }
    } catch {} finally { setCoursesLoading(false); }
  }

  async function fetchStats() {
    try {
      const res = await fetch(`${API}/courses/my/stats`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setStats(await res.json());
    } catch {}
  }

  async function deleteCourse(courseId: string) {
    if (!confirm("Xóa khóa học này? (Chỉ xóa được nháp)")) return;
    try {
      const res = await fetch(`${API}/courses/${courseId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { setMyCourses(myCourses.filter(c => c.id !== courseId)); toast.success("Đã xóa"); }
      else { const d = await res.json(); toast.error(d.message || "Không thể xóa"); }
    } catch { toast.error("Lỗi"); }
  }

  async function submitForReview(courseId: string) {
    try {
      const res = await fetch(`${API}/courses/${courseId}/submit-review`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { setMyCourses(myCourses.map(c => c.id === courseId ? { ...c, status: "pending" } : c)); toast.success("Đã gửi duyệt!"); }
      else { const d = await res.json(); toast.error(d.message || "Lỗi"); }
    } catch { toast.error("Lỗi"); }
  }

  async function fetchPendingStudents() {
    setPendingLoading(true);
    try {
      const res = await fetch(`${API}/courses/my`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return;
      const courses = await res.json();
      const allPending: any[] = [];
      for (const course of courses) {
        try {
          const eRes = await fetch(`${API}/enrollments/course/${course.id}?status=pending`, { headers: { Authorization: `Bearer ${token}` } });
          if (eRes.ok) {
            const enrollments = await eRes.json();
            const pending = (Array.isArray(enrollments) ? enrollments : []).filter((e: any) => e.status === "pending");
            pending.forEach((e: any) => allPending.push({ ...e, courseTitle: course.title, courseId: course.id }));
          }
        } catch {}
      }
      setPendingStudents(allPending);
    } catch {} finally { setPendingLoading(false); }
  }

  async function fetchPendingSubmissions() {
    try {
      const res = await fetch(`${API}/assignments/teacher/all-submissions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const pending = (Array.isArray(data) ? data : []).filter((s: any) => s.status !== 'graded');
        setPendingSubmissionCount(pending.length);
      }
    } catch {}
  }

  async function approveStudent(enrollmentId: string) {
    try {
      const res = await fetch(`${API}/enrollments/${enrollmentId}/approve`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setPendingStudents(pendingStudents.filter(s => s.id !== enrollmentId));
        toast.success("Đã duyệt học sinh vào lớp!");
        fetchStats();
      } else {
        const d = await res.json();
        toast.error(d.message || "Lỗi duyệt");
      }
    } catch { toast.error("Lỗi kết nối"); }
  }

  async function rejectStudent(enrollmentId: string) {
    if (!confirm("Từ chối học sinh này?")) return;
    try {
      const res = await fetch(`${API}/enrollments/${enrollmentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setPendingStudents(pendingStudents.filter(s => s.id !== enrollmentId));
        toast.success("Đã từ chối");
      }
    } catch { toast.error("Lỗi"); }
  }

  useEffect(() => {
    if (loading) return;
    if (!isLoggedIn) {
      router.push("/auth/login");
      return;
    }
    if (user?.role !== "teacher") {
      if (user?.role === "admin") router.push("/admin");
      else if (user?.role === "parent") router.push("/parent");
      else router.push("/dashboard");
    }
  }, [user, isLoggedIn, loading, router]);

  if (loading || !user || user.role !== "teacher") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
        <div className="w-8 h-8 border-2 border-[#0891b2] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: any; badge?: number }[] = [
    { id: "overview", label: "Tổng quan", icon: BarChart3 },
    { id: "courses", label: "Quản lý khóa học", icon: BookOpen },
    { id: "students", label: "Duyệt học sinh", icon: Users, badge: pendingStudents.length },
    { id: "analytics", label: "Phân tích chi tiết", icon: TrendingUp },
    { id: "reviews", label: "Hỏi đáp & Đánh giá", icon: MessageCircle },
    { id: "settings", label: "Cài đặt thanh toán", icon: Settings },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-strong p-3 rounded-xl border border-white/10 shadow-2xl">
          <p className="text-xs font-semibold mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4 text-xs">
              <span style={{ color: entry.color }}>{entry.name}:</span>
              <span className="font-bold">
                {entry.name === "Doanh thu" ? `${entry.value.toLocaleString()} ₫` : entry.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--background)" }}>
      <Navbar />
      
      {/* Hero Section */}
      <div className="pt-24 pb-12 relative overflow-hidden shrink-0 border-b border-white/5 bg-gradient-to-br from-indigo-950/40 via-[#0d1322] to-cyan-950/20">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none -translate-x-1/3 translate-y-1/3" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-extrabold text-white shadow-2xl relative group"
                style={{ background: "linear-gradient(135deg, #7c3aed, #0891b2)" }}>
                {(user?.firstName || user?.username || "?").charAt(0).toUpperCase()}
                <div className="absolute inset-0 rounded-2xl border-2 border-white/20" />
                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="badge badge-primary text-[10px] uppercase tracking-wider">Tài khoản Giáo viên</span>
                  {stats?.avgRating >= 4.5 && <span className="badge badge-warning text-[10px] flex items-center gap-1"><Star className="w-3 h-3 fill-amber-500 text-amber-500" /> Top Rated</span>}
                </div>
                <h1 className="text-3xl font-extrabold text-white tracking-tight">
                  Chào mừng trở lại, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">{user?.firstName || user?.username || "Giáo viên"}</span> 👋
                </h1>
                <p className="text-sm mt-2 flex items-center gap-2" style={{ color: "var(--foreground-muted)" }}>
                  <Calendar className="w-4 h-4" /> Hôm nay là {new Date().toLocaleDateString("vi-VN", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/teacher/grades" className="btn-secondary relative overflow-hidden group">
                <div className="absolute inset-0 bg-indigo-500/10 translate-y-full group-hover:translate-y-0 transition-transform" />
                <span className="relative z-10 flex items-center gap-2">
                  📝 Chấm bài tập
                  {pendingSubmissionCount > 0 && (
                    <span className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center bg-red-500 text-white shadow-lg shadow-red-500/30 animate-pulse">
                      {pendingSubmissionCount}
                    </span>
                  )}
                </span>
              </Link>
              <Link href="/teacher/courses/new" className="btn-primary shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40">
                <Plus className="w-4 h-4" /> Tạo khóa học mới
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Tabs */}
          <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
            {tabs.map((t) => {
              const isActive = tab === t.id;
              return (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 whitespace-nowrap relative overflow-hidden
                    ${isActive ? 'text-white shadow-lg' : 'text-[var(--foreground-muted)] hover:text-white hover:bg-white/5'}`}
                  style={{
                    background: isActive ? "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(8,145,178,0.15))" : "transparent",
                    border: `1px solid ${isActive ? "rgba(124,58,237,0.3)" : "transparent"}`,
                  }}>
                  {isActive && <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-indigo-500 to-cyan-500" />}
                  <t.icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : ''}`} /> {t.label}
                  {t.badge ? <span className="w-5 h-5 rounded-full text-[10px] flex items-center justify-center bg-red-500 text-white shadow-lg">{t.badge}</span> : null}
                </button>
              );
            })}
          </div>

          {/* Content Area */}
          <div className="animate-fade-in">
            {tab === "overview" && (
              <div className="space-y-6">
                {/* Top Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "Khóa học", value: String(stats?.totalCourses || myCourses.length), icon: BookOpen, color: "#7c3aed", sub: `${stats?.publishedCourses || 0} đã xuất bản`, grad: "from-indigo-500 to-purple-500" },
                    { label: "Tổng học sinh", value: String(stats?.totalStudents || 0), icon: Users, color: "#0891b2", sub: "tích lũy", grad: "from-cyan-500 to-blue-500" },
                    { label: "Doanh thu", value: stats?.totalRevenue ? `${(stats.totalRevenue / 1000000).toFixed(1)}M ₫` : "0 ₫", icon: DollarSign, color: "#10b981", sub: "tổng cộng", grad: "from-emerald-500 to-teal-500" },
                    { label: "Đánh giá TB", value: stats?.avgRating ? `⭐ ${stats.avgRating}` : "—", icon: Star, color: "#f59e0b", sub: stats?.totalReviews ? `${stats.totalReviews} lượt đánh giá` : "chưa có", grad: "from-amber-500 to-orange-500" },
                  ].map(({ label, value, icon: Icon, color, sub, grad }, _i) => (
                    <div key={label} className="glass-card rounded-2xl p-5 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
                      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${grad} opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity`} />
                      <div className="flex items-start justify-between mb-4 relative z-10">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-inner" style={{ background: `${color}15` }}>
                          <Icon className="w-6 h-6" style={{ color }} />
                        </div>
                        <div className="p-1.5 rounded-lg bg-white/5 backdrop-blur-md border border-white/10">
                          <TrendingUp className="w-3.5 h-3.5" style={{ color }} />
                        </div>
                      </div>
                      <div className="relative z-10">
                        <p className="text-3xl font-extrabold text-white tracking-tight">{value}</p>
                        <p className="text-sm font-medium mt-1 text-indigo-100/70">{label}</p>
                        <p className="text-xs mt-1 font-medium" style={{ color: color }}>{sub}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                  {/* Recent Activity / Courses */}
                  <div className="lg:col-span-2 glass-strong rounded-2xl p-6 border border-white/5">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-bold text-lg flex items-center gap-2 text-white">
                        <Play className="w-5 h-5 text-indigo-400" /> Khóa học hoạt động gần đây
                      </h3>
                      <button onClick={() => setTab("courses")} className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
                        Xem tất cả <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </div>
                    
                    {myCourses.length === 0 ? (
                      <div className="text-center py-10 bg-white/5 rounded-xl border border-white/5 border-dashed">
                        <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40 text-indigo-300" />
                        <p className="text-sm font-medium text-white">Chưa có khóa học nào</p>
                        <p className="text-xs mt-1 text-indigo-200/50">Bắt đầu chia sẻ kiến thức ngay hôm nay</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {myCourses.slice(0, 4).map((c: any, i: number) => (
                          <div key={c.id} className="group flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all cursor-pointer"
                            onClick={() => router.push(`/teacher/courses/${c.id}`)}>
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-md" style={{ background: `linear-gradient(135deg, ${courseColors[i % courseColors.length]}30, ${courseColors[(i+1) % courseColors.length]}10)` }}>
                                <BookOpen className="w-5 h-5" style={{ color: courseColors[i % courseColors.length] }} />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">{c.title}</p>
                                <div className="flex items-center gap-3 mt-1">
                                  <p className="text-[11px] font-medium text-indigo-200/60 flex items-center gap-1">
                                    <Users className="w-3 h-3" /> {c._count?.enrollments || 0} học viên
                                  </p>
                                  <p className="text-[11px] font-medium text-indigo-200/60 flex items-center gap-1">
                                    <DollarSign className="w-3 h-3" /> {c.price > 0 ? `${c.price.toLocaleString()}đ` : "Miễn phí"}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <span className={`badge ${c.status === "published" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"} text-[10px]`}>
                              {c.status === "published" ? "Xuất bản" : "Nháp"}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Quick Actions Panel */}
                  <div className="glass-strong rounded-2xl p-6 border border-white/5 bg-gradient-to-b from-indigo-950/20 to-transparent">
                    <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-white">
                      <TrendingUp className="w-5 h-5 text-cyan-400" /> Thao tác nhanh
                    </h3>
                    <div className="space-y-3">
                      <Link href="/teacher/courses/new" className="flex items-center gap-4 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all group">
                        <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Plus className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">Tạo khóa học</p>
                          <p className="text-xs text-indigo-200/60 mt-0.5">Thêm nội dung và bài học mới</p>
                        </div>
                      </Link>
                      
                      <button onClick={() => setTab("students")} className="w-full flex items-center gap-4 p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/20 transition-all group text-left relative overflow-hidden">
                        <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <CheckCircle2 className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">Duyệt học sinh</p>
                          <p className="text-xs text-cyan-200/60 mt-0.5">Kiểm tra thanh toán chờ duyệt</p>
                        </div>
                        {pendingStudents.length > 0 && (
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg animate-pulse">
                            {pendingStudents.length}
                          </div>
                        )}
                      </button>

                      <div className="mt-6 pt-6 border-t border-white/10">
                        <p className="text-xs font-semibold text-indigo-200/50 uppercase tracking-wider mb-4">Học viên mới nhất</p>
                        <div className="space-y-3">
                          {stats?.recentEnrollments?.length > 0 ? (
                            stats.recentEnrollments.slice(0, 3).map((e: any, idx: number) => (
                              <div key={idx} className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white">
                                  {(e.user?.username || "?").charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-bold text-white truncate">{e.user?.username}</p>
                                  <p className="text-[10px] text-indigo-200/60 truncate">Vừa tham gia: {e.course?.title}</p>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-indigo-200/50">Chưa có học viên mới</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {tab === "courses" && (
              <div className="glass-strong rounded-2xl border border-white/5 overflow-hidden">
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                  <h3 className="font-bold text-lg text-white">Tất cả khóa học</h3>
                  <Link href="/teacher/courses/new" className="btn-primary py-2 text-xs"><Plus className="w-4 h-4"/> Thêm mới</Link>
                </div>
                {coursesLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                  </div>
                ) : myCourses.length === 0 ? (
                  <div className="text-center py-20">
                    <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-30 text-indigo-300" />
                    <h3 className="text-lg font-bold text-white mb-2">Chưa có khóa học nào</h3>
                    <p className="text-sm text-indigo-200/60 mb-6">Bạn chưa tạo bất kỳ khóa học nào trên hệ thống.</p>
                    <Link href="/teacher/courses/new" className="btn-primary mx-auto w-fit">
                      <Plus className="w-4 h-4" /> Bắt đầu tạo khóa học
                    </Link>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-white/5 text-xs uppercase font-bold text-indigo-200/70 border-b border-white/10">
                        <tr>
                          <th className="px-6 py-4">Khóa học</th>
                          <th className="px-6 py-4">Trạng thái</th>
                          <th className="px-6 py-4">Học viên</th>
                          <th className="px-6 py-4">Giá bán</th>
                          <th className="px-6 py-4 text-right">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {myCourses.map((c: any, ci: number) => {
                          const color = courseColors[ci % courseColors.length];
                          return (
                            <tr key={c.id} className="hover:bg-white/[0.02] transition-colors group">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm" style={{ background: `linear-gradient(135deg, ${color}30, ${color}10)` }}>
                                    <BookOpen className="w-5 h-5" style={{ color }} />
                                  </div>
                                  <div>
                                    <p className="font-bold text-white group-hover:text-indigo-300 transition-colors">{c.title}</p>
                                    <p className="text-xs text-indigo-200/50 mt-1">{c.sections?.length || 0} chương</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`badge ${c.status === "published" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"} text-xs py-1 px-3`}>
                                  {c.status === "published" ? "Đã Xuất bản" : "Bản Nháp"}
                                </span>
                              </td>
                              <td className="px-6 py-4 font-semibold text-white">
                                {c._count?.enrollments || 0} <span className="text-xs font-normal text-indigo-200/50 ml-1">người</span>
                              </td>
                              <td className="px-6 py-4 font-semibold text-emerald-400">
                                {c.price > 0 ? `${c.price.toLocaleString()} ₫` : "Miễn phí"}
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Link href={`/teacher/courses/${c.id}`} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-indigo-300 transition-colors tooltip" data-tip="Chỉnh sửa">
                                    <Edit className="w-4 h-4" />
                                  </Link>
                                  <button onClick={() => window.open(`/courses/${c.id}`, '_blank')} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-cyan-300 transition-colors tooltip" data-tip="Xem trước">
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  {c.status === "draft" && (
                                    <>
                                      <button onClick={() => submitForReview(c.id)} className="p-2 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 transition-colors tooltip" data-tip="Gửi duyệt lên Admin">
                                        <Send className="w-4 h-4" />
                                      </button>
                                      <button onClick={() => deleteCourse(c.id)} className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors tooltip" data-tip="Xóa bản nháp">
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {tab === "analytics" && (
              <div className="space-y-6">
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Revenue Chart */}
                  <div className="glass-strong rounded-2xl p-6 border border-white/5">
                    <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-white">
                      <DollarSign className="w-5 h-5 text-emerald-400" /> Biểu đồ doanh thu 6 tháng qua
                    </h3>
                    {stats?.monthlyData && stats.monthlyData.length > 0 ? (
                      <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={stats.monthlyData}>
                            <defs>
                              <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val/1000}k`} />
                            <RechartsTooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ fontSize: '12px', opacity: 0.8 }} />
                            <Line type="monotone" name="Doanh thu" dataKey="revenue" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: "#10b981", strokeWidth: 2, stroke: "#0f172a" }} activeDot={{ r: 6 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="h-72 flex items-center justify-center text-sm text-indigo-200/50">Không có dữ liệu đủ để vẽ biểu đồ</div>
                    )}
                  </div>

                  {/* Enrollment Chart */}
                  <div className="glass-strong rounded-2xl p-6 border border-white/5">
                    <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-white">
                      <Users className="w-5 h-5 text-cyan-400" /> Biểu đồ học sinh mới
                    </h3>
                    {stats?.monthlyData && stats.monthlyData.length > 0 ? (
                      <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={stats.monthlyData}>
                            <defs>
                              <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#0891b2" stopOpacity={0.8}/>
                                <stop offset="100%" stopColor="#0891b2" stopOpacity={0.2}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                            <RechartsTooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ fontSize: '12px', opacity: 0.8 }} />
                            <Bar dataKey="enrollments" name="Học sinh mới" fill="url(#colorStudents)" radius={[4, 4, 0, 0]} barSize={30} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="h-72 flex items-center justify-center text-sm text-indigo-200/50">Không có dữ liệu đủ để vẽ biểu đồ</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {tab === "students" && (
              <div className="glass-strong rounded-2xl border border-white/5 overflow-hidden">
                <div className="p-6 border-b border-white/10 bg-indigo-950/20">
                  <h3 className="font-bold text-lg text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-400" /> Xác nhận thanh toán & Duyệt học sinh
                  </h3>
                  <p className="text-sm text-indigo-200/60 mt-2">
                    Kiểm tra tài khoản ngân hàng của bạn. Nếu đã nhận được tiền, hãy ấn <strong>Duyệt</strong> để cho phép học sinh vào học ngay lập tức.
                  </p>
                </div>
                
                {pendingLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                  </div>
                ) : pendingStudents.length === 0 ? (
                  <div className="text-center py-20">
                    <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-emerald-500 opacity-80" />
                    <h3 className="text-lg font-bold text-white mb-2">Không có yêu cầu duyệt nào</h3>
                    <p className="text-sm text-indigo-200/60">Tất cả học sinh đã được xử lý hoặc chưa có đăng ký mới.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {pendingStudents.map((s: any) => (
                      <div key={s.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white shadow-lg"
                            style={{ background: "linear-gradient(135deg, #7c3aed, #0891b2)" }}>
                            {(s.user?.firstName || s.user?.username || "?").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-base font-bold text-white">{s.user?.firstName ? `${s.user.firstName} ${s.user.lastName || ""}`.trim() : s.user?.username || "Học sinh"}</p>
                            <p className="text-sm text-indigo-200/70 mt-0.5">
                              {s.user?.email || "Chưa cập nhật email"} • <span className="font-semibold text-indigo-300">Khóa: {s.courseTitle}</span>
                            </p>
                            <p className="text-xs text-indigo-200/40 mt-1">
                              Yêu cầu từ: {s.createdAt ? new Date(s.createdAt).toLocaleString("vi-VN") : "Không rõ"}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 md:ml-auto">
                          <span className="badge bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 text-xs">
                            ⏳ Đang chờ thanh toán
                          </span>
                          <button onClick={() => approveStudent(s.id)} className="btn-primary py-2 px-4 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 !bg-gradient-to-r !from-emerald-500 !to-teal-500 border-none">
                            <CheckCircle2 className="w-4 h-4" /> Duyệt vào lớp
                          </button>
                          <button onClick={() => rejectStudent(s.id)} className="p-2.5 rounded-xl bg-white/5 hover:bg-red-500/20 text-red-400 transition-colors tooltip" data-tip="Từ chối">
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === "reviews" && (
              <div className="glass-strong rounded-2xl p-12 text-center border border-white/5">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-30 text-indigo-300" />
                <h3 className="text-lg font-bold text-white mb-2">Hỏi đáp & Đánh giá</h3>
                <p className="text-sm text-indigo-200/60 max-w-md mx-auto">Khu vực này đang được nâng cấp. Sắp tới bạn có thể trả lời câu hỏi của học sinh trực tiếp tại đây.</p>
              </div>
            )}

            {tab === "settings" && (
              <div className="glass-strong rounded-2xl p-8 border border-white/5 max-w-3xl mx-auto">
                <h3 className="font-bold text-2xl mb-2 flex items-center gap-3 text-white">
                  <CreditCard className="w-6 h-6 text-indigo-400" /> Cài đặt thanh toán (QR)
                </h3>
                <p className="text-sm text-indigo-200/60 mb-8 pb-6 border-b border-white/10">
                  Hệ thống sử dụng mã QR tự động từ thông tin ngân hàng của bạn. Khi học sinh đăng ký, mã QR sẽ tự động điền số tiền và nội dung chuyển khoản để bạn dễ dàng đối soát.
                </p>
                
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-white mb-2">Ngân hàng</label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-400" />
                        <select value={bankName} onChange={(e) => setBankName(e.target.value)} className="input-base pl-10 bg-white/5 border-white/10 text-white !h-12 focus:bg-white/10">
                          <option value="" className="bg-[#0f172a]">Chọn ngân hàng của bạn</option>
                          <option value="VCB" className="bg-[#0f172a]">Vietcombank (VCB)</option>
                          <option value="TCB" className="bg-[#0f172a]">Techcombank (TCB)</option>
                          <option value="MB" className="bg-[#0f172a]">MB Bank</option>
                          <option value="ACB" className="bg-[#0f172a]">ACB</option>
                          <option value="VPB" className="bg-[#0f172a]">VPBank</option>
                          <option value="BIDV" className="bg-[#0f172a]">BIDV</option>
                          <option value="VTB" className="bg-[#0f172a]">VietinBank</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-white mb-2">Số tài khoản</label>
                      <input
                        value={bankAccount} onChange={(e) => setBankAccount(e.target.value)}
                        className="input-base bg-white/5 border-white/10 text-white !h-12 focus:bg-white/10" placeholder="VD: 190366666666"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-white mb-2">Tên chủ tài khoản (Viết in hoa không dấu)</label>
                    <input
                      value={bankOwner} onChange={(e) => setBankOwner(e.target.value)}
                      className="input-base bg-white/5 border-white/10 text-white !h-12 focus:bg-white/10 font-bold tracking-wider" placeholder="VD: NGUYEN VAN MINH"
                    />
                  </div>

                  {bankName && bankAccount && bankOwner && (
                    <div className="mt-8 p-6 rounded-2xl border border-white/10 bg-indigo-950/30 flex flex-col items-center">
                      <p className="text-sm font-bold text-white mb-4 text-center">Bản xem trước Mã QR hiển thị cho học sinh</p>
                      <div className="w-48 h-48 bg-white rounded-2xl p-2 shadow-2xl shadow-indigo-500/20">
                        <img
                          src={`https://img.vietqr.io/image/${bankName}-${bankAccount}-compact.png?accountName=${encodeURIComponent(bankOwner)}`}
                          alt="QR Code"
                          className="w-full h-full object-contain"
                          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.style.display = 'none'; }}
                        />
                      </div>
                      <p className="text-xs font-semibold text-indigo-300 mt-4 text-center tracking-wide">
                        {bankName} • {bankAccount} • {bankOwner}
                      </p>
                    </div>
                  )}

                  <div className="pt-4 flex justify-end">
                    <button className="btn-primary py-3 px-8 text-base shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50">
                      <CreditCard className="w-5 h-5" /> Cập nhật thông tin
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
      <Footer />
    </div>
  );
}
