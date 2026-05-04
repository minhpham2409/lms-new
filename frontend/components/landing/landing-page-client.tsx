"use client";

import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import {
  GraduationCap, BookOpen, Users, Award, Play, ArrowRight, Zap, Star,
  Shield, BarChart3, Clock, CheckCircle2, ChevronRight, Sparkles,
  Target, TrendingUp, Brain, Laptop,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

/* ------------------------------------------------------------------ */
/*  Animated counter                                                   */
/* ------------------------------------------------------------------ */
function Counter({ end, suffix = "", duration = 2000 }: { end: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const step = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * end));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

/* ------------------------------------------------------------------ */
/*  Reveal on scroll                                                   */
/* ------------------------------------------------------------------ */
function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(32px)",
        transition: `opacity 0.7s cubic-bezier(.4,0,.2,1) ${delay}ms, transform 0.7s cubic-bezier(.4,0,.2,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* ================================================================== */
/*  Main Landing Page                                                  */
/* ================================================================== */
export function LandingPageClient() {
  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <Navbar />

      {/* ===================== HERO ===================== */}
      <section className="relative min-h-[92vh] flex items-center overflow-hidden pt-16">
        {/* Background orbs */}
        <div className="orb orb-violet w-[600px] h-[600px] -top-40 -left-60 opacity-40" />
        <div className="orb orb-cyan w-[500px] h-[500px] top-1/3 right-[-200px] opacity-30" />
        <div className="orb orb-blue w-[400px] h-[400px] bottom-[-100px] left-1/4 opacity-20" />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left — Text */}
            <div>
              <Reveal>
                <div className="section-tag mb-6">
                  <Sparkles className="w-3.5 h-3.5" />
                  Nền tảng LMS thế hệ mới
                </div>
              </Reveal>

              <Reveal delay={100}>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight mb-6">
                  Học tập <span className="gradient-text">thông minh,</span>
                  <br />
                  tiến bộ{" "}
                  <span className="relative inline-block">
                    <span className="gradient-text-cyan">mỗi ngày</span>
                    <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none">
                      <path d="M2 8 C50 2, 150 2, 198 8" stroke="url(#grad)" strokeWidth="3" strokeLinecap="round" />
                      <defs>
                        <linearGradient id="grad" x1="0" y1="0" x2="200" y2="0" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#7c3aed" />
                          <stop offset="1" stopColor="#0891b2" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </span>
                </h1>
              </Reveal>

              <Reveal delay={200}>
                <p className="text-lg leading-relaxed mb-8 max-w-lg" style={{ color: "#8892a4" }}>
                  HọcLộ Trình kết nối giáo viên, học sinh và phụ huynh trên một nền tảng duy nhất.
                  Video bài giảng, bài tập tương tác, theo dõi tiến độ — tất cả trong tầm tay.
                </p>
              </Reveal>

              <Reveal delay={300}>
                <div className="flex flex-wrap items-center gap-4 mb-10">
                  <Link href="/auth/register" className="btn-primary text-base px-8 py-3.5">
                    <Zap className="w-5 h-5" />
                    Bắt đầu miễn phí
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link href="/courses" className="btn-secondary text-base px-6 py-3.5">
                    <Play className="w-4 h-4" />
                    Xem khóa học
                  </Link>
                </div>
              </Reveal>

              <Reveal delay={400}>
                <div className="flex items-center gap-6">
                  {/* Avatars */}
                  <div className="flex -space-x-3">
                    {["#7c3aed", "#0891b2", "#f59e0b", "#10b981"].map((bg, i) => (
                      <div
                        key={i}
                        className="w-9 h-9 rounded-full border-2 flex items-center justify-center text-xs font-bold text-white"
                        style={{ background: bg, borderColor: "var(--background)" }}
                      >
                        {["M", "A", "T", "H"][i]}
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="flex items-center gap-1 mb-0.5">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                      ))}
                      <span className="text-sm font-semibold ml-1">4.9</span>
                    </div>
                    <p className="text-xs" style={{ color: "#8892a4" }}>
                      Được tin dùng bởi <strong style={{ color: "#f1f5ff" }}>10,000+</strong> học sinh
                    </p>
                  </div>
                </div>
              </Reveal>
            </div>

            {/* Right — Hero visual */}
            <Reveal delay={200}>
              <div className="relative hidden lg:block">
                {/* Main card */}
                <div
                  className="glass-card rounded-3xl p-8 relative"
                  style={{ boxShadow: "0 40px 100px rgba(124,58,237,0.15)" }}
                >
                  {/* Course preview card */}
                  <div className="glass rounded-2xl p-5 mb-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="feature-icon w-10 h-10 rounded-xl">
                        <Brain className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold">Toán học nâng cao</h3>
                        <p className="text-xs" style={{ color: "#8892a4" }}>12 bài học • 4.5 giờ</p>
                      </div>
                      <span className="badge badge-success ml-auto">Đang học</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: "68%" }} />
                    </div>
                    <p className="text-xs mt-2" style={{ color: "#8892a4" }}>Hoàn thành 68%</p>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Bài học", value: "24", icon: BookOpen, color: "#7c3aed" },
                      { label: "Bài tập", value: "18", icon: Target, color: "#0891b2" },
                      { label: "Điểm TB", value: "8.5", icon: TrendingUp, color: "#10b981" },
                    ].map(({ label, value, icon: Icon, color }) => (
                      <div key={label} className="glass rounded-xl p-3 text-center">
                        <Icon className="w-5 h-5 mx-auto mb-1" style={{ color }} />
                        <p className="text-lg font-bold">{value}</p>
                        <p className="text-[10px]" style={{ color: "#8892a4" }}>{label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Floating notification */}
                <div
                  className="absolute -top-4 -right-6 glass-card rounded-2xl p-4 float"
                  style={{ maxWidth: 200, boxShadow: "0 16px 48px rgba(0,0,0,0.4)" }}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(16,185,129,0.2)" }}>
                      <CheckCircle2 className="w-4 h-4" style={{ color: "#10b981" }} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold">Hoàn thành!</p>
                      <p className="text-[10px]" style={{ color: "#8892a4" }}>Bài 8: Hình học</p>
                    </div>
                  </div>
                </div>

                {/* Floating badge */}
                <div
                  className="absolute -bottom-3 -left-6 glass-card rounded-2xl p-4 float float-delay-1"
                  style={{ maxWidth: 180, boxShadow: "0 16px 48px rgba(0,0,0,0.4)" }}
                >
                  <div className="flex items-center gap-2">
                    <Award className="w-8 h-8" style={{ color: "#f59e0b" }} />
                    <div>
                      <p className="text-xs font-semibold">Chứng chỉ mới</p>
                      <p className="text-[10px]" style={{ color: "#8892a4" }}>Toán cơ bản</p>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ===================== STATS ===================== */}
      <section className="relative py-20">
        <div className="divider mb-16" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { value: 10000, suffix: "+", label: "Học sinh", icon: Users, color: "#7c3aed" },
              { value: 500, suffix: "+", label: "Khóa học", icon: BookOpen, color: "#0891b2" },
              { value: 200, suffix: "+", label: "Giáo viên", icon: GraduationCap, color: "#f59e0b" },
              { value: 95, suffix: "%", label: "Hài lòng", icon: Star, color: "#10b981" },
            ].map(({ value, suffix, label, icon: Icon, color }, i) => (
              <Reveal key={label} delay={i * 100}>
                <div className="stat-card group cursor-default">
                  <Icon
                    className="w-8 h-8 mx-auto mb-3 transition-transform duration-300 group-hover:scale-110"
                    style={{ color }}
                  />
                  <p className="text-3xl lg:text-4xl font-extrabold mb-1">
                    <Counter end={value} suffix={suffix} />
                  </p>
                  <p className="text-sm" style={{ color: "#8892a4" }}>{label}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== FEATURES ===================== */}
      <section className="py-24 relative">
        <div className="orb orb-violet w-[400px] h-[400px] top-0 right-[-100px] opacity-20" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <Reveal>
            <div className="text-center mb-16">
              <div className="section-tag mx-auto mb-4">
                <Zap className="w-3.5 h-3.5" /> Tính năng nổi bật
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
                Mọi thứ bạn cần,{" "}
                <span className="gradient-text">trong một nền tảng</span>
              </h2>
              <p className="text-lg max-w-2xl mx-auto" style={{ color: "#8892a4" }}>
                Thiết kế dành riêng cho học sinh cấp 2 với giao diện hiện đại, dễ sử dụng
              </p>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Play, title: "Video bài giảng HD",
                desc: "Xem bài giảng chất lượng cao, tua nhanh, ghi chú ngay trên video.",
                gradient: "linear-gradient(135deg, #7c3aed, #4f46e5)",
              },
              {
                icon: Target, title: "Bài tập tương tác",
                desc: "Trắc nghiệm tự chấm điểm, bài tập nộp online, phản hồi tức thì.",
                gradient: "linear-gradient(135deg, #0891b2, #06b6d4)",
              },
              {
                icon: BarChart3, title: "Theo dõi tiến độ",
                desc: "Dashboard thông minh hiển thị tiến độ, điểm số, thời gian học tập.",
                gradient: "linear-gradient(135deg, #10b981, #059669)",
              },
              {
                icon: Shield, title: "Phụ huynh giám sát",
                desc: "Phụ huynh theo dõi con em qua tài khoản riêng, nhận báo cáo định kỳ.",
                gradient: "linear-gradient(135deg, #f59e0b, #d97706)",
              },
              {
                icon: Award, title: "Chứng chỉ hoàn thành",
                desc: "Nhận chứng chỉ khi hoàn thành khóa học, động lực phấn đấu.",
                gradient: "linear-gradient(135deg, #ec4899, #db2777)",
              },
              {
                icon: Laptop, title: "Học mọi lúc mọi nơi",
                desc: "Giao diện responsive, học trên máy tính, tablet hay điện thoại đều mượt.",
                gradient: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
              },
            ].map(({ icon: Icon, title, desc, gradient }, i) => (
              <Reveal key={title} delay={i * 80}>
                <div className="card-base card-hover group h-full">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110"
                    style={{ background: gradient, boxShadow: `0 8px 24px ${gradient.includes("7c3aed") ? "rgba(124,58,237,0.3)" : "rgba(0,0,0,0.3)"}` }}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "#8892a4" }}>{desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== HOW IT WORKS ===================== */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-16">
              <div className="section-tag mx-auto mb-4">
                <Target className="w-3.5 h-3.5" /> Cách hoạt động
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
                Bắt đầu trong{" "}
                <span className="gradient-text">3 bước đơn giản</span>
              </h2>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Đăng ký tài khoản", desc: "Tạo tài khoản miễn phí chỉ với email. Chọn vai trò: học sinh, giáo viên hoặc phụ huynh.", color: "#7c3aed" },
              { step: "02", title: "Chọn khóa học", desc: "Khám phá kho khóa học đa dạng theo môn, lớp. Đăng ký khóa miễn phí hoặc mua khóa premium.", color: "#0891b2" },
              { step: "03", title: "Bắt đầu học", desc: "Xem video, làm bài tập, nhận chứng chỉ. Theo dõi tiến độ trên dashboard cá nhân.", color: "#10b981" },
            ].map(({ step, title, desc, color }, i) => (
              <Reveal key={step} delay={i * 120}>
                <div className="relative text-center group">
                  <div
                    className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center text-2xl font-extrabold transition-transform duration-300 group-hover:scale-110"
                    style={{ background: `${color}22`, border: `2px solid ${color}44`, color }}
                  >
                    {step}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{title}</h3>
                  <p className="text-sm leading-relaxed max-w-xs mx-auto" style={{ color: "#8892a4" }}>{desc}</p>

                  {/* Connector arrow for desktop */}
                  {i < 2 && (
                    <div className="hidden md:block absolute top-8 right-[-32px]">
                      <ChevronRight className="w-6 h-6" style={{ color: "#8892a4", opacity: 0.3 }} />
                    </div>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== CTA ===================== */}
      <section className="py-24 relative overflow-hidden">
        <div className="orb orb-violet w-[500px] h-[500px] top-[-100px] left-1/2 -translate-x-1/2 opacity-30" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <Reveal>
            <div
              className="glass-card rounded-3xl p-10 sm:p-16 text-center relative overflow-hidden"
              style={{ boxShadow: "0 40px 120px rgba(124,58,237,0.15)" }}
            >
              <div
                className="absolute top-0 left-0 right-0 h-px"
                style={{ background: "linear-gradient(to right, transparent, rgba(124,58,237,0.5), transparent)" }}
              />

              <div className="section-tag mx-auto mb-6">
                <Sparkles className="w-3.5 h-3.5" /> Sẵn sàng chưa?
              </div>

              <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
                Bắt đầu hành trình <span className="gradient-text">học tập</span> ngay hôm nay
              </h2>
              <p className="text-lg mb-8 max-w-xl mx-auto" style={{ color: "#8892a4" }}>
                Tham gia cùng hàng nghìn học sinh đang cải thiện kết quả mỗi ngày.
                Hoàn toàn miễn phí để bắt đầu.
              </p>

              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/auth/register" className="btn-primary text-base px-8 py-4">
                  <Zap className="w-5 h-5" />
                  Tạo tài khoản miễn phí
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/courses" className="btn-secondary text-base px-6 py-4">
                  Khám phá khóa học
                </Link>
              </div>

              <div className="mt-8 flex items-center justify-center gap-6 flex-wrap">
                {["Miễn phí đăng ký", "Không cần thẻ", "Hủy bất cứ lúc nào"].map((t) => (
                  <div key={t} className="flex items-center gap-1.5 text-sm" style={{ color: "#8892a4" }}>
                    <CheckCircle2 className="w-4 h-4" style={{ color: "#10b981" }} />
                    {t}
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <Footer />
    </div>
  );
}
