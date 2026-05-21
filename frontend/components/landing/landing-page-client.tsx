"use client";

import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { useEffect, useRef, useState } from "react";

/* ── Counter ── */
function Counter({ end, suffix = "", duration = 2000 }: { end: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        const t0 = performance.now();
        const step = (now: number) => {
          const p = Math.min((now - t0) / duration, 1);
          setCount(Math.floor((1 - Math.pow(1 - p, 3)) * end));
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

/* ── Reveal ── */
function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [v, setV] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setV(true); }, { threshold: 0.1 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className={className}
      style={{ opacity: v ? 1 : 0, transform: v ? "none" : "translateY(20px)", transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms` }}>
      {children}
    </div>
  );
}

/* ================================================================ */
export function LandingPageClient() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Navbar />

      {/* ═══════ HERO ═══════ */}
      <section className="relative pt-16 overflow-hidden">
        <div className="relative min-h-[600px] lg:min-h-[680px] flex items-center"
          style={{ background: "linear-gradient(160deg, #051025 0%, #0A1A35 40%, #121E36 100%)" }}>

          {/* Hero image — full background */}
          <div className="absolute inset-0">
            <img src="/images/hero_star_light.png" alt="LumiLearn" className="w-full h-full object-cover object-center opacity-60" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(5,16,37,0.7) 0%, rgba(5,16,37,0.4) 40%, rgba(5,16,37,0.1) 100%)" }} />
          </div>

          {/* Content */}
          <div className="relative z-10 max-w-[1200px] mx-auto px-6 sm:px-10 py-24 lg:py-32">
            <div className="max-w-[560px]">
              <p className="text-xs font-bold uppercase tracking-[0.2em] mb-6" style={{ color: "#F8B486" }}>
                Nền tảng học tập hàng đầu Việt Nam
              </p>

              <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold leading-[1.1] mb-6" style={{ color: "#F8FAFC" }}>
                Bứt phá điểm số<br />
                với <span style={{ color: "#F8B486" }}>LumiLearn</span>
              </h1>

              <p className="text-base sm:text-lg leading-relaxed mb-10 max-w-[460px]" style={{ color: "#94A3B8" }}>
                Khóa học chất lượng cao dành cho học sinh cấp 2. Học từ những giáo viên xuất sắc nhất, mọi lúc mọi nơi — hoàn toàn cá nhân hóa.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link href="/auth/register"
                  className="px-8 py-3.5 rounded-lg font-bold text-sm transition-all hover:-translate-y-0.5"
                  style={{ background: "#F8B486", color: "#051025" }}>
                  Bắt đầu miễn phí →
                </Link>
                <Link href="/courses"
                  className="px-8 py-3.5 rounded-lg font-bold text-sm transition-all hover:-translate-y-0.5"
                  style={{ border: "1.5px solid rgba(248,180,134,0.4)", color: "#F8B486" }}>
                  Khám phá khóa học
                </Link>
              </div>

              {/* Social proof — text only */}
              <div className="mt-10 flex items-center gap-6" style={{ color: "#94A3B8" }}>
                <div>
                  <span className="text-2xl font-extrabold block" style={{ color: "#F8B486" }}>4.9★</span>
                  <span className="text-xs">Đánh giá trung bình</span>
                </div>
                <div className="w-px h-8" style={{ background: "#1E2D4A" }} />
                <div>
                  <span className="text-2xl font-extrabold block" style={{ color: "#F8FAFC" }}>10K+</span>
                  <span className="text-xs">Học sinh tin tưởng</span>
                </div>
                <div className="w-px h-8" style={{ background: "#1E2D4A" }} />
                <div>
                  <span className="text-2xl font-extrabold block" style={{ color: "#F8FAFC" }}>500+</span>
                  <span className="text-xs">Khóa học</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ STATS BAR ═══════ */}
      <section className="relative -mt-6 z-20 max-w-[1200px] mx-auto px-6 sm:px-10">
        <div className="glass-card rounded-2xl p-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { value: 500, suffix: "+", label: "Khóa học", color: "var(--primary)" },
            { value: 10000, suffix: "+", label: "Học sinh", color: "var(--foreground)" },
            { value: 200, suffix: "+", label: "Giáo viên", color: "var(--primary)" },
            { value: 98, suffix: "%", label: "Hài lòng", color: "var(--foreground)" },
          ].map(({ value, suffix, label, color }) => (
            <div key={label} className="text-center">
              <p className="text-3xl font-extrabold" style={{ color }}><Counter end={value} suffix={suffix} /></p>
              <p className="text-xs font-semibold mt-1" style={{ color: "var(--muted-foreground)" }}>{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════ CATEGORIES ═══════ */}
      <section className="py-20">
        <div className="max-w-[1200px] mx-auto px-6 sm:px-10">
          <Reveal>
            <p className="text-xs font-bold uppercase tracking-[0.15em] mb-2" style={{ color: "var(--primary)" }}>Danh mục</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-3">Lựa chọn khóa học đa dạng</h2>
            <p className="text-sm mb-10 max-w-lg" style={{ color: "var(--muted-foreground)" }}>Chọn từ hàng trăm khóa học video với nội dung cập nhật hàng tháng</p>
          </Reveal>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {["Toán học", "Khoa học", "Ngữ Văn", "Tiếng Anh", "Lập trình", "Lịch sử", "Địa lý", "GDCD"].map((name, i) => (
              <Reveal key={name} delay={i * 50}>
                <Link href="/courses" className="group block">
                  <div className="card-base card-hover text-center py-6 cursor-pointer">
                    <h3 className="font-bold text-sm group-hover:text-[var(--primary)] transition-colors">{name}</h3>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ FEATURED COURSES ═══════ */}
      <section className="py-20" style={{ background: "var(--background-2)" }}>
        <div className="max-w-[1200px] mx-auto px-6 sm:px-10">
          <Reveal>
            <div className="flex items-center justify-between mb-10">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.15em] mb-2" style={{ color: "var(--primary)" }}>Nổi bật</p>
                <h2 className="text-2xl sm:text-3xl font-extrabold">Khóa học được yêu thích</h2>
              </div>
              <Link href="/courses" className="hidden sm:inline text-sm font-bold transition-colors hover:opacity-80" style={{ color: "var(--primary)" }}>
                Xem tất cả →
              </Link>
            </div>
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { title: "Toán Đại Số 9 — Ôn thi vào 10", author: "Thầy Trần Văn A", rating: "4.8", students: "1,240", price: "499.000₫", old: "899.000₫" },
              { title: "Hình học phẳng nâng cao lớp 9", author: "Cô Nguyễn Thị B", rating: "4.9", students: "850", price: "599.000₫", old: "999.000₫" },
              { title: "Luyện đề Toán 9 tổng hợp", author: "Thầy Lê Văn C", rating: "4.7", students: "2,100", price: "399.000₫", old: "699.000₫" },
              { title: "Toán Cơ bản 8 — Lấy lại gốc", author: "Thầy Trần Văn A", rating: "4.6", students: "530", price: "299.000₫", old: "599.000₫" },
            ].map((c, i) => (
              <Reveal key={i} delay={i * 80}>
                <Link href="/courses" className="group block course-card">
                  <div className="w-full aspect-video relative overflow-hidden rounded-t-[14px]" style={{ background: "var(--muted)" }}>
                    <img src="/images/hero_star_light.png" alt={c.title} className="w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-500" />
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md text-[10px] font-bold" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>Bán chạy</span>
                  </div>
                  <div className="p-4">
                    <h4 className="font-bold text-sm leading-snug mb-1 line-clamp-2 group-hover:text-[var(--primary)] transition-colors">{c.title}</h4>
                    <p className="text-xs mb-2" style={{ color: "var(--muted-foreground)" }}>{c.author}</p>
                    <p className="text-xs mb-2" style={{ color: "var(--primary)" }}>{c.rating}★ · {c.students} học sinh</p>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm" style={{ color: "var(--primary)" }}>{c.price}</span>
                      <span className="text-xs line-through" style={{ color: "var(--muted-foreground)" }}>{c.old}</span>
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ WHY CHOOSE US ═══════ */}
      <section className="py-20">
        <div className="max-w-[1200px] mx-auto px-6 sm:px-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <Reveal>
              <p className="text-xs font-bold uppercase tracking-[0.15em] mb-2" style={{ color: "var(--primary)" }}>Tại sao chọn chúng tôi?</p>
              <h2 className="text-2xl sm:text-3xl font-extrabold mb-8">Học tập thông minh hơn, kết quả tốt hơn</h2>
              <div className="space-y-6">
                {[
                  { title: "Học theo tốc độ của bạn", desc: "Truy cập trọn đời. Tua lại, tạm dừng, xem lại bất cứ lúc nào." },
                  { title: "Bài tập & thi thử tự động", desc: "Ngân hàng câu hỏi lớn. Chấm điểm và giải thích chi tiết ngay lập tức." },
                  { title: "Chứng chỉ hoàn thành", desc: "Nhận chứng chỉ cho mỗi khóa học. Chia sẻ thành tích dễ dàng." },
                  { title: "Phụ huynh theo dõi tiến độ", desc: "Báo cáo minh bạch, nắm bắt tiến độ con em mọi lúc." },
                ].map(({ title, desc }) => (
                  <div key={title} className="group">
                    <h3 className="text-base font-bold mb-1 group-hover:text-[var(--primary)] transition-colors">{title}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{desc}</p>
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal delay={200}>
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img src="/images/lumilearn_text_banner.png" alt="LumiLearn Platform" className="w-full aspect-[4/3] object-cover" />
                <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 50%, rgba(5,16,37,0.6) 100%)" }} />
                <div className="absolute bottom-6 left-6 right-6">
                  <p className="text-sm font-bold" style={{ color: "#F8FAFC" }}>Trải nghiệm học tập hiện đại</p>
                  <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>Giao diện thân thiện, tối ưu cho mọi thiết bị.</p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ═══════ CTA ═══════ */}
      <section className="py-24 relative overflow-hidden" style={{ background: "linear-gradient(160deg, #051025 0%, #0A1A35 50%, #121E36 100%)" }}>
        <div className="absolute inset-0 dot-pattern opacity-20" />
        <div className="relative z-10 max-w-2xl mx-auto px-6 text-center">
          <Reveal>
            <p className="text-xs font-bold uppercase tracking-[0.2em] mb-4" style={{ color: "#F8B486" }}>Sẵn sàng chưa?</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4" style={{ color: "#F8FAFC" }}>
              Sẵn sàng bứt phá điểm số?
            </h2>
            <p className="text-base mb-10 max-w-lg mx-auto" style={{ color: "#94A3B8" }}>
              Tham gia cùng hàng nghìn học sinh đang cải thiện kết quả mỗi ngày.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href="/auth/register"
                className="px-10 py-4 rounded-lg font-bold text-sm transition-all hover:-translate-y-0.5"
                style={{ background: "#F8B486", color: "#051025" }}>
                Đăng ký miễn phí →
              </Link>
              <Link href="/courses"
                className="px-10 py-4 rounded-lg font-bold text-sm transition-all hover:-translate-y-0.5"
                style={{ border: "1.5px solid rgba(248,180,134,0.4)", color: "#F8B486" }}>
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
