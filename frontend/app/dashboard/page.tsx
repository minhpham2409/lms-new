"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/components/auth/auth-state";
import {
  ChevronRight, Loader2, Gift, PlayCircle, Clock, CheckCircle2, Award, AlertCircle
} from "lucide-react";
import { toast } from "sonner";

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
  const [activeTab, setActiveTab] = useState<"courses" | "stats" | "requests">("courses");

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

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--background)" }}>
      <Navbar />

      {/* ===== UDEMY STYLE HEADER ===== */}
      <section className="bg-[#1c1d1f] text-white pt-28 pb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <h1 className="text-3xl sm:text-4xl font-bold mb-8">Học tập của tôi</h1>
           
           <div className="flex flex-wrap gap-6 border-b border-gray-700">
             <button onClick={() => setActiveTab("courses")} className={`pb-3 font-bold text-sm border-b-4 transition-colors whitespace-nowrap ${activeTab === "courses" ? "border-white text-white" : "border-transparent text-gray-400 hover:text-white"}`}>
                Tất cả khóa học
             </button>
             <button onClick={() => setActiveTab("stats")} className={`pb-3 font-bold text-sm border-b-4 transition-colors whitespace-nowrap ${activeTab === "stats" ? "border-white text-white" : "border-transparent text-gray-400 hover:text-white"}`}>
                Thống kê & Thành tích
             </button>
             {(parentRequests.length > 0 || pendingCourses.length > 0) && (
               <button onClick={() => setActiveTab("requests")} className={`pb-3 font-bold text-sm border-b-4 transition-colors whitespace-nowrap ${activeTab === "requests" ? "border-white text-white" : "border-transparent text-gray-400 hover:text-white"}`}>
                  Chờ xử lý ({parentRequests.length + pendingCourses.length})
               </button>
             )}
           </div>
        </div>
      </section>

      {/* ===== MAIN CONTENT ===== */}
      <section className="flex-1 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           
           {/* TAB: COURSES */}
           {activeTab === "courses" && (
             <div>
                {coursesLoading ? (
                  <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                ) : activeCourses.length === 0 ? (
                  <div className="text-center py-20 border border-border rounded-lg bg-card shadow-sm">
                     <h3 className="text-2xl font-bold mb-4">Bạn chưa đăng ký khóa học nào</h3>
                     <Link href="/courses" className="btn-primary px-6 py-3">Khám phá khóa học ngay</Link>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                     {activeCourses.map(enrollment => {
                        const totalLessons = enrollment.course?.sections?.reduce((sum: number, sec: any) => sum + (sec.lessons?.length || 0), 0) || enrollment.course?._count?.lessons || 0;
                        const authorName = enrollment.course?.author?.firstName || enrollment.course?.author?.username || "Giáo viên";
                        const isCompleted = enrollment.progress >= 100;
                        return (
                           <Link key={enrollment.id} href={`/courses/${enrollment.courseId}`} className="group">
                              <div className="border border-border rounded-lg overflow-hidden h-full flex flex-col bg-card hover:shadow-lg transition-all hover:-translate-y-1">
                                 <div className="aspect-video bg-muted relative border-b border-border">
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/30 transition-colors">
                                       <PlayCircle className="w-12 h-12 text-white/80 group-hover:scale-110 transition-transform" />
                                    </div>
                                 </div>
                                 <div className="p-4 flex-1 flex flex-col">
                                    <h3 className="font-bold mb-1 line-clamp-2 leading-tight group-hover:text-primary transition-colors">{enrollment.course?.title}</h3>
                                    <p className="text-xs text-foreground-muted mb-4">{authorName}</p>
                                    
                                    <div className="mt-auto">
                                       <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden mb-2">
                                          <div className={`h-full ${isCompleted ? 'bg-green-500' : 'bg-primary'}`} style={{ width: `${enrollment.progress}%`}} />
                                       </div>
                                       <div className="flex justify-between text-xs font-bold">
                                          <span className="text-foreground-muted">{Math.round(enrollment.progress)}% hoàn thành</span>
                                          {isCompleted && <span className="text-green-500 flex items-center gap-1"><Award className="w-3 h-3"/> Đã hoàn thành</span>}
                                       </div>
                                    </div>
                                 </div>
                              </div>
                           </Link>
                        )
                     })}
                  </div>
                )}
             </div>
           )}

           {/* TAB: STATS & ACHIEVEMENTS */}
           {activeTab === "stats" && (
             <div className="grid lg:grid-cols-3 gap-8">
                {/* Left col - Stats */}
                <div className="lg:col-span-2 space-y-6">
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="border border-border rounded-lg p-6 bg-card text-center shadow-sm">
                         <p className="text-3xl font-extrabold text-primary mb-1">{activeCourses.length}</p>
                         <p className="text-sm text-foreground-muted font-bold">Đang học</p>
                      </div>
                      <div className="border border-border rounded-lg p-6 bg-card text-center shadow-sm">
                         <p className="text-3xl font-extrabold text-green-500 mb-1">{activeCourses.filter(c => c.progress >= 100).length}</p>
                         <p className="text-sm text-foreground-muted font-bold">Hoàn thành</p>
                      </div>
                      <div className="border border-border rounded-lg p-6 bg-card text-center shadow-sm">
                         <p className="text-3xl font-extrabold text-yellow-500 mb-1">{dashboard.streak}</p>
                         <p className="text-sm text-foreground-muted font-bold">Ngày liên tiếp</p>
                      </div>
                      <div className="border border-border rounded-lg p-6 bg-card text-center shadow-sm">
                         <p className="text-3xl font-extrabold text-cyan-500 mb-1">{achievements.filter(a => a.earned).length}</p>
                         <p className="text-sm text-foreground-muted font-bold">Huy hiệu</p>
                      </div>
                   </div>

                   {/* Weekly Activity */}
                   <div className="border border-border rounded-lg p-6 bg-card shadow-sm">
                      <h3 className="font-bold text-lg mb-6">Hoạt động trong tuần</h3>
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

                {/* Right col - Badges */}
                <div className="space-y-6">
                   <div className="border border-border rounded-lg p-6 bg-card shadow-sm">
                      <div className="flex justify-between items-center mb-4">
                         <h3 className="font-bold text-lg">Huy hiệu đạt được</h3>
                         <Link href="/achievements" className="text-sm text-primary font-bold hover:underline">Xem tất cả</Link>
                      </div>
                      <div className="grid grid-cols-4 gap-3">
                         {achievements.filter(a => a.earned).slice(0, 8).map((badge, i) => (
                           <div key={i} className="aspect-square rounded-full border border-yellow-500/30 bg-yellow-500/10 flex items-center justify-center text-2xl relative group cursor-pointer" title={badge.name}>
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

                   <div className="border border-border rounded-lg p-6 bg-card shadow-sm">
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
                  <div className="border border-border rounded-lg p-6 bg-card shadow-sm">
                     <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-yellow-500"/> Khóa học chờ duyệt thanh toán</h3>
                     <div className="space-y-4">
                        {pendingCourses.map(course => (
                           <div key={course.id} className="flex items-center gap-4 p-4 border border-border rounded-lg">
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
                  <div className="border border-[#d1d7dc] dark:border-[#3e4143] rounded p-6 bg-white dark:bg-[#2d2f31]">
                     <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                       <AlertCircle className="w-5 h-5 text-[#3b82f6]"/>
                       Yêu cầu liên kết phụ huynh
                       <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-bold bg-[#3b82f6] text-white">{parentRequests.length}</span>
                     </h3>
                     <div className="space-y-3">
                        {parentRequests.map(req => (
                           <div key={req.id} className="flex items-center justify-between p-4 border border-[#d1d7dc] dark:border-[#3e4143] rounded bg-[#f7f9fa] dark:bg-[#1c1d1f]">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-[#3b82f6] flex items-center justify-center text-white font-bold text-sm">
                                  {(req.parent?.firstName || req.parent?.username || "P").charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <h4 className="font-bold text-sm text-[#2d2f31] dark:text-white">{req.parent?.firstName ? `${req.parent.firstName} ${req.parent.lastName || ""}`.trim() : req.parent?.username}</h4>
                                  <p className="text-xs text-[#6a6f73]">{req.parent?.email} · Muốn theo dõi học tập của bạn</p>
                                </div>
                              </div>
                              <div className="flex gap-2 flex-shrink-0">
                                 <button
                                   onClick={() => acceptParentLink(req.id)}
                                   className="px-4 py-2 bg-[#a435f0] hover:bg-[#8710d8] text-white text-xs font-bold rounded transition-colors"
                                 >✓ Chấp nhận</button>
                                 <button
                                   onClick={() => rejectParentLink(req.id)}
                                   className="px-4 py-2 border border-[#d1d7dc] dark:border-[#6a6f73] text-[#6a6f73] text-xs font-bold rounded hover:bg-[#fee2e2] hover:text-[#ef4444] hover:border-[#ef4444] transition-colors"
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
