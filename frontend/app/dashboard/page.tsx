"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/components/auth/auth-state";
import {
  BookOpen, Clock, Award, TrendingUp, Play, BarChart3,
  ChevronRight, Star, Target, Loader2, AlertCircle,
  UserPlus, CheckCircle2, XCircle, Gift,
} from "lucide-react";
import { toast } from "sonner";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

interface StreakReward {
  days: number;
  discount: number;
  remaining: number;
}

interface RewardResult {
  code: string;
  discount: number;
  label: string;
}

interface DashboardData {
  streak: number;
  nextReward: StreakReward | null;
  activities: Array<{ text: string; time: string; type: string }>;
}

interface CheckInResult {
  streak: number;
  rewarded: boolean;
  reward: RewardResult | null;
  nextReward: StreakReward | null;
  activeCoupon: { code: string; discount: number; expiresAt: string } | null;
}

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
    sections?: any[];
  };
}

const courseColors = ["#7c3aed", "#0891b2", "#ec4899", "#f59e0b", "#10b981", "#3b82f6"];

function relativeTime(iso: string): string {
  const d = new Date(iso);
  const diff = Math.floor((Date.now() - d.getTime()) / 60000);
  if (diff < 1) return "Vừa xong";
  if (diff < 60) return `${diff} phút trước`;
  if (diff < 1440) return `${Math.floor(diff / 60)} giờ trước`;
  return `${Math.floor(diff / 1440)} ngày trước`;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, token, isLoggedIn, loading } = useAuth();
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [parentRequests, setParentRequests] = useState<any[]>([]);
  const [dashboard, setDashboard] = useState<DashboardData>({ streak: 0, nextReward: null, activities: [] });
  const [rewardPopup, setRewardPopup] = useState<RewardResult | null>(null);
  const [streakCoupon, setStreakCoupon] = useState<{ code: string; discount: number; expiresAt: string } | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!isLoggedIn) { router.push("/auth/login"); return; }
    if (user?.role === "admin") router.push("/admin");
    else if (user?.role === "teacher") router.push("/teacher");
    else if (user?.role === "parent") router.push("/parent");
  }, [user, isLoggedIn, loading, router]);

  useEffect(() => {
    if (token && user?.role === "student") {
      fetchEnrolledCourses();
      fetchParentRequests();

      // Dashboard data
      fetch(`${API}/users/me/dashboard`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d) setDashboard(d); })
        .catch(() => {});

      // Auto check-in streak
      fetch(`${API}/users/me/streak/check-in`, { method: "POST", headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : null)
        .then((d: CheckInResult | null) => {
          if (d) {
            setDashboard(prev => ({ ...prev, streak: d.streak, nextReward: d.nextReward }));
            if (d.activeCoupon) setStreakCoupon(d.activeCoupon);
            if (d.rewarded && d.reward) {
              setRewardPopup(d.reward);
            }
          }
        })
        .catch(() => {});
    }
  }, [token, user]);

  async function fetchEnrolledCourses() {
    try {
      const res = await fetch(`${API}/enrollments/my-courses`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const data = await res.json(); setEnrolledCourses(Array.isArray(data) ? data : []); }
    } catch { console.error("Failed to fetch enrolled courses"); }
    finally { setCoursesLoading(false); }
  }

  async function fetchParentRequests() {
    try {
      const res = await fetch(`${API}/parents/link-requests/incoming`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const data = await res.json(); setParentRequests(Array.isArray(data) ? data : []); }
    } catch {}
  }

  async function acceptParentRequest(id: string) {
    try {
      const res = await fetch(`${API}/parents/link-request/${id}/accept`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { toast.success("Đã liên kết với phụ huynh!"); fetchParentRequests(); }
      else { const d = await res.json(); toast.error(d.message || "Lỗi"); }
    } catch { toast.error("Lỗi kết nối"); }
  }

  async function rejectParentRequest(id: string) {
    try {
      const res = await fetch(`${API}/parents/link-request/${id}/reject`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
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

      {/* Reward popup overlay */}
      {rewardPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="card-base max-w-sm mx-4 text-center p-8 animate-scale-in" style={{ border: "1px solid rgba(245,158,11,0.4)" }}>
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: "rgba(245,158,11,0.15)" }}>
              <Gift className="w-8 h-8" style={{ color: "#f59e0b" }} />
            </div>
            <h2 className="text-xl font-bold mb-2">{rewardPopup.label}</h2>
            <p className="text-sm mb-4" style={{ color: "var(--foreground-muted)" }}>
              Bạn nhận được mã giảm giá <strong style={{ color: "#f59e0b" }}>{rewardPopup.discount}%</strong>
            </p>
            <div className="p-3 rounded-xl mb-4 font-mono text-lg font-bold tracking-wider" style={{ background: "rgba(124,58,237,0.1)", color: "#a78bfa" }}>
              {rewardPopup.code}
            </div>
            <p className="text-[11px] mb-5" style={{ color: "var(--foreground-muted)" }}>Mã có hiệu lực 30 ngày. Dùng khi thanh toán khóa học.</p>
            <button onClick={() => setRewardPopup(null)} className="btn-primary w-full">Tuyệt vời!</button>
          </div>
        </div>
      )}

      <div className="pt-20 pb-24 page-enter">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          {/* Background orbs */}
          <div className="orb orb-violet w-[350px] h-[350px] -top-40 right-[-100px] opacity-20 pointer-events-none" />
          <div className="orb orb-cyan w-[250px] h-[250px] top-60 left-[-80px] opacity-15 pointer-events-none" />

          {/* Header */}
          <div className="mb-8 animate-slide-up">
            <h1 className="text-2xl sm:text-3xl font-extrabold mb-1">
              Xin chào, <span className="text-shimmer">{displayName}</span>
            </h1>
            <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>Tiếp tục hành trình học tập của bạn</p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Đang học", value: activeCourses.length, color: "#7c3aed" },
              { label: "Chờ duyệt", value: pendingCourses.length, color: "#f59e0b" },
              { label: "Hoàn thành", value: activeCourses.filter(c => c.progress >= 100).length, color: "#10b981" },
              { label: "Chuỗi ngày", value: dashboard.streak, color: "#ef4444" },
            ].map(({ label, value, color }, i) => (
              <div key={label} className="card-base hover-lift" style={{ animationDelay: `${i * 80}ms` }}>
                <p className="text-2xl font-extrabold" style={{ color }}>{value}</p>
                <p className="text-xs mt-1" style={{ color: "var(--foreground-muted)" }}>{label}</p>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-6">

              {/* Enrolled courses */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold">Khóa học của bạn</h2>
                  <Link href="/courses" className="text-sm flex items-center gap-1" style={{ color: "#a78bfa" }}>
                    Tất cả <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>

                {/* Pending */}
                {pendingCourses.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-semibold mb-2" style={{ color: "#f59e0b" }}>
                      Đang chờ duyệt ({pendingCourses.length})
                    </p>
                    <div className="space-y-2">
                      {pendingCourses.map((enrollment, i) => (
                        <div key={enrollment.id} className="card-base flex items-center gap-4 opacity-70">
                          <div className="w-2 h-10 rounded-full flex-shrink-0" style={{ background: courseColors[i % courseColors.length] }} />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm truncate">{enrollment.course?.title || "Khóa học"}</h3>
                            <p className="text-xs mt-0.5" style={{ color: "var(--foreground-muted)" }}>
                              {enrollment.course?.author?.firstName || enrollment.course?.author?.username || "Giáo viên"}
                            </p>
                          </div>
                          <span className="text-[10px] px-2 py-1 rounded-full" style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b" }}>Chờ duyệt</span>
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
                    <h3 className="font-bold mb-2">Chưa có khóa học nào</h3>
                    <p className="text-sm mb-4" style={{ color: "var(--foreground-muted)" }}>Hãy khám phá và đăng ký khóa học bạn yêu thích</p>
                    <Link href="/courses" className="btn-primary inline-flex">Khám phá khóa học</Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeCourses.map((enrollment, i) => {
                      const color = courseColors[i % courseColors.length];
                      const totalLessons = enrollment.course?.sections?.reduce((sum: number, sec: any) => sum + (sec.lessons?.length || 0), 0) || enrollment.course?._count?.lessons || 0;
                      const completedLessons = totalLessons > 0 ? Math.round((enrollment.progress / 100) * totalLessons) : 0;
                      const authorName = enrollment.course?.author?.firstName || enrollment.course?.author?.username || "Giáo viên";
                      return (
                        <Link key={enrollment.id} href={`/courses/${enrollment.courseId}`}>
                          <div className="card-base card-hover flex items-center gap-4">
                            <div className="w-2 h-12 rounded-full flex-shrink-0" style={{ background: color }} />
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-sm truncate">{enrollment.course?.title || "Khóa học"}</h3>
                              <p className="text-xs mt-0.5" style={{ color: "var(--foreground-muted)" }}>{authorName} · {completedLessons}/{totalLessons} bài</p>
                              <div className="mt-2 progress-bar">
                                <div className="progress-fill" style={{ width: `${enrollment.progress}%` }} />
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-lg font-bold" style={{ color }}>{enrollment.progress}%</p>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Weekly chart */}
              <div className="card-base">
                <h3 className="font-semibold text-sm mb-4">Thời gian học tuần này</h3>
                <div className="flex items-end gap-2 h-28">
                  {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((day, i) => {
                    const heights = [60, 80, 45, 90, 70, 30, 50];
                    const today = new Date().getDay(); // 0=CN, 1=T2...
                    const isToday = (i === 6 && today === 0) || (i + 1 === today);
                    return (
                      <div key={day} className="flex-1 flex flex-col items-center gap-1">
                        <div
                          className="w-full rounded-md transition-all duration-300"
                          style={{
                            height: `${heights[i]}%`,
                            background: isToday ? "linear-gradient(to top, #7c3aed, #a78bfa)" : "rgba(124,58,237,0.15)",
                            minHeight: 6,
                          }}
                        />
                        <span className="text-[10px]" style={{ color: isToday ? "#a78bfa" : "var(--foreground-muted)" }}>{day}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-5">

              {/* Parent requests */}
              {parentRequests.length > 0 && (
                <div className="card-base" style={{ border: "1px solid rgba(245,158,11,0.3)" }}>
                  <h3 className="font-semibold text-sm mb-3">
                    Yêu cầu liên kết phụ huynh
                    <span className="ml-2 w-5 h-5 inline-flex items-center justify-center rounded-full text-[10px] text-white" style={{ background: "#ef4444" }}>{parentRequests.length}</span>
                  </h3>
                  <div className="space-y-2">
                    {parentRequests.map((req: any) => (
                      <div key={req.id} className="p-3 rounded-xl" style={{ background: "var(--card)" }}>
                        <p className="text-sm font-semibold mb-1">{req.parent?.firstName || req.parent?.username || "Phụ huynh"}</p>
                        <p className="text-[10px] mb-2" style={{ color: "var(--foreground-muted)" }}>{req.parent?.email || ""}</p>
                        <div className="flex gap-2">
                          <button onClick={() => acceptParentRequest(req.id)} className="btn-primary text-xs px-3 py-1.5 flex-1">Xác nhận</button>
                          <button onClick={() => rejectParentRequest(req.id)} className="btn-ghost text-xs px-3 py-1.5" style={{ color: "#ef4444" }}>Từ chối</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Streak + Rewards */}
              <div className="card-base" style={{ border: "1px solid rgba(124,58,237,0.2)" }}>
                <div className="flex items-baseline justify-between mb-3">
                  <h3 className="font-semibold text-sm">Chuỗi học tập</h3>
                  <span className="text-2xl font-extrabold" style={{ color: "#7c3aed" }}>{dashboard.streak}</span>
                </div>
                <p className="text-xs mb-4" style={{ color: "var(--foreground-muted)" }}>
                  {dashboard.streak === 0
                    ? "Bắt đầu học mỗi ngày để tạo chuỗi!"
                    : `${dashboard.streak} ngày liên tiếp`}
                </p>

                {/* Progress toward next reward */}
                {dashboard.nextReward && (
                  <div className="p-3 rounded-xl mb-3" style={{ background: "rgba(124,58,237,0.06)" }}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span style={{ color: "var(--foreground-muted)" }}>Mốc tiếp theo: {dashboard.nextReward.days} ngày</span>
                      <span style={{ color: "#a78bfa" }}>giảm {dashboard.nextReward.discount}%</span>
                    </div>
                    <div className="progress-bar" style={{ height: 6 }}>
                      <div className="progress-fill" style={{
                        width: `${Math.min(100, ((dashboard.nextReward.days - dashboard.nextReward.remaining) / dashboard.nextReward.days) * 100)}%`,
                        background: "linear-gradient(to right, #7c3aed, #a78bfa)"
                      }} />
                    </div>
                    <p className="text-[10px] mt-1.5" style={{ color: "var(--foreground-muted)" }}>
                      Còn {dashboard.nextReward.remaining} ngày nữa
                    </p>
                  </div>
                )}

                {/* Milestones */}
                <div className="space-y-1.5">
                  {[
                    { days: 14, discount: 10 },
                    { days: 30, discount: 15 },
                    { days: 60, discount: 25 },
                    { days: 100, discount: 35 },
                    { days: 180, discount: 50 },
                  ].map(m => {
                    const done = dashboard.streak >= m.days;
                    return (
                      <div key={m.days} className="flex items-center justify-between text-xs py-1">
                        <span style={{ color: done ? "#10b981" : "var(--foreground-muted)", textDecoration: done ? "line-through" : "none" }}>
                          {m.days} ngày
                        </span>
                        <span style={{ color: done ? "#10b981" : "var(--foreground-muted)" }}>
                          {done ? "Đã nhận" : `−${m.discount}%`}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Active streak coupon */}
                {streakCoupon && (
                  <div className="mt-3 p-3 rounded-xl" style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.08), rgba(245,158,11,0.08))", border: "1px solid rgba(245,158,11,0.25)" }}>
                    <p className="text-[10px] font-semibold mb-1.5 flex items-center gap-1" style={{ color: "#f59e0b" }}>
                      <Gift className="w-3 h-3" /> Mã giảm giá cá nhân
                    </p>
                    <div className="font-mono text-sm font-bold tracking-wider" style={{ color: "#a78bfa" }}>
                      {streakCoupon.code}
                    </div>
                    <p className="text-[10px] mt-1" style={{ color: "var(--foreground-muted)" }}>
                      Giảm {streakCoupon.discount}% · Hết hạn {new Date(streakCoupon.expiresAt).toLocaleDateString("vi-VN")}
                    </p>
                    <p className="text-[9px] mt-0.5 italic" style={{ color: "var(--foreground-muted)" }}>
                      Dùng khi thanh toán khóa học · Chỉ dành cho bạn
                    </p>
                  </div>
                )}
              </div>

              {/* Recent activity */}
              <div className="card-base">
                <h3 className="font-semibold text-sm mb-3">Hoạt động gần đây</h3>
                {dashboard.activities.length === 0 ? (
                  <p className="text-xs py-4 text-center" style={{ color: "var(--foreground-muted)" }}>Chưa có hoạt động</p>
                ) : (
                  <div className="space-y-3">
                    {dashboard.activities.map((act, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{
                          background: act.type === 'certificate' ? '#f59e0b'
                            : act.type === 'quiz' ? '#10b981'
                            : act.type === 'enrollment' ? '#0891b2'
                            : '#7c3aed'
                        }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm leading-snug truncate">{act.text}</p>
                          <p className="text-[10px] mt-0.5" style={{ color: "var(--foreground-muted)" }}>{relativeTime(act.time)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Achievements */}
              <Link href="/achievements" className="card-base card-hover block text-center" style={{ border: "1px solid rgba(255,215,0,0.2)" }}>
                <p className="text-sm font-semibold" style={{ color: "#ffd700" }}>🏆 Bảng Thành Tích →</p>
              </Link>

              {/* Explore */}
              <Link href="/courses" className="card-base card-hover block text-center">
                <p className="text-sm font-semibold" style={{ color: "#a78bfa" }}>Khám phá khóa mới →</p>
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
