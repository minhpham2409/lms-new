"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/components/auth/auth-state";
import { toast } from "sonner";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend
} from "recharts";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

type Tab = "overview" | "courses" | "students" | "analytics" | "wallet" | "settings";

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
  const [wallet, setWallet] = useState<any>(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [bankSaving, setBankSaving] = useState(false);
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [myPayouts, setMyPayouts] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      fetchMyCourses();
      fetchStats();
      fetchPendingStudents();
      fetchPendingSubmissions();
      fetchWallet();
      fetchBankInfo();
      fetchMyPayouts();
    }
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
            pending.forEach((e: any) => allPending.push({ ...e, courseTitle: course.title, courseId: course.id, coursePrice: Number(course.price || 0) }));
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

  async function fetchWallet() {
    setWalletLoading(true);
    try {
      const res = await fetch(`${API}/wallets/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setWallet(await res.json());
    } catch {} finally { setWalletLoading(false); }
  }

  async function fetchBankInfo() {
    try {
      const res = await fetch(`${API}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const profile = await res.json();
        if (profile.bankName) setBankName(profile.bankName);
        if (profile.bankAccount) setBankAccount(profile.bankAccount);
        if (profile.bankOwner) setBankOwner(profile.bankOwner);
      }
    } catch {}
  }

  async function saveBankInfo() {
    if (!bankName || !bankAccount || !bankOwner) {
      toast.error("Vui lòng nhập đủ thông tin ngân hàng");
      return;
    }
    setBankSaving(true);
    try {
      const res = await fetch(`${API}/wallets/bank-info`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ bankName, bankAccount, bankOwner }),
      });
      if (res.ok) {
        toast.success("Đã cập nhật tài khoản nhận tiền");
      } else {
        const d = await res.json().catch(() => ({}));
        toast.error(d.message || "Không thể cập nhật tài khoản ngân hàng");
      }
    } catch { toast.error("Lỗi kết nối"); }
    finally { setBankSaving(false); }
  }

  async function requestPayout() {
    const amount = Number(payoutAmount);
    if (!amount || amount <= 0) {
      toast.error("Số tiền rút không hợp lệ");
      return;
    }
    setPayoutLoading(true);
    try {
      const res = await fetch(`${API}/wallets/payouts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount }),
      });
      if (res.ok) {
        setPayoutAmount("");
        toast.success("Đã gửi yêu cầu rút tiền");
        fetchWallet();
      } else {
        const d = await res.json().catch(() => ({}));
        toast.error(d.message || "Không thể tạo yêu cầu rút tiền");
      }
    } catch { toast.error("Lỗi kết nối"); }
    finally { setPayoutLoading(false); }
  }

  async function fetchMyPayouts() {
    try {
      const res = await fetch(`${API}/wallets/payouts/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMyPayouts(Array.isArray(data) ? data : []);
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
      <div className="min-h-screen flex items-center justify-center bg-[#051025]">
        <div className="text-[#F8B486] font-bold text-xl animate-pulse">ĐANG TẢI...</div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; badge?: number }[] = [
    { id: "overview", label: "TỔNG QUAN" },
    { id: "courses", label: "QUẢN LÝ KHÓA HỌC" },
    { id: "students", label: "DUYỆT HỌC SINH", badge: pendingStudents.length },
    { id: "analytics", label: "PHÂN TÍCH CHI TIẾT" },
    { id: "wallet", label: "VÍ DOANH THU" },
    { id: "settings", label: "CÀI ĐẶT THANH TOÁN" },
  ];

  const money = (value: any) => `${Number(value || 0).toLocaleString("vi-VN")} ₫`;
  const courseBreakdown = stats?.courseBreakdown || [];
  const selectedCourse = courseBreakdown.find((course: any) => course.id === selectedCourseId) || courseBreakdown[0] || null;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#121E36] p-4 rounded-xl border border-white/5 shadow-2xl">
          <p className="text-xs font-bold text-[#F8FAFC] mb-2 uppercase tracking-wider">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-6 text-sm">
              <span style={{ color: entry.color }} className="font-semibold">{entry.name}:</span>
              <span className="font-bold text-[#F8FAFC]">
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
    <div className="min-h-screen flex flex-col bg-[#051025] text-[#F8FAFC]">
      <Navbar />
      
      {/* Header Banner */}
      <div className="pt-24 pb-12 relative border-b border-white/5">
        <div className="absolute inset-0 bg-[#0A1A35] opacity-50 overflow-hidden">
          <Image src="/images/hero_star_light.png" alt="Cover" fill className="object-cover opacity-30" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-[#121E36] border-2 border-white/5 flex items-center justify-center text-4xl font-extrabold text-[#F8B486]">
                {(user?.firstName || user?.username || "?").charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#F8B486] bg-[#F8B486]/10 px-3 py-1 rounded">
                    TÀI KHOẢN GIÁO VIÊN
                  </span>
                  {stats?.avgRating >= 4.5 && (
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#FFCCAA] bg-[#FFCCAA]/10 px-3 py-1 rounded">
                      TOP RATED
                    </span>
                  )}
                </div>
                <h1 className="text-3xl font-extrabold text-[#F8FAFC] tracking-tight">
                  CHÀO MỪNG TRỞ LẠI, <span className="text-[#F8B486]">{user?.firstName || user?.username || "GIÁO VIÊN"}</span>
                </h1>
                <p className="text-sm mt-2 font-medium text-[#94A3B8]">
                  {new Date().toLocaleDateString("vi-VN", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/teacher/tax-reports" className="bg-[#121E36] text-[#F8FAFC] border border-white/5 px-6 py-3 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-white/5 transition-colors">
                📊 BÁO CÁO THUẾ
              </Link>
              <Link href="/teacher/grades" className="bg-[#121E36] text-[#F8FAFC] border border-white/5 px-6 py-3 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-white/5 transition-colors relative">
                CHẤM BÀI TẬP
                {pendingSubmissionCount > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full text-[10px] flex items-center justify-center bg-[#F8B486] text-[#051025] animate-pulse">
                    {pendingSubmissionCount}
                  </span>
                )}
              </Link>
              <Link href="/teacher/courses/new" className="bg-[#F8B486] text-[#051025] px-6 py-3 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-[#FFCCAA] transition-colors">
                TẠO KHÓA HỌC MỚI
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-10 pb-4 border-b border-white/5">
            {tabs.map((t) => {
              const isActive = tab === t.id;
              return (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-300 relative
                    ${isActive ? 'text-[#F8B486]' : 'text-[#94A3B8] hover:text-[#F8FAFC]'}`}>
                  {t.label}
                  {t.badge ? <span className="px-2 py-0.5 rounded text-[10px] bg-[#F8B486] text-[#051025]">{t.badge}</span> : null}
                  {isActive && <div className="absolute -bottom-[17px] left-0 right-0 h-[2px] bg-[#F8B486]" />}
                </button>
              );
            })}
          </div>

          {/* Content Area */}
          <div className="animate-fade-in">
            {tab === "overview" && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {[
                    { label: "KHÓA HỌC", value: String(stats?.totalCourses || myCourses.length), sub: `${stats?.publishedCourses || 0} ĐÃ XUẤT BẢN` },
                    { label: "HỌC SINH TÍCH LŨY", value: String(stats?.totalStudents || 0), sub: "TỔNG SỐ HỌC VIÊN" },
                    { label: "DOANH THU", value: money(stats?.teacherRevenue ?? stats?.totalRevenue), sub: "KHỚP VÍ DOANH THU" },
                    { label: "ĐÁNH GIÁ TRUNG BÌNH", value: stats?.avgRating ? stats.avgRating : "—", sub: stats?.totalReviews ? `${stats.totalReviews} LƯỢT ĐÁNH GIÁ` : "CHƯA CÓ ĐÁNH GIÁ" },
                  ].map(({ label, value, sub }) => (
                    <div key={label} className="bg-[#121E36] border border-white/5 p-6 rounded-xl hover:border-white/10 transition-colors">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] mb-2">{label}</p>
                      <p className="text-3xl font-extrabold text-[#F8B486] mb-1">{value}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] opacity-60">{sub}</p>
                    </div>
                  ))}
                </div>

                <div className="grid lg:grid-cols-[1.25fr_0.75fr] gap-6">
                  <div className="bg-[#121E36] border border-white/5 rounded-xl overflow-hidden">
                    <div className="p-6 border-b border-white/5 flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-base uppercase tracking-wider text-[#F8FAFC]">HỌC SINH THEO KHÓA</h3>
                        <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest mt-1">BẤM VÀO MỘT KHÓA ĐỂ XEM HỌC SINH</p>
                      </div>
                      <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">{courseBreakdown.length} KHÓA</span>
                    </div>
                    {courseBreakdown.length === 0 ? (
                      <div className="p-10 text-center text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">CHƯA CÓ DỮ LIỆU</div>
                    ) : (
                      <div className="divide-y divide-white/5">
                        {courseBreakdown.map((course: any) => {
                          const active = selectedCourse?.id === course.id;
                          return (
                            <button key={course.id} onClick={() => setSelectedCourseId(course.id)}
                              className={`w-full text-left p-5 transition-colors ${active ? "bg-[#F8B486]/10" : "hover:bg-white/[0.03]"}`}>
                              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                <div className="min-w-0">
                                  <p className="font-bold text-[#F8FAFC] truncate">{course.title}</p>
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    <span className="rounded bg-[#051025] px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">{course.status === "published" ? "Xuất bản" : "Nháp"}</span>
                                    <span className="rounded bg-[#051025] px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">{course.price > 0 ? money(course.price) : "Miễn phí"}</span>
                                  </div>
                                </div>
                                <div className="grid grid-cols-3 gap-3 text-right md:min-w-[300px]">
                                  <div>
                                    <p className="text-lg font-extrabold text-[#F8FAFC]">{course.studentCount}</p>
                                    <p className="text-[9px] font-bold uppercase tracking-wider text-[#94A3B8]">Học sinh</p>
                                  </div>
                                  <div>
                                    <p className="text-lg font-extrabold text-[#F8FAFC]">{course.paidStudents}</p>
                                    <p className="text-[9px] font-bold uppercase tracking-wider text-[#94A3B8]">Đã mua</p>
                                  </div>
                                  <div>
                                    <p className="text-lg font-extrabold text-[#F8B486]">{money(course.teacherRevenue ?? course.revenue)}</p>
                                    <p className="text-[9px] font-bold uppercase tracking-wider text-[#94A3B8]">Thực nhận</p>
                                  </div>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="bg-[#121E36] border border-white/5 rounded-xl overflow-hidden">
                    <div className="p-6 border-b border-white/5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">DANH SÁCH HỌC SINH</p>
                      <h3 className="mt-2 font-bold text-[#F8FAFC] line-clamp-2">{selectedCourse?.title || "Chọn khóa học"}</h3>
                    </div>
                    {!selectedCourse ? (
                      <div className="p-8 text-sm text-[#94A3B8]">Chọn một khóa học để xem học sinh.</div>
                    ) : selectedCourse.students.length === 0 ? (
                      <div className="p-8 text-sm text-[#94A3B8]">Khóa học này chưa có học sinh.</div>
                    ) : (
                      <div className="max-h-[420px] overflow-y-auto divide-y divide-white/5">
                        {selectedCourse.students.map((student: any) => {
                          const name = student.user?.firstName ? `${student.user.firstName} ${student.user.lastName || ""}`.trim() : student.user?.username || "Học sinh";
                          return (
                            <div key={student.enrollmentId} className="p-4 flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-[#051025] border border-white/5 flex items-center justify-center text-sm font-extrabold text-[#F8B486]">
                                {name.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-[#F8FAFC] truncate">{name}</p>
                                <p className="text-[10px] text-[#94A3B8] truncate">{student.user?.email || student.user?.username}</p>
                              </div>
                              <span className="rounded bg-[#051025] px-2 py-1 text-[10px] font-bold uppercase text-[#94A3B8]">{student.status}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                  {/* Recent Activity / Courses */}
                  <div className="lg:col-span-2 bg-[#121E36] border border-white/5 rounded-xl p-8">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="font-bold text-base uppercase tracking-wider text-[#F8FAFC]">
                        KHÓA HỌC GẦN ĐÂY
                      </h3>
                      <button onClick={() => setTab("courses")} className="text-[10px] font-bold uppercase tracking-wider text-[#F8B486] hover:text-[#FFCCAA]">
                        XEM TẤT CẢ →
                      </button>
                    </div>
                    
                    {myCourses.length === 0 ? (
                      <div className="text-center py-16">
                        <div className="text-3xl mb-4 text-[#F8B486]/30">[]</div>
                        <p className="text-sm font-bold uppercase tracking-wider text-[#F8FAFC]">CHƯA CÓ KHÓA HỌC</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {myCourses.slice(0, 4).map((c: any) => (
                          <div key={c.id} className="group flex items-center justify-between p-4 bg-[#051025] rounded-lg border border-white/5 hover:border-[#F8B486]/50 transition-colors cursor-pointer"
                            onClick={() => router.push(`/teacher/courses/${c.id}`)}>
                            <div className="flex items-center gap-5">
                              <div>
                                <p className="text-sm font-bold text-[#F8FAFC] group-hover:text-[#F8B486] transition-colors">{c.title}</p>
                                <div className="flex items-center gap-4 mt-2">
                                  <p className="text-[10px] font-bold tracking-wider text-[#94A3B8]">
                                    {c._count?.enrollments || 0} HỌC VIÊN
                                  </p>
                                  <p className="text-[10px] font-bold tracking-wider text-[#94A3B8]">
                                    {c.price > 0 ? `${c.price.toLocaleString()}Đ` : "MIỄN PHÍ"}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-[#F8B486] bg-[#F8B486]/10 px-3 py-1 rounded">
                              {c.status === "published" ? "XUẤT BẢN" : "NHÁP"}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-[#121E36] border border-white/5 rounded-xl p-8">
                    <h3 className="font-bold text-base uppercase tracking-wider text-[#F8FAFC] mb-8">
                      THAO TÁC NHANH
                    </h3>
                    <div className="space-y-4">
                      <Link href="/teacher/courses/new" className="block p-5 bg-[#051025] rounded-lg border border-white/5 hover:border-[#F8B486]/50 transition-colors group">
                        <p className="text-xs font-bold text-[#F8FAFC] group-hover:text-[#F8B486] mb-1">TẠO KHÓA HỌC MỚI</p>
                        <p className="text-[10px] font-bold tracking-wider text-[#94A3B8]">THÊM BÀI HỌC VÀ NỘI DUNG</p>
                      </Link>
                      
                      <button onClick={() => setTab("students")} className="w-full text-left p-5 bg-[#051025] rounded-lg border border-white/5 hover:border-[#F8B486]/50 transition-colors group relative">
                        <p className="text-xs font-bold text-[#F8FAFC] group-hover:text-[#F8B486] mb-1">DUYỆT HỌC SINH</p>
                        <p className="text-[10px] font-bold tracking-wider text-[#94A3B8]">XÁC NHẬN THANH TOÁN CHỜ DUYỆT</p>
                        {pendingStudents.length > 0 && (
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 bg-[#F8B486] rounded-full flex items-center justify-center text-xs font-bold text-[#051025] animate-pulse">
                            {pendingStudents.length}
                          </div>
                        )}
                      </button>

                      <div className="mt-8 pt-6 border-t border-white/5">
                        <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-4">HỌC VIÊN MỚI NHẤT</p>
                        <div className="space-y-4">
                          {stats?.recentEnrollments?.length > 0 ? (
                            stats.recentEnrollments.slice(0, 3).map((e: any, idx: number) => (
                              <div key={idx} className="flex items-center gap-4">
                                <div className="w-8 h-8 bg-[#121E36] flex items-center justify-center text-[10px] font-bold text-[#F8B486] border border-white/5">
                                  {(e.user?.username || "?").charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p className="text-[11px] font-bold text-[#F8FAFC]">{e.user?.username}</p>
                                  <p className="text-[9px] font-bold tracking-wider text-[#94A3B8] truncate max-w-[150px]">{e.course?.title}</p>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-[10px] font-bold text-[#94A3B8] uppercase">CHƯA CÓ HỌC VIÊN</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {tab === "courses" && (
              <div className="bg-[#121E36] border border-white/5 rounded-xl overflow-hidden">
                <div className="p-8 border-b border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-lg uppercase tracking-wider text-[#F8FAFC]">TẤT CẢ KHÓA HỌC</h3>
                    <p className="text-[10px] font-bold text-[#94A3B8] tracking-widest mt-1">QUẢN LÝ VÀ CHỈNH SỬA</p>
                  </div>
                  <Link href="/teacher/courses/new" className="bg-[#F8B486] text-[#051025] px-6 py-3 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-[#FFCCAA] transition-colors">
                    THÊM KHÓA HỌC
                  </Link>
                </div>
                
                {coursesLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="text-[#F8B486] font-bold text-sm animate-pulse uppercase">ĐANG TẢI...</div>
                  </div>
                ) : myCourses.length === 0 ? (
                  <div className="text-center py-24">
                    <div className="text-4xl mb-4 text-[#F8B486]/30">[]</div>
                    <h3 className="text-sm font-bold uppercase text-[#F8FAFC] mb-2">CHƯA CÓ KHÓA HỌC NÀO</h3>
                    <Link href="/teacher/courses/new" className="text-xs font-bold text-[#F8B486] uppercase tracking-wider hover:text-[#FFCCAA]">
                      BẮT ĐẦU TẠO KHÓA HỌC →
                    </Link>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-[#051025]">
                        <tr>
                          <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">KHÓA HỌC</th>
                          <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">TRẠNG THÁI</th>
                          <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">HỌC VIÊN</th>
                          <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">GIÁ BÁN</th>
                          <th className="px-8 py-5 text-right text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">THAO TÁC</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {myCourses.map((c: any) => (
                          <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="px-8 py-6">
                              <p className="text-sm font-bold text-[#F8FAFC]">{c.title}</p>
                              <p className="text-[10px] font-bold tracking-wider text-[#94A3B8] mt-1">{c.sections?.length || 0} CHƯƠNG</p>
                            </td>
                            <td className="px-8 py-6">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-[#F8B486] bg-[#F8B486]/10 px-3 py-1 rounded">
                                {c.status === "published" ? "XUẤT BẢN" : "NHÁP"}
                              </span>
                            </td>
                            <td className="px-8 py-6">
                              <p className="text-sm font-bold text-[#F8FAFC]">{c._count?.enrollments || 0}</p>
                            </td>
                            <td className="px-8 py-6">
                              <p className="text-sm font-bold text-[#F8B486]">
                                {c.price > 0 ? `${c.price.toLocaleString()} Đ` : "MIỄN PHÍ"}
                              </p>
                            </td>
                            <td className="px-8 py-6 text-right space-x-4">
                              <Link href={`/teacher/courses/${c.id}`} className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] hover:text-[#F8FAFC]">
                                SỬA
                              </Link>
                              <button onClick={() => window.open(`/courses/${c.id}`, '_blank')} className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] hover:text-[#F8FAFC]">
                                XEM
                              </button>
                              {c.status === "draft" && (
                                <>
                                  <button onClick={() => submitForReview(c.id)} className="text-[10px] font-bold uppercase tracking-wider text-[#F8B486] hover:text-[#FFCCAA]">
                                    GỬI DUYỆT
                                  </button>
                                  <button onClick={() => deleteCourse(c.id)} className="text-[10px] font-bold uppercase tracking-wider text-red-400 hover:text-red-300">
                                    XÓA
                                  </button>
                                </>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {tab === "analytics" && (
              <div className="space-y-6">
                <div className="grid lg:grid-cols-2 gap-6">
                  <div className="bg-[#121E36] border border-white/5 rounded-xl p-8">
                    <h3 className="font-bold text-base uppercase tracking-wider text-[#F8FAFC] mb-8">
                      DOANH THU THỰC NHẬN 6 THÁNG QUA
                    </h3>
                    {stats?.monthlyData && stats.monthlyData.length > 0 ? (
                      <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={stats.monthlyData}>
                            <defs>
                              <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#F8B486" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#051025" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis dataKey="month" stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `${val/1000}K`} />
                            <RechartsTooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                            <Line type="monotone" name="Doanh thu thực nhận" dataKey="revenue" stroke="#F8B486" strokeWidth={3} dot={{ r: 4, fill: "#F8B486", strokeWidth: 0 }} activeDot={{ r: 6 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="h-72 flex items-center justify-center text-[10px] font-bold tracking-widest text-[#94A3B8] uppercase">KHÔNG CÓ DỮ LIỆU</div>
                    )}
                  </div>

                  <div className="bg-[#121E36] border border-white/5 rounded-xl p-8">
                    <h3 className="font-bold text-base uppercase tracking-wider text-[#F8FAFC] mb-8">
                      HỌC SINH MỚI
                    </h3>
                    {stats?.monthlyData && stats.monthlyData.length > 0 ? (
                      <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={stats.monthlyData}>
                            <defs>
                              <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#F8FAFC" stopOpacity={0.8}/>
                                <stop offset="100%" stopColor="#F8FAFC" stopOpacity={0.1}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis dataKey="month" stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                            <RechartsTooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                            <Bar dataKey="enrollments" name="Học sinh mới" fill="url(#colorStudents)" radius={[2, 2, 0, 0]} barSize={20} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="h-72 flex items-center justify-center text-[10px] font-bold tracking-widest text-[#94A3B8] uppercase">KHÔNG CÓ DỮ LIỆU</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {tab === "students" && (
              <div className="bg-[#121E36] border border-white/5 rounded-xl overflow-hidden">
                <div className="p-8 border-b border-white/5">
                  <h3 className="font-bold text-lg uppercase tracking-wider text-[#F8FAFC]">XÁC NHẬN & DUYỆT HỌC SINH</h3>
                  <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest mt-2">
                    TRẢ PHÍ: DUYỆT TỰ ĐỘNG QUA WEBHOOK — MIỄN PHÍ: DUYỆT THỦ CÔNG BÊN DƯỚI
                  </p>
                </div>
                
                {pendingLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="text-[#F8B486] font-bold text-sm animate-pulse uppercase">ĐANG TẢI...</div>
                  </div>
                ) : pendingStudents.length === 0 ? (
                  <div className="text-center py-24">
                    <div className="text-sm font-bold uppercase tracking-wider text-[#F8FAFC]">KHÔNG CÓ YÊU CẦU DUYỆT NÀO</div>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {pendingStudents.map((s: any) => (
                      <div key={s.id} className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-white/[0.02] transition-colors">
                        <div className="flex items-center gap-6">
                          <div className="w-12 h-12 bg-[#051025] flex items-center justify-center text-lg font-bold text-[#F8B486] border border-white/5">
                            {(s.user?.firstName || s.user?.username || "?").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-[#F8FAFC]">{s.user?.firstName ? `${s.user.firstName} ${s.user.lastName || ""}`.trim() : s.user?.username || "HỌC SINH"}</p>
                            <p className="text-[10px] font-bold tracking-wider text-[#94A3B8] mt-1">
                              {s.user?.email || "CHƯA CÓ EMAIL"} <span className="mx-2">•</span> <span className="text-[#F8FAFC]">{s.courseTitle}</span>
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          {s.coursePrice > 0 ? (
                            <>
                              <span className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] px-3 py-1 rounded border border-white/10">
                                TRẢ PHÍ: {s.coursePrice.toLocaleString()} Đ
                              </span>
                              <span className="text-[10px] font-bold uppercase tracking-widest text-[#F8B486] px-3 py-1 rounded bg-[#F8B486]/10">
                                CHỜ WEBHOOK
                              </span>
                              <button onClick={() => rejectStudent(s.id)} className="text-[10px] font-bold uppercase tracking-widest text-red-400 hover:text-red-300">
                                HỦY
                              </button>
                            </>
                          ) : (
                            <>
                              <span className="text-[10px] font-bold uppercase tracking-widest text-[#F8FAFC] px-3 py-1 rounded border border-white/10">
                                MIỄN PHÍ
                              </span>
                              <button onClick={() => approveStudent(s.id)} className="bg-[#F8B486] text-[#051025] px-4 py-2 rounded text-[10px] font-bold uppercase tracking-widest hover:bg-[#FFCCAA]">
                                DUYỆT NGAY
                              </button>
                              <button onClick={() => rejectStudent(s.id)} className="text-[10px] font-bold uppercase tracking-widest text-red-400 hover:text-red-300">
                                TỪ CHỐI
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === "wallet" && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-3 gap-6">
                  {[
                    { label: "SỐ DƯ CÓ THỂ RÚT", value: money(wallet?.balance) },
                    { label: "ĐANG CHỜ DUYỆT RÚT", value: money(wallet?.pendingBalance) },
                    { label: "TỔNG ĐÃ KIẾM", value: money(wallet?.totalEarned) },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-[#121E36] border border-white/5 rounded-xl p-8 hover:border-white/10 transition-colors">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] mb-3">{label}</p>
                      <div className="flex items-center justify-between">
                        <p className="text-3xl font-extrabold text-[#F8B486]">{value}</p>
                        {walletLoading && <div className="text-[10px] font-bold text-[#F8B486] animate-pulse">ĐANG TẢI</div>}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 bg-[#121E36] border border-white/5 rounded-xl overflow-hidden">
                    <div className="p-8 border-b border-white/5 flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-lg uppercase tracking-wider text-[#F8FAFC]">LỊCH SỬ VÍ</h3>
                      </div>
                      <button onClick={fetchWallet} disabled={walletLoading} className="text-[10px] font-bold uppercase tracking-widest text-[#F8B486] hover:text-[#FFCCAA]">
                        {walletLoading ? "ĐANG TẢI..." : "LÀM MỚI"}
                      </button>
                    </div>

                    {!wallet?.transactions?.length ? (
                      <div className="text-center py-24">
                        <div className="text-sm font-bold uppercase tracking-wider text-[#F8FAFC]">CHƯA CÓ GIAO DỊCH NÀO</div>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead className="bg-[#051025]">
                            <tr>
                              <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">LOẠI</th>
                              <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">MÔ TẢ</th>
                              <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">NGÀY GIAO DỊCH</th>
                              <th className="px-8 py-5 text-right text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">SỐ TIỀN</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {wallet.transactions.map((tx: any) => {
                              const positive = tx.type === "EARNING" || tx.type === "WITHDRAWAL_REJECTED";
                              return (
                                <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors">
                                  <td className="px-8 py-6">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#F8FAFC]">
                                      {tx.type}
                                    </span>
                                  </td>
                                  <td className="px-8 py-6 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">
                                    {tx.description || tx.referenceId || "GIAO DỊCH"}
                                  </td>
                                  <td className="px-8 py-6 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">
                                    {tx.createdAt ? new Date(tx.createdAt).toLocaleString("vi-VN") : "-"}
                                  </td>
                                  <td className={`px-8 py-6 text-right font-extrabold ${positive ? "text-[#F8B486]" : "text-[#F8FAFC]"}`}>
                                    {positive ? "+" : "-"}{money(tx.amount)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  <div className="space-y-6">
                    <div className="bg-[#121E36] rounded-xl p-8 border border-white/5">
                      <h3 className="font-bold text-base uppercase tracking-wider text-[#F8FAFC] mb-6">YÊU CẦU RÚT TIỀN</h3>
                      <input
                        type="number"
                        min="0"
                        value={payoutAmount}
                        onChange={(e) => setPayoutAmount(e.target.value)}
                        className="w-full bg-[#051025] text-[#F8FAFC] p-4 rounded-lg border border-white/5 outline-none text-sm font-bold uppercase tracking-widest mb-4"
                        placeholder="NHẬP SỐ TIỀN (VNĐ)"
                      />
                      <button onClick={requestPayout} disabled={payoutLoading} className="w-full bg-[#F8B486] text-[#051025] font-bold text-xs uppercase tracking-widest py-4 rounded-lg hover:bg-[#FFCCAA] transition-colors">
                        {payoutLoading ? "ĐANG XỬ LÝ..." : "GỬI YÊU CẦU"}
                      </button>

                      {/* Payout History */}
                      {myPayouts.length > 0 && (
                        <div className="mt-8 pt-6 border-t border-white/5">
                          <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] mb-4">LỊCH SỬ RÚT TIỀN</h4>
                          <div className="space-y-4 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                            {myPayouts.map((p: any) => {
                              const statusLabel = p.status === "PENDING" ? "CHỜ DUYỆT" : p.status === "APPROVED" ? "THÀNH CÔNG" : "TỪ CHỐI";
                              return (
                                <div key={p.id} className="p-4 rounded-lg bg-[#051025] border border-white/5 flex items-center justify-between">
                                  <div>
                                    <p className="text-sm font-bold text-[#F8FAFC]">{Number(p.amount).toLocaleString()} Đ</p>
                                    <p className="text-[9px] font-bold uppercase tracking-widest text-[#94A3B8] mt-1">
                                      {new Date(p.createdAt).toLocaleDateString("vi-VN")}
                                    </p>
                                  </div>
                                  <span className="text-[9px] font-bold uppercase tracking-widest text-[#F8B486]">
                                    {statusLabel}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {tab === "settings" && (
              <div className="bg-[#121E36] rounded-xl p-10 border border-white/5 max-w-4xl mx-auto">
                <h3 className="font-bold text-xl uppercase tracking-wider text-[#F8FAFC] mb-4">
                  CÀI ĐẶT THANH TOÁN QR
                </h3>
                <p className="text-xs font-bold text-[#94A3B8] tracking-wider mb-10 pb-6 border-b border-white/5">
                  HỆ THỐNG TỰ ĐỘNG TẠO MÃ QR TỪ THÔNG TIN NÀY ĐỂ HỌC SINH CHUYỂN KHOẢN.
                </p>
                
                <div className="space-y-8">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] mb-3">NGÂN HÀNG</label>
                      <select value={bankName} onChange={(e) => setBankName(e.target.value)} className="w-full bg-[#051025] text-[#F8FAFC] p-4 rounded-lg border border-white/5 outline-none text-sm font-bold tracking-widest uppercase">
                        <option value="">CHỌN NGÂN HÀNG</option>
                        <option value="VCB">Vietcombank (VCB)</option>
                        <option value="TCB">Techcombank (TCB)</option>
                        <option value="MB">MB Bank</option>
                        <option value="ACB">ACB</option>
                        <option value="VPB">VPBank</option>
                        <option value="BIDV">BIDV</option>
                        <option value="VTB">VietinBank</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] mb-3">SỐ TÀI KHOẢN</label>
                      <input
                        value={bankAccount} onChange={(e) => setBankAccount(e.target.value)}
                        className="w-full bg-[#051025] text-[#F8FAFC] p-4 rounded-lg border border-white/5 outline-none text-sm font-bold tracking-widest" placeholder="VD: 190366666666"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] mb-3">TÊN CHỦ TÀI KHOẢN (IN HOA KHÔNG DẤU)</label>
                    <input
                      value={bankOwner} onChange={(e) => setBankOwner(e.target.value)}
                      className="w-full bg-[#051025] text-[#F8FAFC] p-4 rounded-lg border border-white/5 outline-none text-sm font-bold tracking-widest uppercase" placeholder="VD: NGUYEN VAN MINH"
                    />
                  </div>

                  {bankName && bankAccount && bankOwner && (
                    <div className="mt-8 p-8 rounded-xl border border-white/5 bg-[#051025] flex flex-col items-center">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#F8FAFC] mb-6">XEM TRƯỚC MÃ QR CỦA BẠN</p>
                      <div className="w-48 h-48 bg-white p-3 rounded shadow-lg relative">
                        <Image
                          src={`https://img.vietqr.io/image/${bankName}-${bankAccount}-compact.png?accountName=${encodeURIComponent(bankOwner)}`}
                          alt="QR Code"
                          fill
                          className="object-contain"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      </div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] mt-6">
                        {bankName} • {bankAccount} • {bankOwner}
                      </p>
                    </div>
                  )}

                  <div className="pt-6 flex justify-end">
                    <button onClick={saveBankInfo} disabled={bankSaving} className="bg-[#F8B486] text-[#051025] px-8 py-4 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-[#FFCCAA] transition-colors">
                      {bankSaving ? "ĐANG LƯU..." : "CẬP NHẬT THÔNG TIN"}
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
