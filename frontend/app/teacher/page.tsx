"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/components/auth/auth-state";
import {
  BookOpen, Users, DollarSign, TrendingUp, Plus, Eye, Edit, Star,
  BarChart3, MessageCircle, Clock, FileText, Play, Trash2, Upload,
  Calendar, ArrowUpRight, CheckCircle2, Settings, CreditCard, Building2, Send,
} from "lucide-react";

const myCourses = [
  { id: "1", title: "Toán học cơ bản — Lớp 6", students: 1250, rating: 4.9, revenue: 0, status: "published", lessons: 24, completion: 73, color: "#7c3aed" },
  { id: "2", title: "Vật lý nâng cao — Lớp 8", students: 870, rating: 4.8, revenue: 173130000, status: "published", lessons: 18, completion: 65, color: "#3b82f6" },
  { id: "7", title: "Toán nâng cao — Lớp 7", students: 0, rating: 0, revenue: 0, status: "draft", lessons: 5, completion: 0, color: "#f59e0b" },
];

const recentReviews = [
  { user: "Nguyễn A", course: "Toán lớp 6", rating: 5, text: "Bài giảng rất dễ hiểu, cảm ơn thầy!", time: "2h trước" },
  { user: "Trần B", course: "Vật lý lớp 8", rating: 4, text: "Nội dung tốt nhưng cần thêm bài tập", time: "5h trước" },
  { user: "Lê C", course: "Toán lớp 6", rating: 5, text: "Con học tiến bộ rõ rệt", time: "1 ngày" },
];

const recentQuestions = [
  { user: "Phạm D", course: "Toán lớp 6", text: "Thầy ơi phần phân số khó quá ạ", time: "30 phút", answered: false },
  { user: "Hoàng E", course: "Vật lý lớp 8", text: "Bài tập chương 3 con làm sai câu 5", time: "2h", answered: false },
  { user: "Ngô F", course: "Toán lớp 6", text: "Con cảm ơn thầy đã giải thích!", time: "3h", answered: true },
];

type Tab = "overview" | "courses" | "analytics" | "reviews" | "settings";

export default function TeacherPage() {
  const router = useRouter();
  const { user, isLoggedIn, loading } = useAuth();
  const [tab, setTab] = useState<Tab>("overview");
  const [bankName, setBankName] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [bankOwner, setBankOwner] = useState("");
  const [replyText, setReplyText] = useState<Record<number, string>>({});
  const [repliedQuestions, setRepliedQuestions] = useState<number[]>([]);

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
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
        <div className="w-8 h-8 border-2 border-[#0891b2] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const displayName = user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : user?.username || "Giáo viên";

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "overview", label: "Tổng quan", icon: BarChart3 },
    { id: "courses", label: "Khóa học", icon: BookOpen },
    { id: "analytics", label: "Phân tích", icon: TrendingUp },
    { id: "reviews", label: "Đánh giá & Hỏi đáp", icon: MessageCircle },
    { id: "settings", label: "Cài đặt", icon: Settings },
  ];

  const handleReply = (qi: number) => {
    if (replyText[qi]?.trim()) {
      setRepliedQuestions([...repliedQuestions, qi]);
      setReplyText({ ...replyText, [qi]: "" });
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <Navbar />
      <div className="pt-20 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-extrabold mb-1">Giáo viên Dashboard</h1>
              <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>Xin chào, <span className="gradient-text font-bold">{displayName}</span></p>
            </div>
            <Link href="/teacher/courses/new" className="btn-primary text-sm"><Plus className="w-4 h-4" /> Tạo khóa học</Link>
          </div>

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
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[
                  { label: "Khóa học", value: "3", icon: BookOpen, color: "#7c3aed", sub: "2 đã xuất bản" },
                  { label: "Tổng học sinh", value: "2,120", icon: Users, color: "#0891b2", sub: "↑ 48 tuần này" },
                  { label: "Doanh thu", value: "173M ₫", icon: DollarSign, color: "#10b981", sub: "↑ 12% vs tháng trước" },
                  { label: "Đánh giá TB", value: "4.85", icon: Star, color: "#f59e0b", sub: "156 đánh giá" },
                ].map(({ label, value, icon: Icon, color, sub }) => (
                  <div key={label} className="card-base">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
                        <Icon className="w-5 h-5" style={{ color }} />
                      </div>
                      <ArrowUpRight className="w-4 h-4" style={{ color: "#10b981" }} />
                    </div>
                    <p className="text-2xl font-extrabold">{value}</p>
                    <p className="text-xs mt-1" style={{ color: "var(--foreground-muted)" }}>{label}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: "var(--foreground-muted)" }}>{sub}</p>
                  </div>
                ))}
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                {/* Recent questions */}
                <div className="card-base">
                  <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" style={{ color: "#7c3aed" }} /> Câu hỏi mới ({recentQuestions.filter((q) => !q.answered).length} chưa trả lời)
                  </h3>
                  <div className="space-y-3">
                    {recentQuestions.map((q, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: q.answered ? "transparent" : "var(--muted)", border: q.answered ? "none" : "1px solid rgba(124,58,237,0.15)" }}>
                        <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white" style={{ background: q.answered ? "rgba(124,58,237,0.3)" : "#7c3aed" }}>{q.user.charAt(0)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-semibold">{q.user}</span>
                            <span className="text-[10px]" style={{ color: "var(--foreground-muted)" }}>{q.course} • {q.time}</span>
                          </div>
                          <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>{q.text}</p>
                        </div>
                        {(q.answered || repliedQuestions.includes(i)) ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: "#10b981" }} /> : (
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <input
                              value={replyText[i] || ""}
                              onChange={(e) => setReplyText({ ...replyText, [i]: e.target.value })}
                              placeholder="Trả lời..."
                              className="input-base text-[10px] py-1 px-2 w-32"
                              onKeyDown={(e) => e.key === "Enter" && handleReply(i)}
                            />
                            <button onClick={() => handleReply(i)} className="btn-primary text-[10px] px-2 py-1"><Send className="w-3 h-3" /></button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Revenue chart */}
                <div className="card-base">
                  <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" style={{ color: "#10b981" }} /> Doanh thu 7 ngày qua
                  </h3>
                  <div className="flex items-end gap-3 h-40">
                    {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((d, i) => {
                      const h = [55, 72, 48, 85, 65, 35, 45];
                      return (
                        <div key={d} className="flex-1 flex flex-col items-center gap-1">
                          <div className="w-full rounded-lg" style={{ height: `${h[i]}%`, background: `linear-gradient(to top, #10b981, #0891b2)`, opacity: 0.7, minHeight: 8 }} />
                          <span className="text-[10px]" style={{ color: "var(--foreground-muted)" }}>{d}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          )}

          {tab === "courses" && (
            <div className="card-base overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr style={{ borderBottom: "1px solid var(--border)" }}>
                    {["Khóa học", "Trạng thái", "Bài học", "Học sinh", "Hoàn thành TB", "Đánh giá", "Doanh thu", ""].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: "var(--foreground-muted)" }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {myCourses.map((c) => (
                      <tr key={c.id} className="transition-colors hover:bg-[var(--muted)]" style={{ borderBottom: "1px solid var(--border)" }}>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${c.color}18` }}><BookOpen className="w-5 h-5" style={{ color: c.color }} /></div>
                            <span className="font-semibold">{c.title}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5"><span className={`badge ${c.status === "published" ? "badge-success" : "badge-warning"} text-[10px]`}>{c.status === "published" ? "Xuất bản" : "Nháp"}</span></td>
                        <td className="px-4 py-3.5">{c.lessons}</td>
                        <td className="px-4 py-3.5">{c.students.toLocaleString()}</td>
                        <td className="px-4 py-3.5">{c.completion > 0 ? <><div className="w-16 progress-bar inline-block align-middle mr-2"><div className="progress-fill" style={{ width: `${c.completion}%` }} /></div><span className="text-xs">{c.completion}%</span></> : "—"}</td>
                        <td className="px-4 py-3.5">{c.rating > 0 ? `⭐ ${c.rating}` : "—"}</td>
                        <td className="px-4 py-3.5" style={{ color: "#10b981" }}>{c.revenue > 0 ? `${(c.revenue / 1000000).toFixed(0)}M ₫` : "Miễn phí"}</td>
                        <td className="px-4 py-3.5"><div className="flex gap-1">
                          <Link href={`/teacher/courses/${c.id}`} className="btn-ghost px-2 py-1"><Edit className="w-3.5 h-3.5" /></Link>
                          <button className="btn-ghost px-2 py-1"><Eye className="w-3.5 h-3.5" /></button>
                        </div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "analytics" && (
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="card-base">
                <h3 className="font-bold mb-4 flex items-center gap-2"><Users className="w-4 h-4" style={{ color: "#0891b2" }} /> Học sinh mới (30 ngày)</h3>
                <div className="flex items-end gap-1 h-40">
                  {Array.from({ length: 30 }, (_, i) => ({ h: 20 + Math.sin(i * 0.4) * 25 + Math.random() * 30 })).map((d, i) => (
                    <div key={i} className="flex-1 rounded-t" style={{ height: `${d.h}%`, background: i === 29 ? "linear-gradient(to top, #0891b2, #7c3aed)" : "rgba(8,145,178,0.2)", minHeight: 4 }} />
                  ))}
                </div>
              </div>
              <div className="card-base">
                <h3 className="font-bold mb-4">Thống kê chi tiết</h3>
                <div className="space-y-4">
                  {[
                    { label: "Tổng lượt xem video", value: "45,230", change: "+15%" },
                    { label: "Thời gian xem TB", value: "12.5 phút", change: "+8%" },
                    { label: "Tỷ lệ hoàn thành bài tập", value: "78%", change: "+3%" },
                    { label: "Tỷ lệ hài lòng", value: "94%", change: "+2%" },
                  ].map(({ label, value, change }) => (
                    <div key={label} className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid var(--border)" }}>
                      <span className="text-sm" style={{ color: "var(--foreground-muted)" }}>{label}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{value}</span>
                        <span className="text-xs" style={{ color: "#10b981" }}>{change}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === "reviews" && (
            <div className="space-y-4">
              {recentReviews.map((r, i) => (
                <div key={i} className="card-base flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold text-white" style={{ background: "rgba(124,58,237,0.4)" }}>{r.user.charAt(0)}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">{r.user}</span>
                      <span className="text-xs" style={{ color: "var(--foreground-muted)" }}>{r.course} • {r.time}</span>
                    </div>
                    <div className="flex gap-0.5 mb-2">{Array.from({ length: 5 }, (_, j) => <Star key={j} className="w-3.5 h-3.5" style={{ color: j < r.rating ? "#f59e0b" : "var(--border)" , fill: j < r.rating ? "#f59e0b" : "none" }} />)}</div>
                    <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>{r.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "settings" && (
            <div className="space-y-6">
              {/* Bank Account Settings */}
              <div className="card-base">
                <h3 className="font-bold mb-5 flex items-center gap-2">
                  <CreditCard className="w-5 h-5" style={{ color: "#7c3aed" }} /> Cài đặt tài khoản ngân hàng
                </h3>
                <p className="text-sm mb-5" style={{ color: "var(--foreground-muted)" }}>
                  Thông tin này sẽ được dùng để tạo mã QR thanh toán gửi cho phụ huynh khi học sinh đăng ký khóa học trả phí.
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Ngân hàng</label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--foreground-muted)" }} />
                      <select value={bankName} onChange={(e) => setBankName(e.target.value)} className="input-base pl-9">
                        <option value="">Chọn ngân hàng</option>
                        <option value="VCB">Vietcombank (VCB)</option>
                        <option value="TCB">Techcombank (TCB)</option>
                        <option value="MB">MB Bank</option>
                        <option value="ACB">ACB</option>
                        <option value="VPB">VPBank</option>
                        <option value="BIDV">BIDV</option>
                        <option value="VTB">VietinBank</option>
                        <option value="TPB">TPBank</option>
                        <option value="MSB">MSB</option>
                        <option value="SHB">SHB</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Số tài khoản</label>
                    <input
                      value={bankAccount} onChange={(e) => setBankAccount(e.target.value)}
                      className="input-base" placeholder="VD: 1234567890"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Tên chủ tài khoản</label>
                    <input
                      value={bankOwner} onChange={(e) => setBankOwner(e.target.value)}
                      className="input-base" placeholder="VD: NGUYEN VAN MINH"
                    />
                  </div>

                  {/* QR Preview */}
                  {bankName && bankAccount && bankOwner && (
                    <div className="p-5 rounded-xl text-center" style={{ background: "var(--muted)", border: "1px solid var(--border)" }}>
                      <p className="text-xs font-semibold mb-3" style={{ color: "var(--foreground-muted)" }}>Xem trước mã QR thanh toán</p>
                      <div className="w-48 h-48 mx-auto rounded-2xl flex items-center justify-center" style={{ background: "white" }}>
                        <img
                          src={`https://img.vietqr.io/image/${bankName}-${bankAccount}-compact.png?accountName=${encodeURIComponent(bankOwner)}`}
                          alt="QR Code"
                          className="w-44 h-44 object-contain"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      </div>
                      <p className="text-xs mt-3" style={{ color: "var(--foreground-muted)" }}>
                        {bankName} • {bankAccount} • {bankOwner}
                      </p>
                    </div>
                  )}

                  <button className="btn-primary">
                    <CreditCard className="w-4 h-4" /> Lưu thông tin ngân hàng
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
