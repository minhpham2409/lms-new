"use client";

import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import {
  GraduationCap, BookOpen, Users, Award, Play, ArrowRight, Star,
  Shield, CheckCircle2, Sparkles, Target, Brain, Laptop, Clock, Globe, Zap,
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
      { threshold: 0.12 }
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
        transform: visible ? "translateY(0)" : "translateY(28px)",
        transition: `opacity 0.65s ease ${delay}ms, transform 0.65s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
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
    <div className="min-h-screen bg-[#f8f7ff] dark:bg-[#0d0b1e]">
      <Navbar />

      {/* ===================== HERO ===================== */}
      <section className="relative pt-16 overflow-hidden">
        {/* Orb decorations */}
        <div className="absolute top-20 right-[10%] w-[400px] h-[400px] orb orb-violet opacity-40 pointer-events-none" />
        <div className="absolute bottom-0 left-[5%] w-[300px] h-[300px] orb orb-teal opacity-30 pointer-events-none" />

        <div
          className="relative min-h-[520px] lg:min-h-[600px] flex items-center"
          style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #0e7490 100%)" }}
        >
          {/* Hero image */}
          <div className="absolute inset-0">
            <img
              src="/images/hero_banner_lumi.png"
              alt="LumiLearn học tập trực tuyến"
              className="w-full h-full object-cover object-center opacity-40"
            />
            <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(30,27,75,0.95) 0%, rgba(30,27,75,0.7) 50%, rgba(14,116,144,0.4) 100%)" }} />
          </div>

          {/* Dot pattern overlay */}
          <div className="absolute inset-0 dot-pattern opacity-30" />

          {/* Content */}
          <div className="relative z-10 max-w-[1340px] mx-auto px-4 sm:px-8 py-20 lg:py-28">
            <div className="max-w-[600px]">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-6 border"
                style={{ background: "rgba(129,140,248,0.15)", borderColor: "rgba(129,140,248,0.3)", color: "#a5b4fc" }}>
                <Sparkles className="w-3.5 h-3.5" />
                Nền tảng học tập hàng đầu Việt Nam
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-extrabold leading-tight text-white mb-5">
                Bứt phá điểm số với{" "}
                <span style={{ background: "linear-gradient(135deg, #a5b4fc, #22d3ee)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                  LumiLearn
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-300 leading-relaxed mb-8 max-w-[480px]">
                Khóa học chất lượng cao dành cho học sinh cấp 2. Học từ những giáo viên xuất sắc nhất, mọi lúc mọi nơi — hoàn toàn cá nhân hóa.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link href="/auth/register"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-white text-sm transition-all hover:-translate-y-0.5"
                  style={{ background: "linear-gradient(135deg, #6366f1, #7c3aed)", boxShadow: "0 6px 24px rgba(99,102,241,0.45)" }}>
                  Bắt đầu miễn phí <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/courses"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-sm transition-all hover:-translate-y-0.5"
                  style={{ background: "rgba(255,255,255,0.12)", border: "1.5px solid rgba(255,255,255,0.3)", color: "#ffffff", backdropFilter: "blur(8px)" }}>
                  <Play className="w-4 h-4" /> Khám phá khóa học
                </Link>
              </div>

              {/* Social proof */}
              <div className="flex items-center gap-4 mt-8">
                <div className="flex -space-x-2">
                  {["#6366f1","#7c3aed","#06b6d4","#f59e0b"].map((c, i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-[#1e1b4b] flex items-center justify-center text-xs font-bold text-white" style={{ background: c }}>
                      {["A","B","C","D"][i]}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map(s => <Star key={s} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
                    <span className="text-amber-400 font-bold text-sm ml-1">4.9</span>
                  </div>
                  <p className="text-slate-400 text-xs mt-0.5">10,000+ học sinh tin tưởng</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== STATS BAR ===================== */}
      <section className="relative -mt-6 z-20 max-w-[1340px] mx-auto px-4 sm:px-8">
        <div className="glass-card rounded-2xl p-6 sm:p-8 grid grid-cols-2 md:grid-cols-4 gap-6 shadow-xl">
          {[
            { value: 500, suffix: "+", label: "Khóa học", color: "#6366f1", icon: BookOpen },
            { value: 10000, suffix: "+", label: "Học sinh", color: "#7c3aed", icon: Users },
            { value: 200, suffix: "+", label: "Giáo viên", color: "#06b6d4", icon: GraduationCap },
            { value: 98, suffix: "%", label: "Hài lòng", color: "#f59e0b", icon: Star },
          ].map(({ value, suffix, label, color, icon: Icon }) => (
            <div key={label} className="text-center">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2" style={{ background: `${color}18` }}>
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold" style={{ color }}>
                <Counter end={value} suffix={suffix} />
              </p>
              <p className="text-xs font-semibold text-foreground/60 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===================== COURSE CATEGORIES ===================== */}
      <section className="py-16 sm:py-20">
        <div className="max-w-[1340px] mx-auto px-4 sm:px-8">
          <Reveal>
            <div className="text-center mb-10">
              <span className="section-tag mb-3">Danh mục</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Lựa chọn khóa học đa dạng</h2>
              <p className="text-sm text-foreground/60 mt-2 max-w-lg mx-auto">Chọn từ hàng trăm khóa học video với nội dung cập nhật hàng tháng</p>
            </div>
          </Reveal>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              { name: "Toán học", icon: Target, color: "#6366f1", bg: "#eef2ff" },
              { name: "Khoa học", icon: Brain, color: "#7c3aed", bg: "#f3f0ff" },
              { name: "Ngữ Văn", icon: BookOpen, color: "#f59e0b", bg: "#fef3c7" },
              { name: "Tiếng Anh", icon: Globe, color: "#10b981", bg: "#d1fae5" },
              { name: "Lập trình", icon: Laptop, color: "#6366f1", bg: "#eef2ff" },
              { name: "Lịch sử", icon: Clock, color: "#ef4444", bg: "#fee2e2" },
              { name: "Địa lý", icon: Globe, color: "#0891b2", bg: "#ecfeff" },
              { name: "GDCD", icon: Shield, color: "#f59e0b", bg: "#fef3c7" },
            ].map((cat, i) => (
              <Reveal key={cat.name} delay={i * 60}>
                <Link href="/courses" className="group block">
                  <div className="card-base card-hover text-center py-5 cursor-pointer"
                    style={{ borderColor: `${cat.color}22` }}>
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 transition-transform group-hover:scale-110"
                      style={{ background: cat.bg }}>
                      <cat.icon className="w-7 h-7" style={{ color: cat.color }} />
                    </div>
                    <h3 className="font-bold text-sm text-foreground group-hover:text-[#6366f1] dark:group-hover:text-[#a5b4fc] transition-colors">{cat.name}</h3>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== FEATURED COURSES ===================== */}
      <section className="py-16 sm:py-20" style={{ background: "linear-gradient(180deg, #f0effe 0%, #f8f7ff 100%)" }}>
        <div className="max-w-[1340px] mx-auto px-4 sm:px-8 dark:bg-transparent">
          <Reveal>
            <div className="flex items-center justify-between mb-10">
              <div>
                <span className="section-tag mb-2">Nổi bật</span>
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Khóa học được yêu thích</h2>
              </div>
              <Link href="/courses" className="hidden sm:inline-flex items-center gap-1 text-sm font-bold text-[#6366f1] hover:text-[#4f46e5] transition-colors">
                Xem tất cả <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { title: "Toán Đại Số 9 — Ôn thi vào 10", author: "Thầy Trần Văn A", rating: 4.8, students: 1240, price: "499.000₫", old: "899.000₫", color: "#6366f1" },
              { title: "Hình học phẳng nâng cao lớp 9", author: "Cô Nguyễn Thị B", rating: 4.9, students: 850, price: "599.000₫", old: "999.000₫", color: "#7c3aed" },
              { title: "Luyện đề Toán 9 tổng hợp", author: "Thầy Lê Văn C", rating: 4.7, students: 2100, price: "399.000₫", old: "699.000₫", color: "#06b6d4" },
              { title: "Toán Cơ bản 8 — Lấy lại gốc", author: "Thầy Trần Văn A", rating: 4.6, students: 530, price: "299.000₫", old: "599.000₫", color: "#f59e0b" },
            ].map((course, i) => (
              <Reveal key={i} delay={i * 80}>
                <Link href="/courses" className="group block course-card">
                  {/* Thumbnail */}
                  <div className="w-full aspect-video relative overflow-hidden rounded-t-2xl" style={{ background: `linear-gradient(135deg, ${course.color}22, ${course.color}44)` }}>
                    <img src="/images/hero_banner_lumi.png" alt={course.title} className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-11 h-11 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all group-hover:scale-110 shadow-lg">
                        <Play className="w-5 h-5 ml-0.5" style={{ color: course.color }} />
                      </div>
                    </div>
                    <div className="absolute top-2.5 left-2.5">
                      <span className="badge" style={{ background: `${course.color}22`, color: course.color, border: `1px solid ${course.color}40` }}>Bán chạy</span>
                    </div>
                  </div>
                  {/* Info */}
                  <div className="p-4">
                    <h4 className="font-bold text-sm leading-tight mb-1 line-clamp-2 group-hover:text-[#6366f1] dark:group-hover:text-[#a5b4fc] transition-colors">{course.title}</h4>
                    <p className="text-xs text-foreground/50 mb-2">{course.author}</p>
                    <div className="flex items-center gap-1 mb-2">
                      <span className="font-bold text-xs text-amber-500">{course.rating}</span>
                      <div className="flex">{[1,2,3,4,5].map(s => <Star key={s} className="w-3 h-3 fill-amber-400 text-amber-400" />)}</div>
                      <span className="text-foreground/40 text-xs">({course.students.toLocaleString()})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm" style={{ color: course.color }}>{course.price}</span>
                      <span className="text-xs text-foreground/40 line-through">{course.old}</span>
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== WHY CHOOSE US ===================== */}
      <section className="py-16 sm:py-20">
        <div className="max-w-[1340px] mx-auto px-4 sm:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <Reveal>
              <span className="section-tag mb-4">Tại sao chọn chúng tôi?</span>
              <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-foreground">
                Học tập thông minh hơn, kết quả tốt hơn
              </h2>
              <div className="space-y-6">
                {[
                  { icon: Play, title: "Học theo tốc độ của bạn", desc: "Truy cập trọn đời. Tua lại, tạm dừng, xem lại bất cứ lúc nào.", color: "#6366f1" },
                  { icon: CheckCircle2, title: "Bài tập & thi thử tự động", desc: "Ngân hàng câu hỏi lớn. Chấm điểm và giải thích chi tiết ngay lập tức.", color: "#10b981" },
                  { icon: Award, title: "Chứng chỉ hoàn thành", desc: "Nhận chứng chỉ cho mỗi khóa học. Chia sẻ thành tích dễ dàng.", color: "#f59e0b" },
                  { icon: Users, title: "Phụ huynh theo dõi tiến độ", desc: "Báo cáo minh bạch, nắm bắt tiến độ con em mọi lúc.", color: "#06b6d4" },
                ].map(({ icon: Icon, title, desc, color }) => (
                  <div key={title} className="flex gap-4 group">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
                      style={{ background: `${color}15` }}>
                      <Icon className="w-6 h-6" style={{ color }} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold mb-0.5 text-foreground">{title}</h3>
                      <p className="text-sm text-foreground/60 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal delay={200}>
              <div className="relative">
                {/* Decorative orbs */}
                <div className="absolute -top-8 -right-8 w-48 h-48 orb orb-violet opacity-30" />
                <div className="absolute -bottom-8 -left-8 w-40 h-40 orb orb-teal opacity-25" />
                <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white dark:border-[#2d2762]">
                  <img src="/images/hero_banner_lumi.png" alt="Platform Demo" className="w-full aspect-[4/3] object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(30,27,75,0.25)" }}>
                    <div className="w-18 h-18 bg-white/90 rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform shadow-xl p-5 glow-pulse">
                      <Play className="w-8 h-8 ml-1 text-[#6366f1]" />
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ===================== TRUSTED BY ===================== */}
      <section className="py-10 border-y border-border/50" style={{ background: "linear-gradient(135deg, #f0effe 0%, #ecfeff 100%)" }}>
        <div className="max-w-[1340px] mx-auto px-4 text-center">
          <p className="text-xs font-bold text-foreground/50 mb-6 uppercase tracking-widest">Được tin tưởng bởi các tổ chức giáo dục hàng đầu</p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
            {[
              { icon: Shield, label: "EduTrust", color: "#6366f1" },
              { icon: Star, label: "TopScore", color: "#f59e0b" },
              { icon: Zap, label: "FastLearn", color: "#7c3aed" },
              { icon: Brain, label: "SmartKids", color: "#06b6d4" },
            ].map(({ icon: Icon, label, color }) => (
              <div key={label} className="flex items-center gap-2 font-bold text-base opacity-50 hover:opacity-80 transition-opacity" style={{ color }}>
                <Icon className="w-6 h-6" />{label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== CTA ===================== */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #0e7490 100%)" }} />
        <div className="absolute inset-0 dot-pattern opacity-20" />
        <div className="absolute top-0 right-0 w-80 h-80 orb orb-violet opacity-30" />
        <div className="absolute bottom-0 left-0 w-64 h-64 orb orb-teal opacity-25" />
        <div className="relative z-10 max-w-3xl mx-auto px-4 text-center">
          <Reveal>
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center" style={{ background: "rgba(129,140,248,0.2)", border: "1px solid rgba(129,140,248,0.3)" }}>
              <GraduationCap className="w-8 h-8 text-[#a5b4fc]" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4 text-white">
              Sẵn sàng bứt phá điểm số?
            </h2>
            <p className="text-base sm:text-lg mb-8 text-slate-300 max-w-xl mx-auto">
              Tham gia cùng hàng nghìn học sinh đang cải thiện kết quả mỗi ngày.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                href="/auth/register"
                className="inline-flex items-center gap-2 font-bold text-sm px-8 py-4 rounded-xl text-white transition-all hover:-translate-y-0.5 hover:shadow-xl"
                style={{ background: "linear-gradient(135deg, #6366f1, #7c3aed)", boxShadow: "0 6px 24px rgba(99,102,241,0.45)" }}
              >
                Đăng ký miễn phí <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/courses"
                className="inline-flex items-center gap-2 font-bold text-sm px-8 py-4 rounded-xl text-white transition-all hover:-translate-y-0.5"
                style={{ background: "rgba(255,255,255,0.12)", border: "1.5px solid rgba(255,255,255,0.3)", backdropFilter: "blur(8px)" }}
              >
                Xem khóa học
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <Footer />
    </div>
  );
}
