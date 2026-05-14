"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/components/auth/auth-state";
import {
  Trophy, Award, Crown, Flame, Target,
  Users, Loader2, Lock, ChevronRight,
  Sparkles, Medal, X,
  CheckCircle2
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

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
  bronze:    { bg: "rgba(180,100,30,0.12)",  border: "rgba(180,100,30,0.4)",   text: "#cd7f32", textLight: "#cd7f32", glow: "rgba(205,127,50,0.3)" },
  silver:    { bg: "rgba(140,140,160,0.12)", border: "rgba(140,140,160,0.4)",  text: "#a0a0b0", textLight: "#a0a0b0", glow: "rgba(160,160,180,0.3)" },
  gold:      { bg: "rgba(200,170,0,0.12)",   border: "rgba(200,170,0,0.4)",    text: "#d4a500", textLight: "#d4a500", glow: "rgba(255,215,0,0.3)" },
  platinum:  { bg: "rgba(124,58,237,0.12)",  border: "rgba(124,58,237,0.4)",   text: "#a78bfa", textLight: "#a78bfa", glow: "rgba(124,58,237,0.3)" },
  diamond:   { bg: "rgba(6,182,212,0.12)",   border: "rgba(6,182,212,0.4)",    text: "#22d3ee", textLight: "#22d3ee", glow: "rgba(34,211,238,0.3)" },
  legendary: { bg: "rgba(220,130,0,0.12)",   border: "rgba(220,130,0,0.4)",    text: "#f59e0b", textLight: "#f59e0b", glow: "rgba(245,158,11,0.4)" },
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
    if (userId === user?.id) return;
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const categories = [...new Set(badges.map(b => b.category))].sort((a, b) => {
    const keys = Object.keys(CATEGORY_LABELS);
    return keys.indexOf(a) - keys.indexOf(b);
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Banner Section */}
      <div className="relative pt-24 pb-32 overflow-hidden bg-slate-950 text-white border-b border-white/10">
        {/* Abstract Background Elements */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-950 to-slate-950"></div>
          <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-violet-600/20 blur-[120px]" />
          <div className="absolute top-[20%] -right-[10%] w-[40%] h-[60%] rounded-full bg-fuchsia-600/20 blur-[120px]" />
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik00MCAwaC0xdjM5aC0zOXYxbTQwLTM5di0xSDJWMGgtMXY0MGg0MHoiIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyIgZmlsbC1ydWxlPSJldmVub2RkIi8+Cjwvc3ZnPg==')] opacity-30"></div>
        </div>

        <div className="max-w-6xl mx-auto px-4 relative z-10 text-center animate-fade-in-up">
          <div className="inline-flex items-center justify-center p-4 bg-white/5 rounded-2xl backdrop-blur-md mb-6 border border-white/10 shadow-2xl">
            <Trophy className="w-12 h-12 text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
            Hành Trình Thành Tích
          </h1>
          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto font-medium">
            Chinh phục các thử thách, thu thập những huy hiệu danh giá và ghi danh bảng vàng.
          </p>
        </div>
      </div>

      <div className="pb-24">
        {/* Stats Overview Overlapping the Banner */}
        {stats && (
          <div className="max-w-6xl mx-auto px-4 -mt-16 relative z-20 mb-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {[
                { label: "Huy hiệu đã đạt", value: `${stats.earned}/${stats.total}`, icon: <Award className="w-6 h-6" />, color: "text-violet-500", bg: "bg-violet-500/10", border: "border-violet-500/20" },
                { label: "Chuỗi ngày học", value: stats.streak, icon: <Flame className="w-6 h-6" />, color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20" },
                { label: "Khóa hoàn thành", value: stats.completedCourses, icon: <Target className="w-6 h-6" />, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
                { label: "Chứng chỉ", value: stats.certificates, icon: <Medal className="w-6 h-6" />, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" },
              ].map((stat, idx) => (
                <div key={idx} className="bg-card/95 backdrop-blur-xl rounded-[2rem] p-6 border border-border shadow-xl hover:-translate-y-2 transition-transform duration-300">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 ${stat.bg} ${stat.color} border ${stat.border}`}>
                    {stat.icon}
                  </div>
                  <p className="text-3xl md:text-4xl font-extrabold text-foreground mb-1">{stat.value}</p>
                  <p className="text-sm md:text-base text-muted-foreground font-semibold">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Tabs */}
          <div className="flex justify-center mb-12">
            <div className="inline-flex p-1.5 bg-muted/50 rounded-2xl backdrop-blur-sm border border-border/50 shadow-inner">
              <button 
                onClick={() => setActiveTab("tree")} 
                className={`px-6 md:px-8 py-3 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${activeTab === "tree" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
              >
                <Sparkles className="w-4 h-4" /> BỘ SƯU TẬP
              </button>
              <button 
                onClick={() => setActiveTab("leaderboard")} 
                className={`px-6 md:px-8 py-3 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${activeTab === "leaderboard" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
              >
                <Users className="w-4 h-4" /> BẢNG XẾP HẠNG
              </button>
            </div>
          </div>

          {/* Badge Tree */}
          {activeTab === "tree" && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {categories.map(cat => {
                const catBadges = badges.filter(b => b.category === cat);
                if (catBadges.length === 0) return null;
                
                const earnedCount = catBadges.filter(b => b.earned).length;
                const progressPercent = Math.round((earnedCount / catBadges.length) * 100);
                const isComplete = progressPercent === 100;

                return (
                  <div key={cat} className="bg-card rounded-[2rem] border border-border shadow-sm overflow-hidden group/panel">
                    <div className={`p-6 md:p-8 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-6 transition-colors duration-500 ${isComplete ? 'bg-emerald-500/5' : 'bg-muted/30'}`}>
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm ${isComplete ? 'bg-emerald-500/20 text-emerald-600' : 'bg-background border border-border'}`}>
                          {CATEGORY_LABELS[cat]?.split(' ')[0]}
                        </div>
                        <div>
                          <h2 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight">
                            {CATEGORY_LABELS[cat]?.substring(2).trim()}
                          </h2>
                          <p className="text-sm font-medium text-muted-foreground mt-1">
                            Thu thập {earnedCount} trên {catBadges.length} huy hiệu
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 sm:w-64">
                        <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden shadow-inner">
                          <div 
                            className={`h-full rounded-full transition-all duration-1000 ease-out ${isComplete ? 'bg-emerald-500' : 'bg-primary'}`} 
                            style={{ width: `${progressPercent}%` }} 
                          />
                        </div>
                        <span className={`text-base font-bold w-12 text-right ${isComplete ? 'text-emerald-500' : 'text-foreground'}`}>
                          {progressPercent}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="p-6 md:p-8 bg-card">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                        {catBadges.map((badge, i) => {
                          const tier = TIER_COLORS[badge.tier] || TIER_COLORS.bronze;
                          const prevBadge = i > 0 ? catBadges[i - 1] : null;
                          const isLocked = !badge.earned && prevBadge && !prevBadge.earned;

                          return (
                            <button
                              key={badge.id}
                              onClick={() => setSelectedBadge(badge)}
                              className={`relative group flex flex-col items-center p-6 rounded-3xl transition-all duration-300 w-full ${isLocked ? 'opacity-60 grayscale hover:opacity-80' : 'hover:-translate-y-2'}`}
                              style={{
                                background: badge.earned ? `linear-gradient(145deg, ${tier.bg}, var(--card))` : "var(--card)",
                                border: `1px solid ${badge.earned ? tier.border : "var(--border)"}`,
                                boxShadow: badge.earned ? `0 10px 30px -10px ${tier.glow}` : "none",
                              }}
                            >
                              {/* Badge Shape/Icon */}
                              <div className="relative w-20 h-20 mb-5 flex items-center justify-center transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6">
                                <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full drop-shadow-md transition-all duration-300" style={{ color: badge.earned ? tier.bg : "var(--muted)" }}>
                                  <polygon fill="currentColor" points="50 2 93 25 93 75 50 98 7 75 7 25"/>
                                  {badge.earned && <polygon fill="none" stroke={tier.text} strokeWidth="3" points="50 4 91 26 91 74 50 96 9 74 9 26" opacity="0.6"/>}
                                </svg>
                                <span className="relative z-10 text-3xl drop-shadow-sm" style={{ filter: isLocked ? 'grayscale(100%) opacity(50%)' : 'none' }}>
                                  {isLocked ? <Lock className="w-8 h-8 text-muted-foreground" /> : badge.icon}
                                </span>
                              </div>

                              <h3 className="text-sm font-bold text-center mb-2 line-clamp-2 min-h-[40px] flex items-center justify-center" 
                                style={{ color: badge.earned ? tier.text : "var(--foreground)" }}>
                                {badge.name}
                              </h3>
                              
                              <span className="text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-widest mb-4" 
                                style={{ background: badge.earned ? tier.bg : "var(--muted)", color: badge.earned ? tier.text : "var(--muted-foreground)", border: `1px solid ${badge.earned ? tier.border : "transparent"}` }}>
                                {TIER_LABELS[badge.tier]}
                              </span>

                              {badge.earned ? (
                                <div className="absolute -top-3 -right-3 bg-emerald-500 text-white rounded-full p-1.5 shadow-lg shadow-emerald-500/40 z-20">
                                  <CheckCircle2 className="w-5 h-5" />
                                </div>
                              ) : !isLocked ? (
                                <div className="w-full mt-auto">
                                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                    <div className="h-full rounded-full transition-all" style={{ width: `${badge.progress}%`, background: tier.textLight }} />
                                  </div>
                                  <p className="text-[10px] text-center mt-2 text-muted-foreground font-semibold uppercase tracking-wider">{badge.progress}%</p>
                                </div>
                              ) : (
                                <div className="w-full mt-auto pt-2">
                                  <p className="text-[10px] text-center text-muted-foreground font-semibold flex items-center justify-center gap-1 uppercase tracking-wider">
                                    <Lock className="w-3 h-3" /> Đang khóa
                                  </p>
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
            </div>
          )}

          {/* Leaderboard */}
          {activeTab === "leaderboard" && (
            <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="bg-card rounded-[2rem] border border-border shadow-xl overflow-hidden">
                <div className="p-8 md:p-10 border-b border-border bg-gradient-to-r from-violet-600/10 via-fuchsia-600/10 to-amber-500/10 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Crown className="w-40 h-40" />
                  </div>
                  <h2 className="text-3xl font-black text-foreground flex items-center gap-3 relative z-10">
                    <Crown className="w-8 h-8 text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]" /> 
                    Bảng Vàng Danh Dự
                  </h2>
                  <p className="text-muted-foreground mt-3 font-medium text-lg relative z-10">Vinh danh những cá nhân xuất sắc nhất nền tảng.</p>
                </div>

                <div className="p-4 md:p-8">
                  {leaderboard.length === 0 ? (
                    <div className="text-center py-16">
                      <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <p className="text-muted-foreground font-medium text-lg">Chưa có dữ liệu xếp hạng</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {leaderboard.map((entry, i) => {
                        const isMe = entry.id === user?.id;
                        const isTop3 = i < 3;
                        const rankColors = [
                          "bg-gradient-to-br from-yellow-400/20 to-yellow-600/20 text-yellow-600 border-yellow-500/30",
                          "bg-gradient-to-br from-slate-300/20 to-slate-500/20 text-slate-500 border-slate-400/30",
                          "bg-gradient-to-br from-amber-600/20 to-amber-800/20 text-amber-700 border-amber-600/30"
                        ];
                        const defaultRankColor = "bg-muted text-muted-foreground border-transparent";
                        const rankColor = isTop3 ? rankColors[i] : defaultRankColor;

                        return (
                          <button 
                            key={entry.id}
                            onClick={() => !isMe && fetchUserProfile(entry.id)}
                            className={`w-full flex items-center gap-4 md:gap-6 p-4 md:p-5 rounded-2xl transition-all duration-300 border text-left group
                              ${isMe ? 'border-primary/50 shadow-md shadow-primary/5 bg-primary/5' : 
                                isTop3 ? 'bg-card hover:bg-muted/30 shadow-sm hover:shadow-md border-border' : 
                                'bg-transparent hover:bg-muted/50 border-transparent hover:border-border/50'}`}
                          >
                            {/* Rank */}
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl border ${rankColor} shadow-sm shrink-0`}>
                              {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0 py-1">
                              <h3 className="font-bold text-foreground flex items-center gap-2 text-base md:text-lg truncate">
                                {entry.name}
                                {isMe && <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary uppercase font-black tracking-wider shrink-0">Bạn</span>}
                              </h3>
                              <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                                <span className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5 bg-background/50 px-2.5 py-1 rounded-lg">
                                  <Flame className="w-4 h-4 text-orange-500" /> {entry.streak} ngày
                                </span>
                                <span className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5 bg-background/50 px-2.5 py-1 rounded-lg">
                                  <Award className="w-4 h-4 text-violet-500" /> {entry.badgeCount} huy hiệu
                                </span>
                              </div>
                            </div>

                            {/* Mini Badges Preview */}
                            <div className="hidden sm:flex -space-x-3 shrink-0 mr-2">
                              {entry.badges.slice(0, 4).map((b, j) => (
                                <div key={j} className="w-12 h-12 rounded-full border-2 border-card flex items-center justify-center shadow-sm z-10 transition-transform group-hover:-translate-y-1" style={{background: TIER_COLORS[b.tier]?.bg, transitionDelay: `${j * 50}ms`}} title={b.name}>
                                  <span className="text-base">{b.icon}</span>
                                </div>
                              ))}
                              {entry.badges.length > 4 && (
                                <div className="w-12 h-12 rounded-full bg-muted border-2 border-card flex items-center justify-center shadow-sm z-0">
                                  <span className="text-xs font-bold text-muted-foreground">+{entry.badges.length - 4}</span>
                                </div>
                              )}
                            </div>

                            {!isMe && <ChevronRight className="w-5 h-5 text-muted-foreground opacity-30 group-hover:opacity-100 group-hover:translate-x-1 transition-all shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Badge Detail Modal */}
      {selectedBadge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedBadge(null)}>
          <div className="bg-card w-full max-w-sm rounded-[2rem] border border-border shadow-2xl p-8 animate-in zoom-in-95 duration-200 text-center relative overflow-hidden" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedBadge(null)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-muted hover:bg-muted/80 text-muted-foreground transition-colors">
              <X className="w-4 h-4" />
            </button>
            
            <div className="w-28 h-28 mx-auto mb-6 flex items-center justify-center text-5xl relative">
              <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full drop-shadow-xl" style={{ color: selectedBadge.earned ? TIER_COLORS[selectedBadge.tier]?.bg : "var(--muted)" }}>
                <polygon fill="currentColor" points="50 2 93 25 93 75 50 98 7 75 7 25"/>
                {selectedBadge.earned && <polygon fill="none" stroke={TIER_COLORS[selectedBadge.tier]?.text} strokeWidth="3" points="50 4 91 26 91 74 50 96 9 74 9 26" opacity="0.6"/>}
              </svg>
              <span className="relative z-10">{selectedBadge.icon}</span>
            </div>
            
            <h3 className="text-2xl font-black mb-2 text-foreground">{selectedBadge.name}</h3>
            
            <span className="text-xs px-3 py-1.5 rounded-full font-bold uppercase tracking-widest inline-block mb-4"
              style={{ background: TIER_COLORS[selectedBadge.tier]?.bg, color: TIER_COLORS[selectedBadge.tier]?.text, border: `1px solid ${TIER_COLORS[selectedBadge.tier]?.border}` }}>
              {TIER_LABELS[selectedBadge.tier]}
            </span>
            
            <p className="text-base text-muted-foreground font-medium mb-8 leading-relaxed">{selectedBadge.description}</p>

            {selectedBadge.earned ? (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <p className="text-base font-bold text-emerald-600 flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-5 h-5" /> Đã đạt huy hiệu!
                </p>
                {selectedBadge.earnedAt && (
                  <p className="text-xs mt-2 text-emerald-600/70 font-semibold">
                    Khai mở vào {new Date(selectedBadge.earnedAt).toLocaleDateString("vi-VN")}
                  </p>
                )}
              </div>
            ) : (
              <div className="bg-muted/50 p-4 rounded-2xl">
                <div className="flex justify-between text-xs font-bold mb-2 text-muted-foreground uppercase tracking-wider">
                  <span>Tiến độ</span>
                  <span style={{ color: TIER_COLORS[selectedBadge.tier]?.text }}>{selectedBadge.progress}%</span>
                </div>
                <div className="h-2.5 bg-muted rounded-full overflow-hidden shadow-inner">
                  <div className="h-full rounded-full" style={{ width: `${selectedBadge.progress}%`, background: TIER_COLORS[selectedBadge.tier]?.textLight }} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* User Profile Modal */}
      {(userProfile || profileLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => { setUserProfile(null); setProfileLoading(false); }}>
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-card rounded-[2.5rem] shadow-2xl border border-border animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            {profileLoading ? (
              <div className="flex flex-col items-center justify-center py-32">
                <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground font-medium">Đang tải hồ sơ...</p>
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
                <div className="relative pb-8">
                  {/* Premium Header */}
                  <div className="h-40 w-full relative" style={{ background: `linear-gradient(135deg, ${tierColor.bg}, var(--muted))` }}>
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik00MCAwaC0xdjM5aC0zOXYxbTQwLTM5di0xSDJWMGgtMXY0MGg0MHoiIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSIgZmlsbC1ydWxlPSJldmVub2RkIi8+Cjwvc3ZnPg==')] opacity-50 mix-blend-overlay"></div>
                    <button onClick={() => setUserProfile(null)} className="absolute top-6 right-6 w-10 h-10 bg-black/20 hover:bg-black/40 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-colors z-10">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="px-6 sm:px-10 relative">
                    {/* Floating Avatar */}
                    <div className="w-32 h-32 rounded-[2rem] mx-auto -mt-16 flex items-center justify-center text-6xl bg-card border-[6px] border-card shadow-2xl relative z-10" style={{ background: tierColor.bg }}>
                      {rank.emoji}
                    </div>
                    
                    {/* User Title */}
                    <div className="text-center mt-5 mb-8">
                      <h3 className="text-3xl font-black text-foreground mb-3">{userProfile.name}</h3>
                      <span className="inline-flex items-center px-5 py-2 rounded-xl text-sm font-black uppercase tracking-widest shadow-sm" style={{ background: tierColor.bg, color: tierColor.text, border: `1px solid ${tierColor.border}` }}>
                        {rank.label}
                      </span>
                    </div>
                    
                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
                      {[
                        { label: "Huy hiệu", value: userProfile.stats.badgeCount, icon: <Award className="w-4 h-4" />, color: "text-violet-500", bg: "bg-violet-500/10" },
                        { label: "Chuỗi ngày", value: `${userProfile.streak}`, icon: <Flame className="w-4 h-4" />, color: "text-orange-500", bg: "bg-orange-500/10" },
                        { label: "Khóa học", value: userProfile.stats.completedCourses, icon: <Target className="w-4 h-4" />, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                        { label: "Chứng chỉ", value: userProfile.stats.certificates, icon: <Medal className="w-4 h-4" />, color: "text-amber-500", bg: "bg-amber-500/10" },
                      ].map(s => (
                        <div key={s.label} className="text-center p-4 rounded-2xl bg-muted/50 border border-border">
                          <div className={`w-8 h-8 rounded-lg mx-auto flex items-center justify-center mb-2 ${s.bg} ${s.color}`}>
                            {s.icon}
                          </div>
                          <p className="text-xl font-extrabold text-foreground">{s.value}</p>
                          <p className="text-[10px] uppercase font-bold text-muted-foreground mt-1 tracking-wider">{s.label}</p>
                        </div>
                      ))}
                    </div>
                    
                    {/* Collections */}
                    <div className="space-y-8">
                      <h4 className="font-black text-foreground text-xl flex items-center gap-3">
                        <Trophy className="w-6 h-6 text-yellow-500" /> Bộ Sưu Tập Huy Hiệu
                      </h4>
                      
                      {userProfile.badges.length === 0 ? (
                        <div className="bg-muted/30 rounded-2xl p-8 text-center border border-dashed border-border">
                          <p className="text-muted-foreground font-medium">Người dùng này chưa có huy hiệu nào.</p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {Object.entries(groupedBadges).map(([cat, catBadges]) => (
                            <div key={cat} className="bg-muted/20 rounded-2xl p-5 border border-border/50">
                              <p className="text-xs font-bold mb-4 text-muted-foreground uppercase tracking-widest">
                                {CATEGORY_LABELS[cat] || cat}
                              </p>
                              <div className="flex flex-wrap gap-3">
                                {catBadges.map((b, j) => {
                                  const tc = TIER_COLORS[b.tier] || TIER_COLORS.bronze;
                                  return (
                                    <div key={j} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card shadow-sm hover:scale-105 transition-transform"
                                      style={{ border: `1px solid ${tc.border}` }}
                                      title={b.description}>
                                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg" style={{ background: tc.bg }}>
                                        {b.icon}
                                      </div>
                                      <span className="text-sm font-bold pr-1" style={{ color: tc.text }}>{b.name}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-10 pt-6 text-center border-t border-border">
                      <p className="text-sm font-medium text-muted-foreground bg-muted inline-block px-4 py-1.5 rounded-full">
                        Gia nhập từ tháng {new Date(userProfile.joinedAt).toLocaleDateString("vi-VN", { month: "long", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
