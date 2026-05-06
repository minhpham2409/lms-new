"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/components/auth/auth-state";
import { Users, BookOpen, Clock, TrendingUp, Award, BarChart3, Target, Calendar, Star, MessageCircle, Bell, Eye, ChevronDown } from "lucide-react";

const children = [
  {
    id: "c1", name: "Nguyễn Văn B", grade: "Lớp 8", avatar: "B",
    stats: { courses: 3, hours: 24.5, completed: 28, avg: 8.5, streak: 7, rank: 12 },
    courses: [
      { title: "Toán học cơ bản", progress: 68, grade: "8.5", lessons: 24, lastActivity: "2h trước" },
      { title: "Tiếng Anh giao tiếp", progress: 35, grade: "7.0", lessons: 30, lastActivity: "1 ngày" },
      { title: "Ngữ văn — Cảm thụ", progress: 12, grade: "—", lessons: 20, lastActivity: "3 ngày" },
    ],
    recentActivities: [
      { text: "Hoàn thành Bài 16: Phân số", time: "2h trước", icon: "✅" },
      { text: "Đạt 9/10 bài kiểm tra Toán", time: "5h trước", icon: "🎯" },
      { text: "Xem video Tiếng Anh Unit 5", time: "1 ngày", icon: "📖" },
    ],
    weeklyHours: [1.5, 2, 1, 3, 2.5, 0.5, 1],
  },
];

type Tab = "overview" | "courses" | "activity" | "grades";

export default function ParentPage() {
  const router = useRouter();
  const { user, isLoggedIn, loading } = useAuth();
  const [tab, setTab] = useState<Tab>("overview");
  const [selectedChild] = useState(children[0]);

  useEffect(() => {
    if (loading) return;
    if (!isLoggedIn) {
      router.push("/auth/login");
      return;
    }
    if (user?.role !== "parent") {
      if (user?.role === "admin") router.push("/admin");
      else if (user?.role === "teacher") router.push("/teacher");
      else router.push("/dashboard");
    }
  }, [user, isLoggedIn, loading, router]);

  if (loading || !user || user.role !== "parent") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
        <div className="w-8 h-8 border-2 border-[#f59e0b] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "overview", label: "Tổng quan", icon: BarChart3 },
    { id: "courses", label: "Khóa học", icon: BookOpen },
    { id: "activity", label: "Hoạt động", icon: Calendar },
    { id: "grades", label: "Điểm số", icon: Award },
  ];

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <Navbar />
      <div className="pt-20 pb-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-extrabold mb-2">Phụ huynh Dashboard</h1>
          <p className="text-sm mb-6" style={{ color: "var(--foreground-muted)" }}>Theo dõi tiến độ học tập của con em</p>

          {/* Child selector */}
          <div className="card-base flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold text-white" style={{ background: "linear-gradient(135deg, #7c3aed, #0891b2)" }}>{selectedChild.avatar}</div>
            <div className="flex-1">
              <h2 className="text-lg font-bold">{selectedChild.name}</h2>
              <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>{selectedChild.grade} • Xếp hạng #{selectedChild.stats.rank} lớp</p>
            </div>
            <div className="flex gap-2">
              <span className="badge badge-success">🔥 {selectedChild.stats.streak} ngày liên tiếp</span>
              <button className="btn-secondary text-sm"><Bell className="w-4 h-4" /> Đặt nhắc nhở</button>
            </div>
          </div>

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
              </button>
            ))}
          </div>

          {tab === "overview" && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {[
                  { label: "Khóa học đang học", value: selectedChild.stats.courses, icon: BookOpen, color: "#7c3aed" },
                  { label: "Giờ học tháng này", value: selectedChild.stats.hours, icon: Clock, color: "#0891b2" },
                  { label: "Bài hoàn thành", value: selectedChild.stats.completed, icon: Target, color: "#10b981" },
                  { label: "Điểm trung bình", value: selectedChild.stats.avg, icon: Award, color: "#f59e0b" },
                  { label: "Chuỗi học liên tiếp", value: `${selectedChild.stats.streak} ngày`, icon: TrendingUp, color: "#ec4899" },
                  { label: "Xếp hạng lớp", value: `#${selectedChild.stats.rank}`, icon: Star, color: "#7c3aed" },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="card-base">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: `${color}18` }}>
                      <Icon className="w-5 h-5" style={{ color }} />
                    </div>
                    <p className="text-2xl font-extrabold">{value}</p>
                    <p className="text-xs mt-1" style={{ color: "var(--foreground-muted)" }}>{label}</p>
                  </div>
                ))}
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                {/* Weekly hours */}
                <div className="card-base">
                  <h3 className="font-bold text-sm mb-4 flex items-center gap-2"><Clock className="w-4 h-4" style={{ color: "#0891b2" }} /> Thời gian học tuần này</h3>
                  <div className="flex items-end gap-3 h-32">
                    {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((d, i) => (
                      <div key={d} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-[10px] font-bold" style={{ color: "var(--foreground-muted)" }}>{selectedChild.weeklyHours[i]}h</span>
                        <div className="w-full rounded-lg" style={{ height: `${(selectedChild.weeklyHours[i] / 3) * 100}%`, background: i === 3 ? "linear-gradient(to top, #7c3aed, #0891b2)" : "rgba(124,58,237,0.2)", minHeight: 8 }} />
                        <span className="text-[10px]" style={{ color: "var(--foreground-muted)" }}>{d}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-center mt-3" style={{ color: "var(--foreground-muted)" }}>Tổng: {selectedChild.weeklyHours.reduce((a, b) => a + b, 0)}h tuần này</p>
                </div>

                {/* Recent activity */}
                <div className="card-base">
                  <h3 className="font-bold text-sm mb-4 flex items-center gap-2"><Calendar className="w-4 h-4" style={{ color: "#7c3aed" }} /> Hoạt động gần đây</h3>
                  <div className="space-y-3">
                    {selectedChild.recentActivities.map((a, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: "var(--muted)" }}>
                        <span className="text-lg">{a.icon}</span>
                        <div className="flex-1">
                          <p className="text-sm">{a.text}</p>
                          <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>{a.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {tab === "courses" && (
            <div className="space-y-4">
              {selectedChild.courses.map((c) => (
                <div key={c.title} className="card-base">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold">{c.title}</h3>
                    <span className="text-xs" style={{ color: "var(--foreground-muted)" }}>Hoạt động cuối: {c.lastActivity}</span>
                  </div>
                  <div className="grid sm:grid-cols-3 gap-4 mb-3">
                    <div><p className="text-xs" style={{ color: "var(--foreground-muted)" }}>Tiến độ</p><p className="font-bold text-lg" style={{ color: "#a78bfa" }}>{c.progress}%</p></div>
                    <div><p className="text-xs" style={{ color: "var(--foreground-muted)" }}>Điểm TB</p><p className="font-bold text-lg">{c.grade}</p></div>
                    <div><p className="text-xs" style={{ color: "var(--foreground-muted)" }}>Bài học</p><p className="font-bold text-lg">{Math.round(c.lessons * c.progress / 100)}/{c.lessons}</p></div>
                  </div>
                  <div className="progress-bar"><div className="progress-fill" style={{ width: `${c.progress}%` }} /></div>
                </div>
              ))}
            </div>
          )}

          {tab === "activity" && (
            <div className="card-base">
              <h3 className="font-bold mb-4">Lịch sử hoạt động chi tiết</h3>
              <div className="space-y-3">
                {[
                  ...selectedChild.recentActivities,
                  { text: "Bắt đầu khóa Ngữ văn", time: "3 ngày trước", icon: "📖" },
                  { text: "Nhận chứng chỉ Toán cơ bản", time: "5 ngày trước", icon: "🏆" },
                  { text: "Hoàn thành Bài 15: Số thập phân", time: "6 ngày trước", icon: "✅" },
                ].map((a, i) => (
                  <div key={i} className="flex items-center gap-3 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                    <span className="text-lg">{a.icon}</span>
                    <span className="text-sm flex-1">{a.text}</span>
                    <span className="text-xs" style={{ color: "var(--foreground-muted)" }}>{a.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "grades" && (
            <div className="card-base overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr style={{ borderBottom: "1px solid var(--border)" }}>
                    {["Khóa học", "Bài kiểm tra", "Điểm", "Ngày", "Xếp loại"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: "var(--foreground-muted)" }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {[
                      { course: "Toán lớp 6", test: "Kiểm tra chương 3", score: 9, date: "01/05", grade: "Giỏi" },
                      { course: "Toán lớp 6", test: "Bài tập phân số", score: 8.5, date: "28/04", grade: "Giỏi" },
                      { course: "Tiếng Anh", test: "Unit 4 Test", score: 7, date: "25/04", grade: "Khá" },
                      { course: "Toán lớp 6", test: "Kiểm tra chương 2", score: 9.5, date: "20/04", grade: "Xuất sắc" },
                    ].map((g, i) => (
                      <tr key={i} className="transition-colors hover:bg-[var(--muted)]" style={{ borderBottom: "1px solid var(--border)" }}>
                        <td className="px-4 py-3.5">{g.course}</td>
                        <td className="px-4 py-3.5">{g.test}</td>
                        <td className="px-4 py-3.5 font-bold" style={{ color: g.score >= 8 ? "#10b981" : "#f59e0b" }}>{g.score}</td>
                        <td className="px-4 py-3.5" style={{ color: "var(--foreground-muted)" }}>{g.date}</td>
                        <td className="px-4 py-3.5"><span className={`badge ${g.score >= 9 ? "badge-success" : g.score >= 7 ? "badge-primary" : "badge-warning"} text-[10px]`}>{g.grade}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
