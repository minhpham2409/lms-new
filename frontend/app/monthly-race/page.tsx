"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/components/auth/auth-state";
import {
  Trophy, Flame, Target, Users, Loader2, ChevronLeft, ChevronRight,
  Award, Video, BookOpen, Calendar, Zap, Star,
  TrendingUp, Crown, Gift, Clock, X
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

interface MonthlyStats {
  videosWatched: number;
  quizzesDone: number;
  assignmentsDone: number;
  checkInDays: number;
  badgesEarned: number;
  coursesCompleted: number;
  certificatesEarned: number;
  watchMinutes: number;
}

interface MyStatsData {
  userId: string;
  month: number;
  year: number;
  stats: MonthlyStats;
  xp: number;
}

interface LeaderboardEntry {
  userId: string;
  name: string;
  streak: number;
  xp: number;
  videosWatched: number;
  quizzesDone: number;
  assignmentsDone: number;
  checkInDays: number;
  badgesEarned: number;
  coursesCompleted: number;
  certificatesEarned: number;
  watchMinutes: number;
}

interface HistoryMonth {
  period: string;
  month: number;
  year: number;
  winners: { rank: number; name: string; xp: number; discount: number }[];
}

const MONTH_NAMES = [
  "", "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
  "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
];

const RANK_STYLES = [
  { emoji: "🥇", color: "#ffd700", bg: "rgba(255,215,0,0.08)", border: "rgba(255,215,0,0.25)" },
  { emoji: "🥈", color: "#c0c0c0", bg: "rgba(192,192,192,0.08)", border: "rgba(192,192,192,0.25)" },
  { emoji: "🥉", color: "#cd7f32", bg: "rgba(205,127,50,0.08)", border: "rgba(205,127,50,0.25)" },
];

export default function MonthlyRacePage() {
  const router = useRouter();
  const { user, token, isLoggedIn, loading } = useAuth();
  const [pageLoading, setPageLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [myStats, setMyStats] = useState<MyStatsData | null>(null);
  const [history, setHistory] = useState<HistoryMonth[]>([]);

  const [selectedUser, setSelectedUser] = useState<LeaderboardEntry | null>(null);

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const isCurrentMonth = month === now.getMonth() + 1 && year === now.getFullYear();
  const daysInMonth = new Date(year, month, 0).getDate();
  const currentDay = isCurrentMonth ? now.getDate() : daysInMonth;
  const daysLeft = isCurrentMonth ? daysInMonth - currentDay : 0;
  const progressPercent = (currentDay / daysInMonth) * 100;

  useEffect(() => {
    if (loading) return;
    if (!isLoggedIn) { router.push("/auth/login"); return; }
    if (user?.role && user.role !== "student") { router.push("/dashboard"); return; }
  }, [isLoggedIn, loading, user, router]);

  useEffect(() => {
    if (!token) return;
    setPageLoading(true);
    Promise.all([fetchLeaderboard(), fetchMyStats(), fetchHistory()])
      .finally(() => setPageLoading(false));
  }, [token, month, year]);

  async function fetchLeaderboard() {
    try {
      const res = await fetch(`${API}/monthly-race/leaderboard?month=${month}&year=${year}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setLeaderboard(await res.json());
    } catch {}
  }

  async function fetchMyStats() {
    try {
      const res = await fetch(`${API}/monthly-race/my-stats?month=${month}&year=${year}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setMyStats(await res.json());
    } catch {}
  }

  async function fetchHistory() {
    try {
      const res = await fetch(`${API}/monthly-race/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setHistory(await res.json());
    } catch {}
  }

  function goToPrevMonth() {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }

  function goToNextMonth() {
    if (isCurrentMonth) return;
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  const myRank = leaderboard.findIndex(e => e.userId === user?.id) + 1;

  if (loading || pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
        <Loader2 className="w-10 h-10 animate-spin" style={{ color: "#5624d0" }} />
      </div>
    );
  }

  // Helper for rendering stats breakdown
  const renderStatsBreakdown = (stats: MonthlyStats | LeaderboardEntry) => (
    <div className="space-y-4">
      {[
        { icon: Video, label: "Video đã xem", value: stats.videosWatched, xp: stats.videosWatched * 5, color: "#5624d0" },
        { icon: Target, label: "Quiz hoàn thành", value: stats.quizzesDone, xp: stats.quizzesDone * 10, color: "#0891b2" },
        { icon: BookOpen, label: "Bài tập nộp", value: stats.assignmentsDone, xp: stats.assignmentsDone * 8, color: "#10b981" },
        { icon: Calendar, label: "Ngày check-in", value: stats.checkInDays, xp: stats.checkInDays * 3, color: "#f59e0b" },
        { icon: Award, label: "Huy hiệu mới", value: stats.badgesEarned, xp: stats.badgesEarned * 20, color: "#ffd700" },
        { icon: Trophy, label: "Khóa hoàn thành", value: stats.coursesCompleted, xp: stats.coursesCompleted * 50, color: "#ef4444" },
        { icon: Crown, label: "Chứng chỉ", value: stats.certificatesEarned, xp: stats.certificatesEarned * 30, color: "#a855f7" },
      ].map(item => (
        <div key={item.label} className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
               style={{ background: `${item.color}15` }}>
            <item.icon className="w-5 h-5" style={{ color: item.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{item.label}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-base font-extrabold">{item.value}</p>
            <p className="text-xs font-medium" style={{ color: "#10b981" }}>+{item.xp} XP</p>
          </div>
        </div>
      ))}
      {stats.watchMinutes > 0 && (
        <div className="pt-3 mt-3" style={{ borderTop: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 font-medium" style={{ color: "#6a6f73" }}>
              <Clock className="w-4 h-4" /> Tổng thời gian học
            </span>
            <span className="font-extrabold">{stats.watchMinutes} phút</span>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen text-base" style={{ background: "var(--background)" }}>
      <Navbar />

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" 
             style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }} 
             onClick={() => setSelectedUser(null)}>
          <div className="card-base max-w-md w-full animate-scale-in" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedUser(null)} className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center hover:bg-[var(--muted)] transition-colors">
              <X className="w-5 h-5" />
            </button>
            <div className="text-center mb-6">
              <div className="w-20 h-20 rounded-full mx-auto mb-3 flex items-center justify-center text-3xl font-bold"
                   style={{ background: "rgba(124,58,237,0.1)", border: "2px solid rgba(124,58,237,0.3)", color: "#5624d0" }}>
                {selectedUser.name.charAt(0).toUpperCase()}
              </div>
              <h3 className="text-2xl font-extrabold">{selectedUser.name}</h3>
              <p className="text-lg font-bold mt-1" style={{ color: "#f59e0b" }}>{selectedUser.xp} XP</p>
            </div>
            <div className="max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
               {renderStatsBreakdown(selectedUser)}
            </div>
          </div>
        </div>
      )}

      <div className="pt-24 pb-24 page-enter">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full mb-5"
                 style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.15)", color: "#f59e0b" }}>
              <Zap className="w-5 h-5" />
              <span className="text-sm font-bold uppercase tracking-wider">Cuộc đua tháng</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">
              🏁 Thi Đua <span className="gradient-text">Hàng Tháng</span>
            </h1>
            <p className="text-base sm:text-lg max-w-2xl mx-auto" style={{ color: "#6a6f73" }}>
              Học tập tích cực, tích lũy XP và giành voucher giảm giá! Điểm reset vào ngày 1 mỗi tháng.
            </p>
          </div>

          {/* Month Navigator */}
          <div className="flex items-center justify-center gap-6 mb-10">
            <button onClick={goToPrevMonth} className="w-12 h-12 rounded-xl flex items-center justify-center transition-colors hover:bg-[var(--muted)]"
                    style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div className="text-center min-w-[220px]">
              <h2 className="text-2xl font-extrabold">{MONTH_NAMES[month]} {year}</h2>
              {isCurrentMonth && (
                <p className="text-sm mt-1 font-medium" style={{ color: "#6a6f73" }}>
                  Còn <span className="font-bold text-base" style={{ color: "#f59e0b" }}>{daysLeft}</span> ngày
                </p>
              )}
            </div>
            <button onClick={goToNextMonth} disabled={isCurrentMonth}
                    className="w-12 h-12 rounded-xl flex items-center justify-center transition-colors hover:bg-[var(--muted)] disabled:opacity-30 disabled:hover:bg-[var(--card)]"
                    style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Progress bar for current month */}
          {isCurrentMonth && (
            <div className="max-w-xl mx-auto mb-10">
              <div className="flex justify-between text-xs font-semibold mb-2" style={{ color: "#6a6f73" }}>
                <span>Ngày {currentDay}/{daysInMonth}</span>
                <span>{Math.round(progressPercent)}% tháng</span>
              </div>
              <div className="progress-bar" style={{ height: 8 }}>
                <div className="progress-fill" style={{ width: `${progressPercent}%`, background: "linear-gradient(to right, #f59e0b, #ef4444)" }} />
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-8">

            {/* Left: My Stats */}
            <div className="space-y-6">
              {/* My XP Card */}
              <div className="card-base relative overflow-hidden" style={{ border: "1px solid rgba(124,58,237,0.3)" }}>
                <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10"
                     style={{ background: "radial-gradient(circle, #a435f0, transparent)", transform: "translate(30%, -30%)" }} />
                <h3 className="font-bold text-base mb-5 flex items-center gap-2">
                  <Star className="w-5 h-5" style={{ color: "#f59e0b" }} /> Điểm của bạn
                </h3>

                <div className="text-center mb-6">
                  <p className="text-5xl font-extrabold gradient-text">{myStats?.xp ?? 0}</p>
                  <p className="text-sm font-medium mt-2" style={{ color: "#6a6f73" }}>XP tháng này</p>
                </div>

                {myRank > 0 && (
                  <div className="text-center p-4 rounded-xl mb-6" style={{ background: "rgba(124,58,237,0.08)" }}>
                    <p className="text-sm font-medium mb-1" style={{ color: "#6a6f73" }}>Xếp hạng hiện tại</p>
                    <p className="text-3xl font-extrabold" style={{ color: myRank <= 3 ? RANK_STYLES[myRank - 1]?.color : "#a435f0" }}>
                      {myRank <= 3 ? RANK_STYLES[myRank - 1].emoji : `#${myRank}`}
                    </p>
                  </div>
                )}

                {/* Reward preview */}
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#6a6f73" }}>Phần thưởng cuối tháng</p>
                  {[
                    { rank: "🥇 Hạng 1", discount: "Voucher 20%" },
                    { rank: "🥈 Hạng 2", discount: "Voucher 10%" },
                    { rank: "🥉 Hạng 3", discount: "Voucher 5%" },
                  ].map(r => (
                    <div key={r.rank} className="flex items-center justify-between text-sm py-2 px-3 rounded-lg"
                         style={{ background: "var(--muted)" }}>
                      <span className="font-bold">{r.rank}</span>
                      <span className="font-extrabold" style={{ color: "#10b981" }}>{r.discount}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* My Activity Breakdown */}
              {myStats && (
                <div className="card-base">
                  <h3 className="font-bold text-base mb-5 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" style={{ color: "#10b981" }} /> Chi tiết hoạt động
                  </h3>
                  {renderStatsBreakdown(myStats.stats)}
                </div>
              )}

              {/* XP Guide */}
              <div className="card-base">
                <h3 className="font-bold text-base mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5" style={{ color: "#f59e0b" }} /> Cách tính XP
                </h3>
                <div className="space-y-2 text-sm font-medium">
                  {[
                    { act: "Xem 1 video", xp: "+5" },
                    { act: "Hoàn thành quiz", xp: "+10" },
                    { act: "Nộp bài tập", xp: "+8" },
                    { act: "Check-in/ngày", xp: "+3" },
                    { act: "Đạt huy hiệu", xp: "+20" },
                    { act: "Hoàn thành khóa", xp: "+50" },
                    { act: "Nhận chứng chỉ", xp: "+30" },
                  ].map(r => (
                    <div key={r.act} className="flex justify-between py-1.5 px-3 rounded-lg" style={{ background: "var(--muted)" }}>
                      <span style={{ color: "#6a6f73" }}>{r.act}</span>
                      <span className="font-bold" style={{ color: "#10b981" }}>{r.xp}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Center + Right: Leaderboard */}
            <div className="lg:col-span-2 space-y-8">

              {/* Leaderboard */}
              <div className="card-base">
                <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
                  <Crown className="w-6 h-6" style={{ color: "#ffd700" }} />
                  Bảng xếp hạng {MONTH_NAMES[month]}
                  <span className="text-sm px-3 py-1 rounded-full ml-auto font-medium" style={{ background: "var(--muted)", color: "#6a6f73" }}>
                    {leaderboard.length} người tham gia
                  </span>
                </h3>

                {leaderboard.length === 0 ? (
                  <div className="text-center py-20">
                    <Trophy className="w-16 h-16 mx-auto mb-4 opacity-30" style={{ color: "#6a6f73" }} />
                    <p className="text-lg font-bold mb-2">Chưa có dữ liệu</p>
                    <p className="text-base" style={{ color: "#6a6f73" }}>
                      {isCurrentMonth ? "Hãy bắt đầu học để xuất hiện trên bảng xếp hạng!" : "Không có hoạt động trong tháng này."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Top 3 podium */}
                    {leaderboard.length >= 3 && (
                      <div className="flex items-end justify-center gap-4 mb-10 pt-6">
                        {[1, 0, 2].map(i => {
                          const entry = leaderboard[i];
                          if (!entry) return null;
                          const rs = RANK_STYLES[i];
                          const isMe = entry.userId === user?.id;
                          const height = i === 0 ? "h-36" : i === 1 ? "h-28" : "h-24";
                          return (
                            <button key={i} onClick={() => setSelectedUser(entry)} 
                                    className="flex flex-col items-center flex-1 max-w-[160px] group transition-transform hover:-translate-y-2 focus:outline-none">
                              <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-extrabold mb-3 group-hover:scale-110 transition-transform"
                                   style={{ background: rs.bg, border: `3px solid ${rs.border}`, boxShadow: `0 8px 24px ${rs.border}` }}>
                                {entry.name.charAt(0).toUpperCase()}
                              </div>
                              <p className="text-sm font-bold text-center truncate w-full mb-1">
                                {entry.name} {isMe && <span style={{ color: "#a435f0" }}>(bạn)</span>}
                              </p>
                              <p className="text-xs font-extrabold mb-3" style={{ color: rs.color }}>{entry.xp} XP</p>
                              <div className={`w-full ${height} rounded-t-2xl flex items-start justify-center pt-4 transition-colors`}
                                   style={{ background: `linear-gradient(180deg, ${rs.bg}, transparent)`, border: `2px solid ${rs.border}`, borderBottom: "none" }}>
                                <span className="text-3xl drop-shadow-md">{rs.emoji}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Full list */}
                    {leaderboard.map((entry, i) => {
                      const isMe = entry.userId === user?.id;
                      const isTop3 = i < 3;
                      return (
                        <button key={entry.userId}
                             onClick={() => setSelectedUser(entry)}
                             className="flex items-center gap-5 p-5 rounded-xl transition-all w-full text-left hover:scale-[1.01] hover:bg-[var(--muted)] focus:outline-none"
                             style={{
                               background: isMe ? "rgba(124,58,237,0.08)" : "var(--muted)",
                               border: isMe ? "1px solid rgba(124,58,237,0.3)" : "1px solid transparent",
                             }}>
                          {/* Rank */}
                          <div className="w-12 h-12 rounded-full flex items-center justify-center font-extrabold text-lg flex-shrink-0"
                               style={{
                                 background: isTop3 ? RANK_STYLES[i]?.bg : "var(--card)",
                                 color: isTop3 ? RANK_STYLES[i]?.color : "var(--foreground-muted)",
                                 border: isTop3 ? `2px solid ${RANK_STYLES[i]?.border}` : "1px solid var(--border)",
                               }}>
                            {isTop3 ? RANK_STYLES[i].emoji : i + 1}
                          </div>

                          {/* Name */}
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-base truncate">
                              {entry.name}
                              {isMe && <span className="text-sm ml-2 font-semibold" style={{ color: "#a435f0" }}>(bạn)</span>}
                            </p>
                            <div className="flex items-center gap-4 mt-1.5">
                              <span className="text-xs font-medium flex items-center gap-1.5" style={{ color: "#ef4444" }}>
                                <Flame className="w-4 h-4" /> {entry.streak}
                              </span>
                              <span className="text-xs font-medium flex items-center gap-1.5" style={{ color: "#6a6f73" }}>
                                <Video className="w-4 h-4" /> {entry.videosWatched}
                              </span>
                              <span className="text-xs font-medium flex items-center gap-1.5" style={{ color: "#6a6f73" }}>
                                <Target className="w-4 h-4" /> {entry.quizzesDone}
                              </span>
                            </div>
                          </div>

                          {/* XP */}
                          <div className="text-right flex-shrink-0">
                            <p className="text-2xl font-extrabold" style={{ color: isTop3 ? RANK_STYLES[i]?.color : "#a435f0" }}>
                              {entry.xp}
                            </p>
                            <p className="text-xs font-bold" style={{ color: "#6a6f73" }}>XP</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* History */}
              {history.length > 0 && (
                <div className="card-base">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <Gift className="w-6 h-6" style={{ color: "#10b981" }} /> Lịch sử vinh danh
                  </h3>
                  <div className="space-y-5">
                    {history.map(h => (
                      <div key={h.period} className="p-5 rounded-2xl" style={{ background: "var(--muted)" }}>
                        <p className="text-base font-extrabold mb-4">{MONTH_NAMES[h.month]} {h.year}</p>
                        <div className="space-y-3">
                          {h.winners.map(w => {
                            const rs = RANK_STYLES[w.rank - 1];
                            return (
                              <div key={w.rank} className="flex items-center gap-4 text-base">
                                <span className="text-2xl drop-shadow-sm">{rs?.emoji}</span>
                                <span className="font-bold flex-1">{w.name}</span>
                                <span className="text-sm font-extrabold" style={{ color: "#6a6f73" }}>{w.xp} XP</span>
                                <span className="text-sm px-2.5 py-1 rounded-full font-bold"
                                      style={{ background: "rgba(16,185,129,0.1)", color: "#10b981" }}>
                                  -{w.discount}%
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
