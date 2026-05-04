"use client";

import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import {
  BookOpen, Clock, Award, TrendingUp, Play, BarChart3,
  ChevronRight, Star, Target, Flame, Calendar,
} from "lucide-react";

const enrolledCourses = [
  { id: "1", title: "Toán học cơ bản — Lớp 6", progress: 68, lessons: 24, completed: 16, author: "Thầy Minh", color: "#7c3aed" },
  { id: "3", title: "Tiếng Anh giao tiếp", progress: 35, lessons: 30, completed: 10, author: "Thầy John", color: "#0891b2" },
  { id: "5", title: "Ngữ văn — Cảm thụ tác phẩm", progress: 12, lessons: 20, completed: 2, author: "Cô Mai", color: "#ec4899" },
];

const recentActivity = [
  { text: "Hoàn thành Bài 16: Phân số", time: "2 giờ trước", icon: "✅" },
  { text: "Đạt 9/10 bài kiểm tra Toán", time: "5 giờ trước", icon: "🎯" },
  { text: "Bắt đầu khóa Ngữ văn", time: "1 ngày trước", icon: "📖" },
  { text: "Nhận chứng chỉ Toán cơ bản", time: "3 ngày trước", icon: "🏆" },
];

export default function DashboardPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <Navbar />
      <div className="pt-20 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-extrabold mb-2">
              Xin chào, <span className="gradient-text">Học sinh!</span> 👋
            </h1>
            <p className="text-sm" style={{ color: "#8892a4" }}>Tiếp tục hành trình học tập của bạn</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Khóa đang học", value: "3", icon: BookOpen, color: "#7c3aed" },
              { label: "Giờ học tập", value: "24.5", icon: Clock, color: "#0891b2" },
              { label: "Bài hoàn thành", value: "28", icon: Target, color: "#10b981" },
              { label: "Chứng chỉ", value: "1", icon: Award, color: "#f59e0b" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="card-base">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}22` }}>
                    <Icon className="w-5 h-5" style={{ color }} />
                  </div>
                  <TrendingUp className="w-4 h-4" style={{ color: "#10b981" }} />
                </div>
                <p className="text-2xl font-extrabold">{value}</p>
                <p className="text-xs mt-1" style={{ color: "#8892a4" }}>{label}</p>
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

              <div className="space-y-4">
                {enrolledCourses.map((course) => (
                  <Link key={course.id} href={`/courses/${course.id}`}>
                    <div className="card-base card-hover flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background: `${course.color}22` }}>
                        <BookOpen className="w-6 h-6" style={{ color: course.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm truncate">{course.title}</h3>
                        <p className="text-xs mt-1" style={{ color: "#8892a4" }}>{course.author} • {course.completed}/{course.lessons} bài</p>
                        <div className="mt-2 progress-bar">
                          <div className="progress-fill" style={{ width: `${course.progress}%` }} />
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-lg font-bold" style={{ color: course.color }}>{course.progress}%</p>
                        <button className="mt-1 text-xs flex items-center gap-1 btn-ghost px-2 py-1" style={{ color: "#a78bfa" }}>
                          <Play className="w-3 h-3" /> Tiếp tục
                        </button>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Weekly chart placeholder */}
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
                        <span className="text-[10px]" style={{ color: "#8892a4" }}>{day}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Streak */}
              <div className="card-base text-center">
                <Flame className="w-10 h-10 mx-auto mb-2" style={{ color: "#f59e0b" }} />
                <p className="text-2xl font-extrabold">7 ngày</p>
                <p className="text-xs" style={{ color: "#8892a4" }}>Chuỗi học liên tiếp 🔥</p>
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
                        <p className="text-xs" style={{ color: "#8892a4" }}>{act.time}</p>
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
