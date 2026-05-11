"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/components/auth/auth-state";
import {
  BookOpen, Users, DollarSign, TrendingUp, Plus, Eye, Edit, Star,
  BarChart3, MessageCircle, Clock, FileText, Play, Trash2, Upload,
  Calendar, ArrowUpRight, CheckCircle2, Settings, CreditCard, Building2, Send, Loader2,
  CheckCircle, X,
} from "lucide-react";
import { toast } from "sonner";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
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
      // For each course, fetch enrollments to find pending ones
      const res = await fetch(`${API}/courses/my`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return;
      const courses = await res.json();
      const allPending: any[] = [];
      for (const course of courses) {
        try {
          // Fetch enrollments for this course via the new endpoint
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
        // Refresh stats to update revenue
        fetchStats();
      } else {
        // Fallback: update progress to activate
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

  const displayName = user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : user?.username || "Giáo viên";

  const tabs: { id: Tab; label: string; icon: any; badge?: number }[] = [
    { id: "overview", label: "Tổng quan", icon: BarChart3 },
    { id: "courses", label: "Khóa học", icon: BookOpen },
    { id: "students", label: "Thanh toán & Duyệt", icon: Users, badge: pendingStudents.length },
    { id: "analytics", label: "Phân tích", icon: TrendingUp },
    { id: "reviews", label: "Đánh giá & Hỏi đáp", icon: MessageCircle },
    { id: "settings", label: "Cài đặt", icon: Settings },
  ];

  // Quick link to grading page
  const gradingLink = (
    <Link href="/teacher/grades" className="btn-primary text-sm gap-2">
      📝 Chấm bài tập
    </Link>
  );





  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <Navbar />
      <div className="pt-20 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-extrabold mb-1">Giáo viên Dashboard</h1>
              <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>Xin chào, <span className="gradient-text font-bold">{user?.firstName || user?.username || "Giáo viên"}</span></p>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/teacher/grades" className="btn-secondary text-sm gap-1.5 relative">
                📝 Chấm bài
                {pendingSubmissionCount > 0 && (
                  <span className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center text-white" style={{ background: "#ef4444" }}>
                    {pendingSubmissionCount}
                  </span>
                )}
              </Link>
              <Link href="/teacher/courses/new" className="btn-primary text-sm"><Plus className="w-4 h-4" /> Tạo khóa học</Link>
            </div>
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
                {t.badge ? <span className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center text-white" style={{ background: "#ef4444" }}>{t.badge}</span> : null}
              </button>
            ))}
          </div>

          {tab === "overview" && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[
                  { label: "Khóa học", value: String(stats?.totalCourses || myCourses.length), icon: BookOpen, color: "#7c3aed", sub: `${stats?.publishedCourses || myCourses.filter(c => c.status === "published").length} đã xuất bản` },
                  { label: "Tổng học sinh", value: String(stats?.totalStudents || myCourses.reduce((s: number, c: any) => s + (c._count?.enrollments || 0), 0)), icon: Users, color: "#0891b2", sub: "học sinh" },
                  { label: "Doanh thu", value: stats?.totalRevenue ? `${(stats.totalRevenue / 1000000).toFixed(1)}M ₫` : "0 ₫", icon: DollarSign, color: "#10b981", sub: "" },
                  { label: "Đánh giá TB", value: stats?.avgRating ? `⭐ ${stats.avgRating}` : "—", icon: Star, color: "#f59e0b", sub: stats?.totalReviews ? `${stats.totalReviews} đánh giá` : "" },
                ].map(({ label, value, icon: Icon, color, sub }) => (
                  <div key={label} className="card-base">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
                        <Icon className="w-5 h-5" style={{ color }} />
                      </div>
                      <ArrowUpRight className="w-4 h-4" style={{ color: "#10b981" }} />
                    </div>
                    <p className="text-2xl font-extrabold">{value}</p>
                    <p className="text-xs mt-1" style={{ color: "var(--foreground-muted)" }}>{label}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: "var(--foreground-muted)" }}>{sub}</p>
                  </div>
                ))}
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                {/* Recent courses */}
                <div className="card-base">
                  <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" style={{ color: "#7c3aed" }} /> Khóa học của bạn
                  </h3>
                  {myCourses.length === 0 ? (
                    <p className="text-sm text-center py-6" style={{ color: "var(--foreground-muted)" }}>Chưa có khóa học nào</p>
                  ) : (
                    <div className="space-y-3">
                      {myCourses.slice(0, 5).map((c: any, i: number) => (
                        <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "var(--muted)" }}>
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${courseColors[i % courseColors.length]}18` }}>
                            <BookOpen className="w-4 h-4" style={{ color: courseColors[i % courseColors.length] }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold truncate">{c.title}</p>
                            <p className="text-[10px]" style={{ color: "var(--foreground-muted)" }}>{c._count?.enrollments || 0} học sinh</p>
                          </div>
                          <span className={`badge ${c.status === "published" ? "badge-success" : "badge-warning"} text-[10px]`}>
                            {c.status === "published" ? "Xuất bản" : "Nháp"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick actions */}
                <div className="card-base">
                  <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" style={{ color: "#10b981" }} /> Thao tác nhanh
                  </h3>
                  <div className="space-y-3">
                    <Link href="/teacher/courses/new" className="flex items-center gap-3 p-3 rounded-xl transition-all hover:scale-[1.01]" style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.15)" }}>
                      <Plus className="w-5 h-5" style={{ color: "#7c3aed" }} />
                      <div>
                        <p className="text-sm font-semibold">Tạo khóa học mới</p>
                        <p className="text-[10px]" style={{ color: "var(--foreground-muted)" }}>Thêm nội dung và bài học</p>
                      </div>
                    </Link>
                    <Link href="/notifications" className="flex items-center gap-3 p-3 rounded-xl transition-all hover:scale-[1.01]" style={{ background: "rgba(8,145,178,0.08)", border: "1px solid rgba(8,145,178,0.15)" }}>
                      <MessageCircle className="w-5 h-5" style={{ color: "#0891b2" }} />
                      <div>
                        <p className="text-sm font-semibold">Thông báo</p>
                        <p className="text-[10px]" style={{ color: "var(--foreground-muted)" }}>Xem thông báo và câu hỏi</p>
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
            </>
          )}

          {tab === "courses" && (
            <div>
              {coursesLoading ? (
                <div className="card-base flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#7c3aed" }} />
                </div>
              ) : myCourses.length === 0 ? (
                <div className="card-base text-center py-12">
                  <BookOpen className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--foreground-muted)" }} />
                  <h3 className="font-bold mb-2">Chưa có khóa học nào</h3>
                  <p className="text-sm mb-4" style={{ color: "var(--foreground-muted)" }}>Bắt đầu tạo khóa học đầu tiên của bạn</p>
                  <Link href="/teacher/courses/new" className="btn-primary">
                    <Plus className="w-4 h-4" /> Tạo khóa học
                  </Link>
                </div>
              ) : (
                <div className="card-base overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr style={{ borderBottom: "1px solid var(--border)" }}>
                        {["Khóa học", "Trạng thái", "Bài học", "Học sinh", "Giá", ""].map((h) => (
                          <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: "var(--foreground-muted)" }}>{h}</th>
                        ))}
                      </tr></thead>
                      <tbody>
                        {myCourses.map((c: any, ci: number) => {
                          const color = courseColors[ci % courseColors.length];
                          const lessonsCount = c.sections?.reduce((s: number, sec: any) => s + (sec.lessons?.length || sec._count?.lessons || 0), 0) || c._count?.lessons || 0;
                          return (
                            <tr key={c.id} className="transition-colors hover:bg-[var(--muted)]" style={{ borderBottom: "1px solid var(--border)" }}>
                              <td className="px-4 py-3.5">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}><BookOpen className="w-5 h-5" style={{ color }} /></div>
                                  <span className="font-semibold">{c.title}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3.5"><span className={`badge ${c.status === "published" ? "badge-success" : "badge-warning"} text-[10px]`}>{c.status === "published" ? "Xuất bản" : "Nháp"}</span></td>
                              <td className="px-4 py-3.5">{lessonsCount}</td>
                              <td className="px-4 py-3.5">{c._count?.enrollments || 0}</td>
                              <td className="px-4 py-3.5" style={{ color: "#10b981" }}>{c.price > 0 ? `${c.price.toLocaleString()} ₫` : "Miễn phí"}</td>
                              <td className="px-4 py-3.5"><div className="flex gap-1">
                                <Link href={`/teacher/courses/${c.id}`} className="btn-ghost px-2 py-1"><Edit className="w-3.5 h-3.5" /></Link>
                                <button onClick={() => window.open(`/courses/${c.id}`, '_blank')} className="btn-ghost px-2 py-1"><Eye className="w-3.5 h-3.5" /></button>
                                {c.status === "draft" && <button onClick={() => submitForReview(c.id)} className="btn-ghost px-2 py-1 text-[10px]" style={{ color: "#0891b2" }}>Gửi duyệt</button>}
                                {c.status === "draft" && <button onClick={() => deleteCourse(c.id)} className="btn-ghost px-2 py-1"><Trash2 className="w-3.5 h-3.5" style={{ color: "#ef4444" }} /></button>}
                              </div></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === "students" && (
            <div>
              <h2 className="text-lg font-extrabold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" style={{ color: "#0891b2" }} /> Xác nhận thanh toán & Duyệt học sinh
                {pendingStudents.length > 0 && (
                  <span className="w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center text-white" style={{ background: "#ef4444" }}>
                    {pendingStudents.length}
                  </span>
                )}
              </h2>
              {pendingLoading ? (
                <div className="card-base flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#7c3aed" }} />
                </div>
              ) : pendingStudents.length === 0 ? (
                <div className="card-base text-center py-12">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3" style={{ color: "#10b981" }} />
                  <h3 className="font-bold mb-2">Không có học sinh chờ duyệt</h3>
                  <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>Tất cả học sinh đã được xử lý</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl mb-2" style={{ background: "rgba(8,145,178,0.08)", border: "1px solid rgba(8,145,178,0.2)" }}>
                    <p className="text-xs" style={{ color: "#0891b2" }}>
                      💡 Kiểm tra tài khoản ngân hàng đã nhận tiền, sau đó ấn <strong>"Xác nhận & Duyệt"</strong> để cho học sinh vào lớp.
                    </p>
                  </div>
                  {pendingStudents.map((s: any) => (
                    <div key={s.id} className="card-base">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                          style={{ background: "linear-gradient(135deg, #7c3aed, #0891b2)" }}>
                          {(s.user?.firstName || s.user?.username || "?").charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold">{s.user?.firstName ? `${s.user.firstName} ${s.user.lastName || ""}`.trim() : s.user?.username || "Học sinh"}</p>
                          <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>
                            {s.user?.email || ""} • Khóa: <strong>{s.courseTitle || "Khóa học"}</strong>
                          </p>
                          <p className="text-[10px]" style={{ color: "var(--foreground-muted)" }}>
                            {s.createdAt ? new Date(s.createdAt).toLocaleDateString("vi-VN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className="badge badge-warning text-[10px]">Chờ thanh toán</span>
                          <button onClick={() => approveStudent(s.id)} className="btn-primary text-xs px-3 py-1.5">
                            <CheckCircle className="w-3 h-3" /> Xác nhận & Duyệt
                          </button>
                          <button onClick={() => rejectStudent(s.id)} className="btn-ghost text-xs px-2 py-1.5" style={{ color: "#ef4444" }}>
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "analytics" && (
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="card-base">
                <h3 className="font-bold mb-4 flex items-center gap-2"><Users className="w-4 h-4" style={{ color: "#0891b2" }} /> Học sinh mới (30 ngày)</h3>
                <div className="flex items-end gap-1 h-40">
                  {Array.from({ length: 30 }, (_, i) => ({ h: 20 + Math.sin(i * 0.4) * 25 + Math.random() * 30 })).map((d, i) => (
                    <div key={i} className="flex-1 rounded-t" style={{ height: `${d.h}%`, background: i === 29 ? "linear-gradient(to top, #0891b2, #7c3aed)" : "rgba(8,145,178,0.2)", minHeight: 4 }} />
                  ))}
                </div>
              </div>
              <div className="card-base">
                <h3 className="font-bold mb-4">Thống kê chi tiết</h3>
                <div className="space-y-4">
                  {[
                    { label: "Tổng khóa học", value: String(stats?.totalCourses || 0), change: "" },
                    { label: "Tổng học sinh", value: String(stats?.totalStudents || 0), change: "" },
                    { label: "Doanh thu", value: stats?.totalRevenue ? `${(stats.totalRevenue).toLocaleString()} ₫` : "0 ₫", change: "" },
                    { label: "Đánh giá trung bình", value: stats?.avgRating ? `⭐ ${stats.avgRating}` : "Chưa có", change: "" },
                  ].map(({ label, value, change }) => (
                    <div key={label} className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid var(--border)" }}>
                      <span className="text-sm" style={{ color: "var(--foreground-muted)" }}>{label}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{value}</span>
                        <span className="text-xs" style={{ color: "#10b981" }}>{change}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === "reviews" && (
            <div className="card-base text-center py-12">
              <Star className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--foreground-muted)" }} />
              <h3 className="font-bold mb-2">Chưa có đánh giá</h3>
              <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>Đánh giá từ học sinh sẽ hiện ở đây</p>
            </div>
          )}

          {tab === "settings" && (
            <div className="space-y-6">
              {/* Bank Account Settings */}
              <div className="card-base">
                <h3 className="font-bold mb-5 flex items-center gap-2">
                  <CreditCard className="w-5 h-5" style={{ color: "#7c3aed" }} /> Cài đặt tài khoản ngân hàng
                </h3>
                <p className="text-sm mb-5" style={{ color: "var(--foreground-muted)" }}>
                  Thông tin này sẽ được dùng để tạo mã QR thanh toán gửi cho phụ huynh khi học sinh đăng ký khóa học trả phí.
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Ngân hàng</label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--foreground-muted)" }} />
                      <select value={bankName} onChange={(e) => setBankName(e.target.value)} className="input-base pl-9">
                        <option value="">Chọn ngân hàng</option>
                        <option value="VCB">Vietcombank (VCB)</option>
                        <option value="TCB">Techcombank (TCB)</option>
                        <option value="MB">MB Bank</option>
                        <option value="ACB">ACB</option>
                        <option value="VPB">VPBank</option>
                        <option value="BIDV">BIDV</option>
                        <option value="VTB">VietinBank</option>
                        <option value="TPB">TPBank</option>
                        <option value="MSB">MSB</option>
                        <option value="SHB">SHB</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Số tài khoản</label>
                    <input
                      value={bankAccount} onChange={(e) => setBankAccount(e.target.value)}
                      className="input-base" placeholder="VD: 1234567890"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Tên chủ tài khoản</label>
                    <input
                      value={bankOwner} onChange={(e) => setBankOwner(e.target.value)}
                      className="input-base" placeholder="VD: NGUYEN VAN MINH"
                    />
                  </div>

                  {/* QR Preview */}
                  {bankName && bankAccount && bankOwner && (
                    <div className="p-5 rounded-xl text-center" style={{ background: "var(--muted)", border: "1px solid var(--border)" }}>
                      <p className="text-xs font-semibold mb-3" style={{ color: "var(--foreground-muted)" }}>Xem trước mã QR thanh toán</p>
                      <div className="w-48 h-48 mx-auto rounded-2xl flex items-center justify-center" style={{ background: "white" }}>
                        <img
                          src={`https://img.vietqr.io/image/${bankName}-${bankAccount}-compact.png?accountName=${encodeURIComponent(bankOwner)}`}
                          alt="QR Code"
                          className="w-44 h-44 object-contain"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      </div>
                      <p className="text-xs mt-3" style={{ color: "var(--foreground-muted)" }}>
                        {bankName} • {bankAccount} • {bankOwner}
                      </p>
                    </div>
                  )}

                  <button className="btn-primary">
                    <CreditCard className="w-4 h-4" /> Lưu thông tin ngân hàng
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
