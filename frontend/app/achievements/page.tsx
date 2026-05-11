"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/components/auth/auth-state";
import {
  Trophy, Award, Star, Crown, Flame, Target,
  TrendingUp, Users, Loader2, Lock, ChevronRight,
  Sparkles, Medal, X, BookOpen, GraduationCap, Eye,
} from "lucide-react";
import { toast } from "sonner";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

interface BadgeData {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  tier: string;
  requirement: number;
  earned: boolean;
  earnedAt?: string;
  progress: number;
}

interface LeaderboardEntry {
  id: string;
  name: string;
  streak: number;
  badgeCount: number;
  badges: { code: string; name: string; icon: string; tier: string; category?: string; earnedAt?: string }[];
}

interface UserProfile {
  id: string;
  name: string;
  streak: number;
  joinedAt: string;
  profileTier: string;
  stats: { badgeCount: number; completedCourses: number; enrollments: number; certificates: number };
  badges: { code: string; name: string; icon: string; tier: string; category: string; description: string; earnedAt: string }[];
}

const PROFILE_RANK_LABELS: Record<string, { label: string; emoji: string }> = {
  bronze:    { label: "Hạng Đồng",      emoji: "🥉" },
  silver:    { label: "Hạng Bạc",       emoji: "🥈" },
  gold:      { label: "Hạng Vàng",      emoji: "🥇" },
  platinum:  { label: "Hạng Bạch Kim",  emoji: "💎" },
  diamond:   { label: "Hạng Kim Cương", emoji: "👑" },
  legendary: { label: "Huyền Thoại",    emoji: "🌟" },
};

const TIER_COLORS: Record<string, { bg: string; border: string; text: string; glow: string; textLight: string }> = {
  bronze:    { bg: "rgba(180,100,30,0.12)",  border: "rgba(180,100,30,0.4)",   text: "#cd7f32", textLight: "#8B5A1E", glow: "rgba(205,127,50,0.3)" },
  silver:    { bg: "rgba(140,140,160,0.12)", border: "rgba(140,140,160,0.4)",  text: "#a0a0b0", textLight: "#5a5a6e", glow: "rgba(160,160,180,0.3)" },
  gold:      { bg: "rgba(200,170,0,0.12)",   border: "rgba(200,170,0,0.4)",    text: "#d4a500", textLight: "#8B7500", glow: "rgba(255,215,0,0.3)" },
  platinum:  { bg: "rgba(124,58,237,0.12)",  border: "rgba(124,58,237,0.4)",   text: "#a78bfa", textLight: "#6d28d9", glow: "rgba(124,58,237,0.3)" },
  diamond:   { bg: "rgba(6,182,212,0.12)",   border: "rgba(6,182,212,0.4)",    text: "#22d3ee", textLight: "#0e7490", glow: "rgba(34,211,238,0.3)" },
  legendary: { bg: "rgba(220,130,0,0.12)",   border: "rgba(220,130,0,0.4)",    text: "#f59e0b", textLight: "#b45309", glow: "rgba(245,158,11,0.4)" },
};

const CATEGORY_LABELS: Record<string, string> = {
  streak: "🔥 Chuỗi học tập",
  course: "📚 Hoàn thành khóa học",
  quiz: "🧠 Bài kiểm tra",
  certificate: "📜 Chứng chỉ",
  video: "👀 Video bài giảng",
  assignment: "✍️ Bài tập",
  social: "💬 Giao lưu",
  enrollment: "🔍 Đăng ký học",
};

const TIER_LABELS: Record<string, string> = {
  bronze: "Đồng",
  silver: "Bạc",
  gold: "Vàng",
  platinum: "Bạch kim",
  diamond: "Kim cương",
  legendary: "Huyền thoại",
};

const LEADERBOARD_COLORS = ["#ffd700", "#c0c0c0", "#cd7f32"];

export default function AchievementsPage() {
  const router = useRouter();
  const { user, token, isLoggedIn, loading } = useAuth();
  const [badges, setBadges] = useState<BadgeData[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"tree" | "leaderboard">("tree");
  const [selectedBadge, setSelectedBadge] = useState<BadgeData | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!isLoggedIn) { router.push("/auth/login"); return; }
  }, [isLoggedIn, loading, router]);

  useEffect(() => {
    if (token) {
      Promise.all([fetchAchievements(), fetchLeaderboard()]).finally(() => setPageLoading(false));
    }
  }, [token]);

  async function fetchAchievements() {
    try {
      const res = await fetch(`${API}/achievements/me`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setBadges(data.badges || []);
        setStats(data.stats || null);
      }
    } catch {}
  }

  async function fetchLeaderboard() {
    try {
      const res = await fetch(`${API}/achievements/leaderboard`);
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(Array.isArray(data) ? data : []);
      }
    } catch {}
  }

  async function fetchUserProfile(userId: string) {
    if (userId === user?.id) return; // Don't show profile for self
    setProfileLoading(true);
    try {
      const res = await fetch(`${API}/achievements/user/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setUserProfile(data);
      }
    } catch {} finally {
      setProfileLoading(false);
    }
  }

  if (loading || pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#7c3aed" }} />
      </div>
    );
  }

  const earnedBadges = badges.filter(b => b.earned);
  // Derive categories from actual badge data, preserving order from CATEGORY_LABELS
  const categories = [...new Set(badges.map(b => b.category))].sort((a, b) => {
    const keys = Object.keys(CATEGORY_LABELS);
    return keys.indexOf(a) - keys.indexOf(b);
  });

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <Navbar />

      {/* Badge detail modal */}
      {selectedBadge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }} onClick={() => setSelectedBadge(null)}>
          <div className="card-base max-w-sm w-full animate-scale-in text-center" onClick={e => e.stopPropagation()}>
            <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl"
              style={{
                background: TIER_COLORS[selectedBadge.tier]?.bg,
                border: `2px solid ${TIER_COLORS[selectedBadge.tier]?.border}`,
                boxShadow: selectedBadge.earned ? `0 0 30px ${TIER_COLORS[selectedBadge.tier]?.glow}` : "none",
                opacity: selectedBadge.earned ? 1 : 0.5,
              }}>
              {selectedBadge.icon}
            </div>
            <h3 className="text-lg font-bold mb-1">{selectedBadge.name}</h3>
            <span className="text-xs px-2.5 py-1 rounded-full font-semibold inline-block mb-3"
              style={{ background: TIER_COLORS[selectedBadge.tier]?.bg, color: TIER_COLORS[selectedBadge.tier]?.text, border: `1px solid ${TIER_COLORS[selectedBadge.tier]?.border}` }}>
              {TIER_LABELS[selectedBadge.tier] || selectedBadge.tier}
            </span>
            <p className="text-sm mb-4" style={{ color: "var(--foreground-muted)" }}>{selectedBadge.description}</p>

            {selectedBadge.earned ? (
              <div className="p-3 rounded-xl mb-4" style={{ background: "rgba(16,185,129,0.1)" }}>
                <p className="text-sm font-semibold" style={{ color: "#10b981" }}>✅ Đã đạt được!</p>
                {selectedBadge.earnedAt && (
                  <p className="text-xs mt-1" style={{ color: "var(--foreground-muted)" }}>
                    {new Date(selectedBadge.earnedAt).toLocaleDateString("vi-VN")}
                  </p>
                )}
              </div>
            ) : (
              <div className="mb-4">
                <div className="flex justify-between text-xs mb-1.5" style={{ color: "var(--foreground-muted)" }}>
                  <span>Tiến độ</span>
                  <span>{selectedBadge.progress}%</span>
                </div>
                <div className="progress-bar" style={{ height: 8 }}>
                  <div className="progress-fill" style={{ width: `${selectedBadge.progress}%`, background: TIER_COLORS[selectedBadge.tier]?.text }} />
                </div>
              </div>
            )}

            <button onClick={() => setSelectedBadge(null)} className="btn-secondary w-full justify-center">Đóng</button>
          </div>
        </div>
      )}

      <div className="pt-20 pb-24 page-enter">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Background orbs */}
          <div className="orb orb-violet w-[300px] h-[300px] -top-20 right-[-80px] opacity-15 pointer-events-none" style={{ position: "absolute" }} />

          {/* Header */}
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Trophy className="w-8 h-8" style={{ color: "#ffd700" }} />
              <h1 className="text-3xl font-extrabold">Bảng Thành Tích</h1>
            </div>
            <p className="text-base" style={{ color: "var(--foreground-muted)" }}>Thu thập huy hiệu, thi đua cùng bạn bè</p>
          </div>

          {/* Stats row */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Huy hiệu", value: `${stats.earned}/${stats.total}`, icon: <Award className="w-5 h-5" />, color: "#7c3aed" },
                { label: "Chuỗi ngày", value: stats.streak, icon: <Flame className="w-5 h-5" />, color: "#ef4444" },
                { label: "Khóa hoàn thành", value: stats.completedCourses, icon: <Target className="w-5 h-5" />, color: "#10b981" },
                { label: "Chứng chỉ", value: stats.certificates, icon: <Medal className="w-5 h-5" />, color: "#f59e0b" },
              ].map(({ label, value, icon, color }) => (
                <div key={label} className="card-base text-center hover-lift">
                  <div className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center" style={{ background: `${color}18`, color }}>{icon}</div>
                  <p className="text-2xl font-extrabold" style={{ color }}>{value}</p>
                  <p className="text-xs mt-1" style={{ color: "var(--foreground-muted)" }}>{label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 mb-8 justify-center">
            <button onClick={() => setActiveTab("tree")} className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === "tree" ? "text-white" : ""}`}
              style={{ background: activeTab === "tree" ? "var(--gradient-brand)" : "var(--muted)", color: activeTab === "tree" ? "white" : "var(--foreground-muted)" }}>
              <Sparkles className="w-4 h-4 inline-block mr-1.5" /> Cây Huy Hiệu
            </button>
            <button onClick={() => setActiveTab("leaderboard")} className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all`}
              style={{ background: activeTab === "leaderboard" ? "var(--gradient-brand)" : "var(--muted)", color: activeTab === "leaderboard" ? "white" : "var(--foreground-muted)" }}>
              <Users className="w-4 h-4 inline-block mr-1.5" /> Bảng Xếp Hạng
            </button>
          </div>

          {/* Badge Tree */}
          {activeTab === "tree" && (
            <div className="space-y-8">
              {categories.map(cat => {
                const catBadges = badges.filter(b => b.category === cat);
                if (catBadges.length === 0) return null;
                return (
                  <div key={cat}>
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                      {CATEGORY_LABELS[cat]}
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--muted)", color: "var(--foreground-muted)" }}>
                        {catBadges.filter(b => b.earned).length}/{catBadges.length}
                      </span>
                    </h2>

                    {/* Badge tree - connected nodes */}
                    <div className="relative">

                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {catBadges.map((badge, i) => {
                          const tier = TIER_COLORS[badge.tier] || TIER_COLORS.bronze;
                          const prevBadge = i > 0 ? catBadges[i - 1] : null;
                          const isLocked = !badge.earned && prevBadge && !prevBadge.earned;

                          return (
                            <button
                              key={badge.id}
                              onClick={() => setSelectedBadge(badge)}
                              className="relative group flex flex-col items-center p-4 rounded-2xl transition-all duration-300 hover:scale-105 z-10"
                              style={{
                                background: badge.earned ? tier.bg : "var(--card)",
                                border: `2px solid ${badge.earned ? tier.border : "var(--border)"}`,
                                boxShadow: badge.earned ? `0 8px 32px ${tier.glow}` : "none",
                                opacity: isLocked ? 0.4 : 1,
                              }}
                            >
                              {/* Badge icon */}
                              <div className="w-14 h-14 rounded-full flex items-center justify-center text-3xl mb-2 transition-transform group-hover:scale-110"
                                style={{
                                  background: badge.earned ? `${tier.text}15` : "var(--muted)",
                                  filter: badge.earned ? "none" : "grayscale(1)",
                                }}>
                                {isLocked ? <Lock className="w-6 h-6" style={{ color: "var(--foreground-muted)" }} /> : badge.icon}
                              </div>

                              {/* Name */}
                              <p className="text-xs font-bold text-center leading-tight mb-1" style={{ color: badge.earned ? tier.text : "var(--foreground-muted)" }}>
                                {badge.name}
                              </p>

                              {/* Tier badge */}
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold"
                                style={{ background: tier.bg, color: tier.text, border: `1px solid ${tier.border}` }}>
                                {TIER_LABELS[badge.tier]}
                              </span>

                              {/* Progress ring for unearned */}
                              {!badge.earned && !isLocked && (
                                <div className="mt-1.5 w-full">
                                  <div className="progress-bar" style={{ height: 4 }}>
                                    <div className="progress-fill" style={{ width: `${badge.progress}%`, background: tier.text }} />
                                  </div>
                                  <p className="text-[9px] mt-0.5 text-center" style={{ color: "var(--foreground-muted)" }}>{badge.progress}%</p>
                                </div>
                              )}

                              {/* Earned check */}
                              {badge.earned && (
                                <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full flex items-center justify-center text-[10px]"
                                  style={{ background: "#10b981", color: "white", boxShadow: "0 2px 8px rgba(16,185,129,0.5)" }}>
                                  ✓
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Earned badges showcase */}
              {earnedBadges.length > 0 && (
                <div className="card-base mt-8" style={{ border: "1px solid rgba(255,215,0,0.2)" }}>
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Crown className="w-5 h-5" style={{ color: "#ffd700" }} /> Huy Hiệu Đã Thu Thập
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {earnedBadges.map(badge => {
                      const tier = TIER_COLORS[badge.tier] || TIER_COLORS.bronze;
                      return (
                        <button key={badge.id} onClick={() => setSelectedBadge(badge)}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all hover:scale-105"
                          style={{ background: tier.bg, border: `1px solid ${tier.border}` }}>
                          <span className="text-xl">{badge.icon}</span>
                          <span className="text-xs font-bold" style={{ color: tier.text }}>{badge.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Leaderboard */}
          {activeTab === "leaderboard" && (
            <div className="card-base max-w-2xl mx-auto">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" style={{ color: "#7c3aed" }} /> Bảng Xếp Hạng Học Sinh
              </h3>

              {leaderboard.length === 0 ? (
                <p className="text-center py-8 text-sm" style={{ color: "var(--foreground-muted)" }}>Chưa có dữ liệu</p>
              ) : (
                <div className="space-y-3">
                  {leaderboard.map((entry, i) => {
                    const isMe = entry.id === user?.id;
                    const isTop3 = i < 3;
                    return (
                      <button key={entry.id}
                        onClick={() => !isMe && fetchUserProfile(entry.id)}
                        className="flex items-center gap-4 p-4 rounded-xl transition-all w-full text-left hover:scale-[1.01]"
                        style={{
                          background: isMe ? "rgba(124,58,237,0.08)" : isTop3 ? `${LEADERBOARD_COLORS[i]}08` : "var(--muted)",
                          border: isMe ? "1px solid rgba(124,58,237,0.3)" : isTop3 ? `1px solid ${LEADERBOARD_COLORS[i]}30` : "1px solid transparent",
                          cursor: isMe ? "default" : "pointer",
                        }}>
                        {/* Rank */}
                        <div className="w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-sm flex-shrink-0"
                          style={{
                            background: isTop3 ? `${LEADERBOARD_COLORS[i]}20` : "var(--muted)",
                            color: isTop3 ? LEADERBOARD_COLORS[i] : "var(--foreground-muted)",
                            border: isTop3 ? `2px solid ${LEADERBOARD_COLORS[i]}40` : "none",
                          }}>
                          {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                        </div>

                        {/* Name */}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">
                            {entry.name} {isMe && <span className="text-xs ml-1" style={{ color: "#a78bfa" }}>(bạn)</span>}
                          </p>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-xs flex items-center gap-1" style={{ color: "#ef4444" }}>
                              <Flame className="w-3 h-3" /> {entry.streak} ngày
                            </span>
                            <span className="text-xs flex items-center gap-1" style={{ color: "#7c3aed" }}>
                              <Award className="w-3 h-3" /> {entry.badgeCount} huy hiệu
                            </span>
                          </div>
                        </div>

                        {/* Badge icons */}
                        <div className="flex -space-x-1 flex-shrink-0">
                          {entry.badges.slice(0, 5).map((b, j) => (
                            <span key={j} className="w-7 h-7 rounded-full flex items-center justify-center text-sm"
                              style={{
                                background: TIER_COLORS[b.tier]?.bg || "var(--muted)",
                                border: `1px solid ${TIER_COLORS[b.tier]?.border || "var(--border)"}`,
                              }}
                              title={b.name}>
                              {b.icon}
                            </span>
                          ))}
                          {entry.badges.length > 5 && (
                            <span className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold"
                              style={{ background: "var(--muted)", color: "var(--foreground-muted)" }}>
                              +{entry.badges.length - 5}
                            </span>
                          )}
                        </div>

                        {/* Eye icon for non-self */}
                        {!isMe && (
                          <Eye className="w-4 h-4 flex-shrink-0 opacity-40" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* User Profile Modal */}
      {(userProfile || profileLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }} onClick={() => { setUserProfile(null); setProfileLoading(false); }}>
          <div className="card-base max-w-lg w-full max-h-[85vh] overflow-y-auto animate-scale-in" onClick={e => e.stopPropagation()}>
            {profileLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#7c3aed" }} />
              </div>
            ) : userProfile && (() => {
              const rank = PROFILE_RANK_LABELS[userProfile.profileTier] || PROFILE_RANK_LABELS.bronze;
              const tierColor = TIER_COLORS[userProfile.profileTier] || TIER_COLORS.bronze;
              const groupedBadges = userProfile.badges.reduce<Record<string, typeof userProfile.badges>>((acc, b) => {
                const cat = b.category || 'other';
                if (!acc[cat]) acc[cat] = [];
                acc[cat].push(b);
                return acc;
              }, {});

              return (
                <>
                  {/* Close button */}
                  <button onClick={() => setUserProfile(null)} className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center hover:bg-[var(--muted)] transition-colors">
                    <X className="w-4 h-4" />
                  </button>

                  {/* Profile header */}
                  <div className="text-center mb-6">
                    {/* Avatar circle with tier border */}
                    <div className="w-20 h-20 rounded-full mx-auto mb-3 flex items-center justify-center text-4xl"
                      style={{ background: tierColor.bg, border: `3px solid ${tierColor.border}`, boxShadow: `0 0 30px ${tierColor.glow}` }}>
                      {rank.emoji}
                    </div>
                    <h3 className="text-xl font-extrabold mb-1">{userProfile.name}</h3>
                    <span className="text-sm px-3 py-1 rounded-full font-bold inline-block"
                      style={{ background: tierColor.bg, color: tierColor.text, border: `1px solid ${tierColor.border}` }}>
                      {rank.label}
                    </span>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-4 gap-2 mb-6">
                    {[
                      { label: "Huy hiệu", value: userProfile.stats.badgeCount, color: "#7c3aed" },
                      { label: "Streak", value: `${userProfile.streak}🔥`, color: "#ef4444" },
                      { label: "Khóa xong", value: userProfile.stats.completedCourses, color: "#10b981" },
                      { label: "Chứng chỉ", value: userProfile.stats.certificates, color: "#f59e0b" },
                    ].map(s => (
                      <div key={s.label} className="text-center p-2 rounded-xl" style={{ background: `${s.color}10` }}>
                        <p className="text-lg font-extrabold" style={{ color: s.color }}>{s.value}</p>
                        <p className="text-[10px]" style={{ color: "var(--foreground-muted)" }}>{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Badges by category */}
                  <div className="space-y-4">
                    <h4 className="font-bold text-sm flex items-center gap-2">
                      <Trophy className="w-4 h-4" style={{ color: "#ffd700" }} /> Huy hiệu đã nhận ({userProfile.badges.length})
                    </h4>
                    {Object.entries(groupedBadges).map(([cat, catBadges]) => (
                      <div key={cat}>
                        <p className="text-xs font-semibold mb-2" style={{ color: "var(--foreground-muted)" }}>
                          {CATEGORY_LABELS[cat] || cat}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {catBadges.map((b, j) => {
                            const tc = TIER_COLORS[b.tier] || TIER_COLORS.bronze;
                            return (
                              <div key={j} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-all hover:scale-105"
                                style={{ background: tc.bg, border: `1px solid ${tc.border}` }}
                                title={b.description}>
                                <span className="text-base">{b.icon}</span>
                                <span className="text-xs font-bold" style={{ color: tc.text }}>{b.name}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}

                    {userProfile.badges.length === 0 && (
                      <p className="text-center py-6 text-sm" style={{ color: "var(--foreground-muted)" }}>Chưa có huy hiệu nào</p>
                    )}
                  </div>

                  {/* Join date */}
                  <div className="mt-6 pt-4 text-center" style={{ borderTop: "1px solid var(--border)" }}>
                    <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>
                      Tham gia từ {new Date(userProfile.joinedAt).toLocaleDateString("vi-VN", { month: "long", year: "numeric" })}
                    </p>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
