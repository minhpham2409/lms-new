"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/components/auth/auth-state";
import {
  Loader2, PlayCircle, Clock, CheckCircle2, Award, AlertCircle, ClipboardList, MessageSquareText,
  CalendarDays, ChevronRight, GraduationCap, LayoutGrid, ListChecks,
  TrendingUp, X, UserRound, BookOpen
} from "lucide-react";
import { toast } from "sonner";
import { studentLearningApi } from "@/lib/api-service";
import type { LearningSummary } from "@/types";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

interface DashboardData {
  streak: number;
  nextReward: any | null;
  activities: Array<{ text: string; time: string; type: string }>;
}

interface EnrolledCourse {
  id: string;
  courseId: string;
  progress: number;
  status: string;
  course: {
    id: string;
    title: string;
    description?: string | null;
    thumbnail?: string | null;
    price?: number;
    author?: { firstName?: string; lastName?: string; username: string };
    _count?: { lessons: number };
    sections?: any[];
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, token, isLoggedIn, loading } = useAuth();
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [parentRequests, setParentRequests] = useState<any[]>([]);
  const [dashboard, setDashboard] = useState<DashboardData>({ streak: 0, nextReward: null, activities: [] });
  const [achievements, setAchievements] = useState<any[]>([]);
  const [learningSummary, setLearningSummary] = useState<LearningSummary | null>(null);
  const [activeTab, setActiveTab] = useState<"courses" | "todos" | "feedback" | "stats" | "requests">("courses");
  const [selectedCourse, setSelectedCourse] = useState<EnrolledCourse | null>(null);

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
      studentLearningApi.getSummary()
        .then(setLearningSummary)
        .catch(() => setLearningSummary(null));
      fetch(`${API}/users/me/dashboard`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d) setDashboard(d); }).catch(() => {});
      fetch(`${API}/users/me/streak/check-in`, { method: "PUT", headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : null).then((d: any) => {
          if (d) setDashboard(prev => ({ ...prev, streak: d.streak, nextReward: d.nextReward }));
        }).catch(() => {});
      fetch(`${API}/achievements/me`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d?.badges) setAchievements(d.badges); }).catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user]);

  async function fetchEnrolledCourses() {
    try {
      const res = await fetch(`${API}/enrollments/my-courses`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const data = await res.json(); setEnrolledCourses(Array.isArray(data) ? data : []); }
    } catch { }
    finally { setCoursesLoading(false); }
  }

  async function fetchParentRequests() {
    try {
      const res = await fetch(`${API}/parents/link-requests/incoming`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const data = await res.json(); setParentRequests(Array.isArray(data) ? data : []); }
    } catch {}
  }

  async function acceptParentLink(linkId: string) {
    try {
      const res = await fetch(`${API}/parents/link-request/${linkId}/accept`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success("✅ Đã chấp nhận liên kết phụ huynh!");
        setParentRequests(prev => prev.filter(r => r.id !== linkId));
      } else {
        const d = await res.json().catch(() => ({}));
        toast.error(d.message || "Lỗi chấp nhận liên kết");
      }
    } catch { toast.error("Lỗi kết nối"); }
  }

  async function rejectParentLink(linkId: string) {
    try {
      const res = await fetch(`${API}/parents/link-request/${linkId}/reject`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success("Đã từ chối liên kết");
        setParentRequests(prev => prev.filter(r => r.id !== linkId));
      } else {
        const d = await res.json().catch(() => ({}));
        toast.error(d.message || "Lỗi từ chối liên kết");
      }
    } catch { toast.error("Lỗi kết nối"); }
  }

  if (loading || (user && user.role !== "student")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const activeCourses = enrolledCourses.filter(e => e.status === "active" || e.status === "completed");
  const pendingCourses = enrolledCourses.filter(e => e.status === "pending");
  const completedCourses = activeCourses.filter(c => c.progress >= 100).length;
  const totalTodos = learningSummary?.todos.length ?? 0;
  const earnedBadges = achievements.filter(a => a.earned).length;
  const displayName = user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : user?.username || "Học viên";
  const tabs: Array<{ id: typeof activeTab; label: string; count?: number; icon: any }> = [
    { id: "courses", label: "Khóa học", count: activeCourses.length, icon: LayoutGrid },
    { id: "todos", label: "Việc cần làm", count: totalTodos, icon: ListChecks },
    { id: "feedback", label: "Điểm & nhận xét", count: learningSummary?.feedback.length, icon: MessageSquareText },
    { id: "stats", label: "Thành tích", count: earnedBadges, icon: TrendingUp },
    ...(parentRequests.length > 0 || pendingCourses.length > 0
      ? [{ id: "requests" as const, label: "Chờ xử lý", count: parentRequests.length + pendingCourses.length, icon: AlertCircle }]
      : []),
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--background)" }}>
      <Navbar />

      {selectedCourse && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => setSelectedCourse(null)}>
          <div className="w-full max-w-2xl overflow-hidden rounded-xl border border-border bg-[var(--card)] shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="relative min-h-40 border-b border-border bg-[var(--background-2)]">
              {selectedCourse.course.thumbnail ? (
                <img src={selectedCourse.course.thumbnail} alt={selectedCourse.course.title} className="absolute inset-0 h-full w-full object-cover opacity-70" />
              ) : (
                <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(248,180,134,0.22),rgba(124,58,237,0.16))]" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--card)] via-[var(--card)]/55 to-transparent" />
              <button onClick={() => setSelectedCourse(null)} className="absolute right-4 top-4 rounded-lg bg-black/40 p-2 text-white hover:bg-black/60">
                <X className="h-4 w-4" />
              </button>
              <div className="relative z-10 flex min-h-40 flex-col justify-end p-6">
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-primary">Thông tin khóa học</p>
                <h2 className="text-2xl font-extrabold">{selectedCourse.course.title}</h2>
              </div>
            </div>
            <div className="grid gap-5 p-6 sm:grid-cols-[1fr_220px]">
              <div>
                <p className="text-sm leading-7 text-foreground-muted">
                  {selectedCourse.course.description || "Khóa học chưa có mô tả chi tiết."}
                </p>
                <div className="mt-5 grid grid-cols-3 gap-3">
                  <div className="rounded-lg border border-border bg-[var(--muted)] p-3">
                    <p className="text-lg font-extrabold text-primary">{Math.round(selectedCourse.progress)}%</p>
                    <p className="text-[10px] font-bold uppercase text-foreground-muted">Tiến độ</p>
                  </div>
                  <div className="rounded-lg border border-border bg-[var(--muted)] p-3">
                    <p className="text-lg font-extrabold text-primary">{selectedCourse.course.sections?.length || 0}</p>
                    <p className="text-[10px] font-bold uppercase text-foreground-muted">Chương</p>
                  </div>
                  <div className="rounded-lg border border-border bg-[var(--muted)] p-3">
                    <p className="text-lg font-extrabold text-primary">{selectedCourse.course.sections?.reduce((sum, sec) => sum + (sec.lessons?.length || 0), 0) || selectedCourse.course._count?.lessons || 0}</p>
                    <p className="text-[10px] font-bold uppercase text-foreground-muted">Bài học</p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-border bg-[var(--background)] p-4">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <UserRound className="h-5 w-5" />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted">Giảng viên phụ trách</p>
                <p className="mt-1 font-extrabold">
                  {selectedCourse.course.author?.firstName
                    ? `${selectedCourse.course.author.firstName} ${selectedCourse.course.author.lastName || ""}`.trim()
                    : selectedCourse.course.author?.username || "Giáo viên"}
                </p>
                <Link href={`/courses/${selectedCourse.courseId}`} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground">
                  Vào khóa học <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      <section className="pt-28 pb-8 border-b border-border bg-[var(--background-2)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-[var(--card)] px-3 py-1 text-xs font-bold text-[var(--primary)]">
              <GraduationCap className="h-4 w-4" />
              Student Learning Hub
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">Học tập của tôi</h1>
            <p className="mt-4 max-w-2xl text-base text-foreground-muted">
              Xin chào {displayName}. Theo dõi khóa học, việc cần làm, điểm số và tiến độ học tập ở một nơi.
            </p>
          </div>

          <div className="mt-8 overflow-x-auto rounded-xl border border-border bg-[var(--card)] p-2 shadow-sm">
            <div className="flex min-w-max gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition-colors ${
                    activeTab === tab.id
                      ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                      : "text-foreground-muted hover:bg-[var(--muted)] hover:text-foreground"
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                  {typeof tab.count === "number" && tab.count > 0 && (
                    <span className={`rounded-full px-2 py-0.5 text-[11px] ${activeTab === tab.id ? "bg-white/20" : "bg-[var(--muted)]"}`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           
           {activeTab === "courses" && (
             <div>
                {learningSummary?.continueLearning && (
                  <Link
                    href={learningSummary.continueLearning.url}
                    className="mb-7 flex flex-col gap-5 rounded-xl border border-border bg-[var(--card)] p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--muted)] text-[var(--primary)]">
                        <PlayCircle className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-foreground-muted">Học tiếp</p>
                        <h2 className="text-lg font-extrabold">{learningSummary.continueLearning.lessonTitle}</h2>
                        <p className="text-sm text-foreground-muted">
                          Đã xem {Math.round(learningSummary.continueLearning.watchedPercentage)}%
                          {learningSummary.continueLearning.watchTime > 0 ? ` · tiếp tục từ ${Math.floor(learningSummary.continueLearning.watchTime / 60)}:${String(learningSummary.continueLearning.watchTime % 60).padStart(2, "0")}` : ""}
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-bold text-[var(--primary-foreground)]">
                      Vào bài học <ChevronRight className="h-4 w-4" />
                    </span>
                  </Link>
                )}
                {coursesLoading ? (
                  <div className="flex justify-center rounded-xl border border-border bg-[var(--card)] py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                ) : activeCourses.length === 0 ? (
                  <div className="text-center py-20 border border-border rounded-xl bg-[var(--card)] shadow-sm">
                     <h3 className="text-2xl font-bold mb-4">Bạn chưa đăng ký khóa học nào</h3>
                     <Link href="/courses" className="inline-flex rounded-lg bg-[var(--primary)] px-6 py-3 font-bold text-[var(--primary-foreground)]">Khám phá khóa học ngay</Link>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                     {activeCourses.map(enrollment => {
                        const totalLessons = enrollment.course?.sections?.reduce((sum: number, sec: any) => sum + (sec.lessons?.length || 0), 0) || enrollment.course?._count?.lessons || 0;
                        const authorName = enrollment.course?.author?.firstName || enrollment.course?.author?.username || "Giáo viên";
                        const isCompleted = enrollment.progress >= 100;
                        return (
                           <button key={enrollment.id} type="button" onClick={() => setSelectedCourse(enrollment)} className="group text-left">
                              <div className="border border-border rounded-xl overflow-hidden h-full flex flex-col bg-[var(--card)] shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
                                 <div className="aspect-video bg-[var(--background-2)] relative border-b border-border">
                                    {enrollment.course.thumbnail ? (
                                      <img src={enrollment.course.thumbnail} alt={enrollment.course.title} className="absolute inset-0 h-full w-full object-cover opacity-75 transition-transform duration-500 group-hover:scale-105" />
                                    ) : (
                                      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(232,154,100,0.18),rgba(59,130,246,0.14))]" />
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                                    <div className="absolute left-4 top-4 rounded-full bg-black/30 px-2.5 py-1 text-xs font-bold text-white">
                                      {totalLessons} bài học
                                    </div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                       <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/40 bg-black/20 text-white transition-transform group-hover:scale-105">
                                         <PlayCircle className="w-9 h-9" />
                                       </div>
                                    </div>
                                 </div>
                                 <div className="p-5 flex-1 flex flex-col">
                                    <h3 className="font-extrabold mb-1 line-clamp-2 leading-tight group-hover:text-primary transition-colors">{enrollment.course?.title}</h3>
                                    <p className="text-xs text-foreground-muted mb-3">Giảng viên {authorName}</p>
                                    {enrollment.course.description && (
                                      <p className="mb-5 line-clamp-2 text-sm leading-6 text-foreground-muted">{enrollment.course.description}</p>
                                    )}
                                    
                                    <div className="mt-auto">
                                       <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden mb-2">
                                          <div className={`h-full ${isCompleted ? 'bg-green-500' : 'bg-primary'}`} style={{ width: `${enrollment.progress}%`}} />
                                       </div>
                                       <div className="flex justify-between text-xs font-bold">
                                          <span className="text-foreground-muted">{Math.round(enrollment.progress)}% hoàn thành</span>
                                          {isCompleted && <span className="text-green-500 flex items-center gap-1"><Award className="w-3 h-3"/> Đã hoàn thành</span>}
                                       </div>
                                       <div className="mt-4 flex items-center justify-between border-t border-border pt-4 text-sm font-bold text-[var(--primary)]">
                                         <span>Xem chi tiết</span>
                                         <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                       </div>
                                    </div>
                                 </div>
                              </div>
                           </button>
                        )
                     })}
                  </div>
                )}
             </div>
           )}

           {/* TAB: TODOS */}
           {activeTab === "todos" && (
             <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
                <div className="space-y-4">
                  {(learningSummary?.todos.length ?? 0) === 0 ? (
                    <div className="rounded-xl border border-border bg-[var(--card)] p-8 text-center shadow-sm">
                      <ClipboardList className="mx-auto mb-3 h-9 w-9 text-foreground-muted" />
                      <h3 className="font-bold">Không có việc cần làm</h3>
                      <p className="mt-1 text-sm text-foreground-muted">Bài tập và quiz chưa làm sẽ xuất hiện tại đây.</p>
                    </div>
                  ) : learningSummary?.todos.map((item) => (
                    <Link key={item.id} href={item.url} className="group block overflow-hidden rounded-xl border border-border bg-[var(--card)] shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md">
                      <div className="grid gap-4 p-5 sm:grid-cols-[56px_1fr_auto] sm:items-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          {item.type === "quiz" ? <ClipboardList className="h-6 w-6" /> : <BookOpen className="h-6 w-6" />}
                        </div>
                        <div className="min-w-0">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">{item.type === "quiz" ? "Quiz" : "Bài tập"}</span>
                            {item.dueDate && <span className="rounded bg-[var(--muted)] px-2 py-0.5 text-xs font-semibold text-foreground-muted">Hạn {new Date(item.dueDate).toLocaleDateString("vi-VN")}</span>}
                          </div>
                          <h3 className="font-extrabold leading-tight">{item.title}</h3>
                          <p className="mt-1 text-sm text-foreground-muted">{item.courseTitle} · {item.lessonTitle}</p>
                        </div>
                        <div className="flex items-center gap-2 text-sm font-bold text-primary">
                          <span>Làm ngay</span>
                          <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
                <div className="h-fit rounded-xl border border-border bg-[var(--card)] p-5 shadow-sm">
                  <h3 className="mb-4 font-extrabold">Tổng quan học tập</h3>
                  <div className="space-y-3 text-sm">
                    {[
                      ["Khóa đang học", learningSummary?.stats.activeCourses ?? activeCourses.length],
                      ["Việc cần làm", learningSummary?.stats.pendingTasks ?? 0],
                      ["Đã hoàn thành", learningSummary?.stats.completedCourses ?? 0],
                    ].map(([label, value]) => (
                      <div key={label} className="flex items-center justify-between rounded-lg bg-[var(--muted)] px-4 py-3">
                        <span className="text-foreground-muted">{label}</span>
                        <b className="text-primary">{value}</b>
                      </div>
                    ))}
                  </div>
                </div>
             </div>
           )}

           {/* TAB: FEEDBACK */}
           {activeTab === "feedback" && (
             <div className="space-y-3">
                {(learningSummary?.feedback.length ?? 0) === 0 ? (
                  <div className="rounded-xl border border-border bg-[var(--card)] p-8 text-center shadow-sm">
                    <MessageSquareText className="mx-auto mb-3 h-9 w-9 text-foreground-muted" />
                    <h3 className="font-bold">Chưa có điểm hoặc nhận xét mới</h3>
                    <p className="mt-1 text-sm text-foreground-muted">Kết quả quiz và bài tập đã chấm sẽ được gom ở đây.</p>
                  </div>
                ) : learningSummary?.feedback.map((item) => (
                  <Link key={`${item.kind}-${item.id}`} href={item.url} className="block rounded-xl border border-border bg-[var(--card)] p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span className="rounded bg-green-500/10 px-2 py-0.5 text-xs font-bold text-green-600">{item.kind === "quiz" ? "Quiz" : "Bài tập"}</span>
                          <span className="text-xs text-foreground-muted">{item.courseTitle} · {item.lessonTitle}</span>
                        </div>
                        <h3 className="font-bold">{item.title}</h3>
                        {item.feedback && <p className="mt-2 text-sm text-foreground-muted line-clamp-2">Nhận xét: {item.feedback}</p>}
                      </div>
                      <div className="shrink-0 text-left sm:text-right">
                        <p className="text-2xl font-black text-green-600">{item.score ?? 0}<span className="text-sm text-foreground-muted">/{item.maxScore}</span></p>
                        {item.gradedAt && <p className="text-xs text-foreground-muted">{new Date(item.gradedAt).toLocaleDateString("vi-VN")}</p>}
                      </div>
                    </div>
                  </Link>
                ))}
             </div>
           )}

           {/* TAB: STATS & ACHIEVEMENTS */}
           {activeTab === "stats" && (
             <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="border border-border rounded-xl p-6 bg-[var(--card)] text-center shadow-sm">
                         <p className="text-3xl font-extrabold text-primary mb-1">{activeCourses.length}</p>
                         <p className="text-sm text-foreground-muted font-bold">Đang học</p>
                      </div>
                      <div className="border border-border rounded-xl p-6 bg-[var(--card)] text-center shadow-sm">
                         <p className="text-3xl font-extrabold text-green-500 mb-1">{completedCourses}</p>
                         <p className="text-sm text-foreground-muted font-bold">Hoàn thành</p>
                      </div>
                      <div className="border border-border rounded-xl p-6 bg-[var(--card)] text-center shadow-sm">
                         <p className="text-3xl font-extrabold text-yellow-500 mb-1">{dashboard.streak}</p>
                         <p className="text-sm text-foreground-muted font-bold">Ngày liên tiếp</p>
                      </div>
                      <div className="border border-border rounded-xl p-6 bg-[var(--card)] text-center shadow-sm">
                         <p className="text-3xl font-extrabold text-cyan-500 mb-1">{earnedBadges}</p>
                         <p className="text-sm text-foreground-muted font-bold">Huy hiệu</p>
                      </div>
                   </div>

                   <div className="border border-border rounded-xl p-6 bg-[var(--card)] shadow-sm">
                      <h3 className="font-bold text-lg mb-6 flex items-center gap-2"><CalendarDays className="h-5 w-5 text-[var(--primary)]" />Hoạt động trong tuần</h3>
                      <div className="flex items-end gap-4 h-40">
                        {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((day, i) => {
                          const heights = [60, 80, 45, 90, 70, 30, 50]; // mock
                          const isToday = new Date().getDay() === (i === 6 ? 0 : i + 1);
                          return (
                            <div key={day} className="flex-1 flex flex-col items-center gap-2">
                              <div className="w-full rounded-t-md transition-all relative group" style={{ height: `${heights[i]}%`, background: isToday ? 'var(--primary)' : 'var(--muted-foreground)', opacity: isToday ? 1 : 0.2 }}>
                                 <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                    {heights[i]}p
                                 </div>
                              </div>
                              <span className={`text-xs font-bold ${isToday ? 'text-primary' : 'text-foreground-muted'}`}>{day}</span>
                            </div>
                          );
                        })}
                      </div>
                   </div>
                </div>

                <div className="space-y-6">
                   <div className="border border-border rounded-xl p-6 bg-[var(--card)] shadow-sm">
                      <div className="flex justify-between items-center mb-4">
                         <h3 className="font-bold text-lg">Huy hiệu đạt được</h3>
                         <Link href="/achievements" className="text-sm text-primary font-bold hover:underline">Xem tất cả</Link>
                      </div>
                      <div className="grid grid-cols-4 gap-3">
                         {achievements.filter(a => a.earned).slice(0, 8).map((badge, i) => (
                           <div key={i} className="aspect-square rounded-xl border border-yellow-500/30 bg-yellow-500/10 flex items-center justify-center text-2xl relative group cursor-pointer" title={badge.name}>
                              {badge.icon || "🏆"}
                              <div className="absolute bottom-[-10px] right-[-5px] bg-white rounded-full">
                                 <CheckCircle2 className="w-4 h-4 text-green-500" />
                              </div>
                           </div>
                         ))}
                         {achievements.filter(a => a.earned).length === 0 && (
                            <p className="col-span-4 text-sm text-foreground-muted text-center py-4">Học tập chăm chỉ để nhận huy hiệu đầu tiên nhé!</p>
                         )}
                      </div>
                   </div>

                   <div className="border border-border rounded-xl p-6 bg-[var(--card)] shadow-sm">
                      <h3 className="font-bold text-lg mb-4">Lịch sử hoạt động</h3>
                      {dashboard.activities.length === 0 ? (
                         <p className="text-sm text-foreground-muted">Chưa có hoạt động nào.</p>
                      ) : (
                         <div className="space-y-4">
                            {dashboard.activities.slice(0, 5).map((act, i) => (
                               <div key={i} className="flex gap-3">
                                  <div className="mt-1 w-2 h-2 rounded-full bg-primary shrink-0" />
                                  <div>
                                     <p className="text-sm font-medium leading-tight">{act.text}</p>
                                     <p className="text-xs text-foreground-muted mt-1">{act.time}</p>
                                  </div>
                               </div>
                            ))}
                         </div>
                      )}
                   </div>
                </div>
             </div>
           )}

           {/* TAB: REQUESTS */}
           {activeTab === "requests" && (
             <div className="max-w-2xl mx-auto space-y-6">
                
                {pendingCourses.length > 0 && (
                  <div className="border border-border rounded-xl p-6 bg-[var(--card)] shadow-sm">
                     <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-yellow-500"/> Khóa học chờ duyệt thanh toán</h3>
                     <div className="space-y-4">
                        {pendingCourses.map(course => (
                           <div key={course.id} className="flex items-center gap-4 p-4 border border-border rounded-xl">
                              <div className="aspect-video w-24 bg-muted rounded shrink-0 border border-border" />
                              <div className="flex-1">
                                 <h4 className="font-bold text-sm mb-1">{course.course?.title}</h4>
                                 <span className="text-xs px-2 py-1 bg-yellow-500/10 text-yellow-500 font-bold rounded-full">Chờ phụ huynh thanh toán</span>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
                )}

                {parentRequests.length > 0 && (
                  <div className="border border-border rounded-xl p-6 bg-[var(--card)] shadow-sm">
                     <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                       <AlertCircle className="w-5 h-5 text-[#3b82f6]"/>
                       Yêu cầu liên kết phụ huynh
                       <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-bold bg-[#3b82f6] text-white">{parentRequests.length}</span>
                     </h3>
                     <div className="space-y-3">
                        {parentRequests.map(req => (
                           <div key={req.id} className="flex items-center justify-between gap-4 p-4 border border-border rounded-xl bg-[var(--background-2)]">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-[#3b82f6] flex items-center justify-center text-white font-bold text-sm">
                                  {(req.parent?.firstName || req.parent?.username || "P").charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <h4 className="font-bold text-sm">{req.parent?.firstName ? `${req.parent.firstName} ${req.parent.lastName || ""}`.trim() : req.parent?.username}</h4>
                                  <p className="text-xs text-foreground-muted">{req.parent?.email} · Muốn theo dõi học tập của bạn</p>
                                </div>
                              </div>
                              <div className="flex gap-2 flex-shrink-0">
                                 <button
                                   onClick={() => acceptParentLink(req.id)}
                                   className="px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-bold rounded-lg transition-colors hover:bg-[var(--primary-hover)]"
                                 >✓ Chấp nhận</button>
                                 <button
                                   onClick={() => rejectParentLink(req.id)}
                                   className="px-4 py-2 border border-border text-foreground-muted text-xs font-bold rounded-lg hover:bg-muted hover:text-foreground transition-colors"
                                 >✕ Từ chối</button>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
                )}
             </div>
           )}

        </div>
      </section>

      <Footer />
    </div>
  );
}
