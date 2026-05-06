"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/components/auth/auth-state";
import {
  BookOpen, Clock, Award, TrendingUp, Play, BarChart3,
  ChevronRight, Star, Target, Flame, Calendar, Loader2, AlertCircle,
  UserPlus, CheckCircle2, XCircle,
} from "lucide-react";
import { toast } from "sonner";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

const recentActivity = [
  { text: "Hoàn thành Bài 16: Phân số", time: "2 giờ trước", icon: "✅" },
  { text: "Đạt 9/10 bài kiểm tra Toán", time: "5 giờ trước", icon: "🎯" },
  { text: "Bắt đầu khóa Ngữ văn", time: "1 ngày trước", icon: "📖" },
  { text: "Nhận chứng chỉ Toán cơ bản", time: "3 ngày trước", icon: "🏆" },
];

interface EnrolledCourse {
  id: string;
  courseId: string;
  progress: number;
  status: string;
  course: {
    id: string;
    title: string;
    author?: { firstName?: string; lastName?: string; username: string };
    _count?: { lessons: number };
  };
}

const courseColors = ["#7c3aed", "#0891b2", "#ec4899", "#f59e0b", "#10b981", "#3b82f6"];

export default function DashboardPage() {
  const router = useRouter();
  const { user, token, isLoggedIn, loading } = useAuth();
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [progressData, setProgressData] = useState<any>(null);
  const [parentRequests, setParentRequests] = useState<any[]>([]);

  useEffect(() => {
    if (loading) return;
    if (!isLoggedIn) {
      router.push("/auth/login");
      return;
    }
    if (user?.role === "admin") router.push("/admin");
    else if (user?.role === "teacher") router.push("/teacher");
    else if (user?.role === "parent") router.push("/parent");
  }, [user, isLoggedIn, loading, router]);

  useEffect(() => {
    if (token && user?.role === "student") {
      fetchEnrolledCourses();
      fetchParentRequests();
      // Fetch overall progress
      fetch(`${API}/progress`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : null).then(d => { if (d) setProgressData(d); }).catch(() => {});
    }
  }, [token, user]);

  async function fetchEnrolledCourses() {
    try {
      const res = await fetch(`${API}/enrollments/my-courses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setEnrolledCourses(Array.isArray(data) ? data : []);
      }
    } catch {
      console.error("Failed to fetch enrolled courses");
    } finally {
      setCoursesLoading(false);
    }
  }

  async function unenroll(courseId: string) {
    if (!confirm("Hủy đăng ký khóa học này?")) return;
    try {
      const res = await fetch(`${API}/enrollments/${courseId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setEnrolledCourses(enrolledCourses.filter(e => e.courseId !== courseId));
        toast.success("Đã hủy đăng ký");
      } else { const d = await res.json(); toast.error(d.message || "Không thể hủy"); }
    } catch { toast.error("Lỗi kết nối"); }
  }

  async function fetchParentRequests() {
    try {
      const res = await fetch(`${API}/parents/link-requests/incoming`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setParentRequests(Array.isArray(data) ? data : []);
      }
    } catch {}
  }

  async function acceptParentRequest(id: string) {
    try {
      const res = await fetch(`${API}/parents/link-request/${id}/accept`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) { toast.success("Đã liên kết với phụ huynh!"); fetchParentRequests(); }
      else { const d = await res.json(); toast.error(d.message || "Lỗi"); }
    } catch { toast.error("Lỗi kết nối"); }
  }

  async function rejectParentRequest(id: string) {
    try {
      const res = await fetch(`${API}/parents/link-request/${id}/reject`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) { toast.success("Đã từ chối yêu cầu"); fetchParentRequests(); }
      else toast.error("Lỗi");
    } catch { toast.error("Lỗi kết nối"); }
  }

  if (loading || (user && user.role !== "student")) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
        <div className="w-8 h-8 border-2 border-[#7c3aed] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const displayName = user?.firstName || user?.username || "Học sinh";
  const activeCourses = enrolledCourses.filter(e => e.status === "active" || e.status === "completed");
  const pendingCourses = enrolledCourses.filter(e => e.status === "pending");

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <Navbar />
      <div className="pt-20 pb-24 page-enter">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          {/* Background orbs */}
          <div className="orb orb-violet w-[350px] h-[350px] -top-40 right-[-100px] opacity-20 pointer-events-none" />
          <div className="orb orb-cyan w-[250px] h-[250px] top-60 left-[-80px] opacity-15 pointer-events-none" />

          {/* Header */}
          <div className="mb-8 animate-slide-up">
            <div className="section-tag mb-3">
              <BookOpen className="w-3.5 h-3.5" /> Dashboard
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold mb-2">
              Xin chào, <span className="text-shimmer">{displayName}!</span> 👋
            </h1>
            <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>Tiếp tục hành trình học tập của bạn</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Khóa đang học", value: String(activeCourses.length), icon: BookOpen, color: "#7c3aed" },
              { label: "Chờ duyệt", value: String(pendingCourses.length), icon: Clock, color: "#f59e0b" },
              { label: "Hoàn thành", value: String(activeCourses.filter(c => c.progress >= 100).length), icon: Target, color: "#10b981" },
              { label: "Chứng chỉ", value: "0", icon: Award, color: "#0891b2" },
            ].map(({ label, value, icon: Icon, color }, i) => (
              <div key={label} className="card-base card-spotlight hover-lift" style={{ animationDelay: `${i * 80}ms` }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}22` }}>
                    <Icon className="w-5 h-5" style={{ color }} />
                  </div>
                  <TrendingUp className="w-4 h-4" style={{ color: "#10b981" }} />
                </div>
                <p className="text-2xl font-extrabold">{value}</p>
                <p className="text-xs mt-1" style={{ color: "var(--foreground-muted)" }}>{label}</p>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Enrolled courses */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Khóa học của bạn</h2>
                <Link href="/courses" className="text-sm flex items-center gap-1" style={{ color: "#a78bfa" }}>
                  Xem tất cả <ChevronRight className="w-3 h-3" />
                </Link>
              </div>

              {/* Pending courses */}
              {pendingCourses.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold mb-2 flex items-center gap-1.5" style={{ color: "#f59e0b" }}>
                    <AlertCircle className="w-3.5 h-3.5" /> Đang chờ duyệt ({pendingCourses.length})
                  </p>
                  <div className="space-y-2">
                    {pendingCourses.map((enrollment, i) => (
                      <div key={enrollment.id} className="card-base flex items-center gap-4 opacity-75">
                        <div className="w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background: `${courseColors[i % courseColors.length]}22` }}>
                          <BookOpen className="w-6 h-6" style={{ color: courseColors[i % courseColors.length] }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm truncate">{enrollment.course?.title || "Khóa học"}</h3>
                          <p className="text-xs mt-1" style={{ color: "var(--foreground-muted)" }}>
                            {enrollment.course?.author?.firstName || enrollment.course?.author?.username || "Giáo viên"}
                          </p>
                        </div>
                        <span className="badge badge-warning text-[10px]">Chờ duyệt</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {coursesLoading ? (
                <div className="card-base flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#7c3aed" }} />
                </div>
              ) : activeCourses.length === 0 ? (
                <div className="card-base text-center py-12">
                  <BookOpen className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--foreground-muted)" }} />
                  <h3 className="font-bold mb-2">Chưa có khóa học nào</h3>
                  <p className="text-sm mb-4" style={{ color: "var(--foreground-muted)" }}>Hãy khám phá và đăng ký khóa học bạn yêu thích</p>
                  <Link href="/courses" className="btn-primary inline-flex">Khám phá khóa học</Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeCourses.map((enrollment, i) => {
                    const color = courseColors[i % courseColors.length];
                    const completedLessons = Math.round((enrollment.progress / 100) * (enrollment.course?._count?.lessons || 0));
                    const totalLessons = enrollment.course?._count?.lessons || 0;
                    const authorName = enrollment.course?.author?.firstName || enrollment.course?.author?.username || "Giáo viên";
                    return (
                      <Link key={enrollment.id} href={`/courses/${enrollment.courseId}`}>
                        <div className="card-base card-hover flex items-center gap-4">
                          <div className="w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background: `${color}22` }}>
                            <BookOpen className="w-6 h-6" style={{ color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm truncate">{enrollment.course?.title || "Khóa học"}</h3>
                            <p className="text-xs mt-1" style={{ color: "var(--foreground-muted)" }}>{authorName} • {completedLessons}/{totalLessons} bài</p>
                            <div className="mt-2 progress-bar">
                              <div className="progress-fill" style={{ width: `${enrollment.progress}%` }} />
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-lg font-bold" style={{ color }}>{enrollment.progress}%</p>
                            <button className="mt-1 text-xs flex items-center gap-1 btn-ghost px-2 py-1" style={{ color: "#a78bfa" }}>
                              <Play className="w-3 h-3" /> Tiếp tục
                            </button>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* Weekly chart */}
              <div className="card-base mt-6">
                <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" style={{ color: "#7c3aed" }} />
                  Thời gian học tuần này
                </h3>
                <div className="flex items-end gap-2 h-32">
                  {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((day, i) => {
                    const heights = [60, 80, 45, 90, 70, 30, 50];
                    return (
                      <div key={day} className="flex-1 flex flex-col items-center gap-1">
                        <div
                          className="w-full rounded-lg transition-all duration-300"
                          style={{
                            height: `${heights[i]}%`,
                            background: i === 3 ? "linear-gradient(to top, #7c3aed, #0891b2)" : "rgba(124,58,237,0.2)",
                            minHeight: 8,
                          }}
                        />
                        <span className="text-[10px]" style={{ color: "var(--foreground-muted)" }}>{day}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Parent link requests */}
              {parentRequests.length > 0 && (
                <div className="card-base" style={{ border: "1px solid rgba(245,158,11,0.3)", background: "rgba(245,158,11,0.05)" }}>
                  <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                    <UserPlus className="w-4 h-4" style={{ color: "#f59e0b" }} /> Yêu cầu liên kết phụ huynh
                    <span className="w-5 h-5 rounded-full text-[10px] flex items-center justify-center text-white" style={{ background: "#ef4444" }}>{parentRequests.length}</span>
                  </h3>
                  <div className="space-y-2">
                    {parentRequests.map((req: any) => (
                      <div key={req.id} className="p-3 rounded-xl" style={{ background: "var(--card)" }}>
                        <p className="text-sm font-semibold mb-1">{req.parent?.firstName || req.parent?.username || "Phụ huynh"}</p>
                        <p className="text-[10px] mb-2" style={{ color: "var(--foreground-muted)" }}>{req.parent?.email || ""}</p>
                        <div className="flex gap-2">
                          <button onClick={() => acceptParentRequest(req.id)} className="btn-primary text-xs px-3 py-1.5 flex-1">
                            <CheckCircle2 className="w-3 h-3" /> Xác nhận
                          </button>
                          <button onClick={() => rejectParentRequest(req.id)} className="btn-ghost text-xs px-3 py-1.5" style={{ color: "#ef4444" }}>
                            <XCircle className="w-3 h-3" /> Từ chối
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Streak */}
              <div className="card-base text-center">
                <Flame className="w-10 h-10 mx-auto mb-2" style={{ color: "#f59e0b" }} />
                <p className="text-2xl font-extrabold">7 ngày</p>
                <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>Chuỗi học liên tiếp 🔥</p>
              </div>

              {/* Recent activity */}
              <div className="card-base">
                <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4" style={{ color: "#7c3aed" }} />
                  Hoạt động gần đây
                </h3>
                <div className="space-y-3">
                  {recentActivity.map((act, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="text-lg">{act.icon}</span>
                      <div>
                        <p className="text-sm">{act.text}</p>
                        <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>{act.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Suggested */}
              <div className="card-base">
                <h3 className="font-bold text-sm mb-3">Gợi ý cho bạn</h3>
                <Link href="/courses" className="btn-secondary w-full justify-center text-sm">
                  <Star className="w-4 h-4" /> Khám phá khóa mới
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
