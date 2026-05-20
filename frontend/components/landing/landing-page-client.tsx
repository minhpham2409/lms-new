"use client";

import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import {
  GraduationCap, BookOpen, Users, Award, Play, ArrowRight, Star,
  Shield, BarChart3, CheckCircle2, ChevronRight, Sparkles,
  Target, TrendingUp, Brain, Laptop, Clock, Globe, Zap,
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
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* ================================================================== */
/*  Main Landing Page - Udemy-inspired                                 */
/* ================================================================== */
export function LandingPageClient() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#1c1d1f]">
      <Navbar />

      {/* ===================== HERO BANNER ===================== */}
      <section className="relative pt-16">
        <div className="w-full bg-gradient-to-r from-[#e0f7f5] via-[#c5f0ec] to-[#a8e8e0] dark:from-[#1a2332] dark:via-[#1e2a3a] dark:to-[#1c2635]">
          <div className="max-w-[1340px] mx-auto relative">
            {/* Banner image full width */}
            <div className="w-full">
              <img
                src="/images/hero_banner_pro.png"
                alt="Học trực tuyến"
                className="w-full h-[280px] sm:h-[350px] md:h-[400px] lg:h-[480px] object-cover object-center shadow-md"
              />
            </div>

            {/* Floating text card - Udemy style */}
            <div className="absolute top-8 sm:top-12 lg:top-16 left-4 sm:left-8 lg:left-12 z-10">
              <div className="bg-white dark:bg-[#2d2f31] shadow-2xl p-6 sm:p-8 max-w-[420px] rounded-lg border border-gray-100 dark:border-gray-700">
                <h1 className="text-2xl sm:text-3xl lg:text-[2.1rem] font-extrabold leading-tight mb-3 text-gray-900 dark:text-white">
                  Nền tảng học tập hàng đầu
                </h1>
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                  Khóa học chất lượng cao dành cho học sinh cấp 2. Học từ những giáo viên xuất sắc nhất, mọi lúc mọi nơi.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== TRUSTED BY ===================== */}
      <section className="py-10 bg-[#f7f9fa] dark:bg-[#2d2f31] border-y border-[#d1d7dc] dark:border-[#3e4143]">
        <div className="max-w-[1340px] mx-auto px-4 text-center">
          <p className="text-sm font-bold text-gray-600 dark:text-gray-400 mb-6 uppercase tracking-wider">
            Được tin tưởng bởi hơn 10,000+ học sinh và phụ huynh trên toàn quốc
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-70">
            <div className="flex items-center gap-2 font-bold text-lg text-[#6a6f73]"><Shield className="w-7 h-7"/>EduTrust</div>
            <div className="flex items-center gap-2 font-bold text-lg text-[#6a6f73]"><Star className="w-7 h-7"/>TopScore</div>
            <div className="flex items-center gap-2 font-bold text-lg text-[#6a6f73]"><Zap className="w-7 h-7"/>FastLearn</div>
            <div className="flex items-center gap-2 font-bold text-lg text-[#6a6f73]"><Brain className="w-7 h-7"/>SmartKids</div>
          </div>
        </div>
      </section>

      {/* ===================== COURSE SELECTION ===================== */}
      <section className="py-12 sm:py-16">
        <div className="max-w-[1340px] mx-auto px-4 sm:px-8">
          <Reveal>
            <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-[#2d2f31] dark:text-white">
              Lựa chọn khóa học đa dạng
            </h2>
            <p className="text-base font-medium text-gray-600 dark:text-gray-300 mb-6 max-w-3xl">
              Chọn từ hàng trăm khóa học video trực tuyến với nội dung mới được cập nhật hàng tháng
            </p>
          </Reveal>

          {/* Tabs - Udemy style */}
          <Reveal delay={100}>
            <div className="flex gap-0 border-b border-[#d1d7dc] dark:border-[#3e4143] overflow-x-auto hide-scrollbar mb-6">
              {['Toán học', 'Vật lý', 'Hóa học', 'Ngữ văn', 'Tiếng Anh', 'Lập trình'].map((tab, i) => (
                <button
                  key={tab}
                  className={`text-base font-bold pb-3 px-4 whitespace-nowrap transition-colors ${i === 0 ? 'text-[#2d2f31] dark:text-white border-b-2 border-[#2d2f31] dark:border-white' : 'text-[#6a6f73] hover:text-[#2d2f31] dark:hover:text-white'}`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </Reveal>

          {/* Course highlight box */}
          <Reveal delay={200}>
            <div className="border border-[#d1d7dc] dark:border-[#3e4143] p-6 sm:p-8 rounded">
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-2 text-[#2d2f31] dark:text-white">Đạt điểm cao môn Toán cùng các chuyên gia</h3>
                <p className="font-medium text-gray-700 dark:text-gray-300 max-w-2xl text-sm">
                  Toán học không hề khô khan khi bạn hiểu được bản chất. Khám phá các khóa học từ cơ bản đến nâng cao.
                </p>
                <Link href="/courses" className="inline-block mt-3 text-sm font-bold text-[#5624d0] dark:text-[#c0a5f7] hover:text-[#401b9c] underline">
                  Khám phá Toán học →
                </Link>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                {[
                  { title: 'Toán Đại Số 9 - Ôn thi vào 10', author: 'Thầy Trần Văn A', rating: 4.8, students: 1240, price: '499.000₫', oldPrice: '899.000₫', img: '/images/course_thumbnail_pro.png' },
                  { title: 'Hình học phẳng nâng cao', author: 'Cô Nguyễn Thị B', rating: 4.9, students: 850, price: '599.000₫', oldPrice: '999.000₫', img: '/images/course_thumbnail_pro.png' },
                  { title: 'Luyện đề Toán 9 tổng hợp', author: 'Thầy Lê Văn C', rating: 4.7, students: 2100, price: '399.000₫', oldPrice: '699.000₫', img: '/images/course_thumbnail_pro.png' },
                  { title: 'Toán Cơ bản 8 - Lấy lại gốc', author: 'Thầy Trần Văn A', rating: 4.6, students: 530, price: '299.000₫', oldPrice: '599.000₫', img: '/images/course_thumbnail_pro.png' },
                ].map((course, i) => (
                  <Link href="/courses" key={i} className="group cursor-pointer">
                    {/* Course thumbnail */}
                    <div className="w-full aspect-video bg-[#2d2f31] mb-3 overflow-hidden border border-[#d1d7dc] dark:border-[#3e4143] relative">
                      <img src={course.img} alt={course.title} className="w-full h-full object-cover opacity-80" />
                      <div className="absolute inset-0 bg-gradient-to-tr from-[#5624d0]/30 to-[#a435f0]/20 group-hover:opacity-80 transition-opacity" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play className="w-5 h-5 text-[#2d2f31] ml-0.5" />
                        </div>
                      </div>
                    </div>
                    <h4 className="font-bold text-sm leading-tight mb-1 text-[#2d2f31] dark:text-white line-clamp-2 group-hover:text-[#5624d0] dark:group-hover:text-[#c0a5f7] transition-colors">{course.title}</h4>
                    <p className="text-xs text-[#6a6f73] mb-1">{course.author}</p>
                    <div className="flex items-center gap-1 mb-1">
                      <span className="font-bold text-sm text-[#b4690e]">{course.rating}</span>
                      <div className="flex">
                        {[1,2,3,4,5].map(s => <Star key={s} className="w-3 h-3 fill-[#e59819] text-[#e59819]" />)}
                      </div>
                      <span className="text-[#6a6f73] text-xs">({course.students.toLocaleString()})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base text-[#2d2f31] dark:text-white">{course.price}</span>
                      <span className="text-sm text-[#6a6f73] line-through">{course.oldPrice}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===================== TOP CATEGORIES ===================== */}
      <section className="py-12 sm:py-16 bg-[#f7f9fa] dark:bg-[#2d2f31]">
        <div className="max-w-[1340px] mx-auto px-4 sm:px-8">
          <Reveal>
            <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-[#2d2f31] dark:text-white">Danh mục hàng đầu</h2>
          </Reveal>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
            {[
              { name: "Toán học", icon: Target, img: "/images/icon_math_1779005322247.png" },
              { name: "Khoa học", icon: Globe, img: "/images/icon_science_1779005339255.png" },
              { name: "Ngữ Văn", icon: BookOpen, color: "#e59819" },
              { name: "Tiếng Anh", icon: Globe, color: "#16a34a" },
              { name: "Lập trình", icon: Laptop, color: "#5624d0" },
              { name: "Lịch sử", icon: Clock, color: "#ef4444" },
              { name: "Địa lý", icon: Globe, color: "#0891b2" },
              { name: "Giáo dục công dân", icon: Shield, color: "#f59e0b" },
            ].map((cat, i) => (
              <Reveal key={cat.name} delay={i * 80}>
                <Link href="/courses" className="group">
                  <div className="bg-white dark:bg-[#1c1d1f] border border-[#d1d7dc] dark:border-[#3e4143] p-5 text-center hover:shadow-md transition-shadow rounded">
                    <div className="w-16 h-16 mx-auto mb-3 rounded-full overflow-hidden flex items-center justify-center bg-[#f7f9fa] dark:bg-[#2d2f31]">
                      {cat.img ? (
                        <img src={cat.img} alt={cat.name} className="w-12 h-12 object-contain" />
                      ) : (
                        <cat.icon className="w-7 h-7" style={{ color: cat.color || "#5624d0" }} />
                      )}
                    </div>
                    <h3 className="font-bold text-sm text-[#2d2f31] dark:text-white group-hover:text-[#5624d0] dark:group-hover:text-[#c0a5f7] transition-colors">{cat.name}</h3>
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
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-[#2d2f31] dark:text-white">
                  Tại sao học sinh chọn LumiLearn?
                </h2>

                <div className="space-y-7">
                  {[
                    { icon: Play, title: "Học theo tốc độ của bạn", desc: "Truy cập trọn đời vào khóa học. Tua lại, tạm dừng, xem lại bất cứ lúc nào.", color: "#5624d0" },
                    { icon: CheckCircle2, title: "Bài tập tự luyện & thi thử", desc: "Ngân hàng câu hỏi lớn. Chấm điểm tự động và giải thích chi tiết ngay lập tức.", color: "#16a34a" },
                    { icon: Award, title: "Chứng chỉ hoàn thành", desc: "Nhận chứng chỉ cho mỗi khóa học. Chia sẻ thành tích dễ dàng.", color: "#e59819" },
                    { icon: Users, title: "Phụ huynh theo dõi", desc: "Báo cáo minh bạch, phụ huynh nắm bắt tiến độ con em mọi lúc.", color: "#0891b2" },
                  ].map(({ icon: Icon, title, desc, color }) => (
                    <div key={title} className="flex gap-4">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}15` }}>
                        <Icon className="w-6 h-6" style={{ color }} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold mb-1 text-[#2d2f31] dark:text-white">{title}</h3>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300 leading-relaxed">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            <Reveal delay={200}>
              <div className="relative shadow-2xl rounded-xl border-4 border-white dark:border-gray-800">
                <div className="rounded-lg overflow-hidden">
                  <img src="/images/hero_banner_pro.png" alt="Platform Demo" className="w-full aspect-[4/3] object-cover" />
                  <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform shadow-xl">
                      <Play className="w-7 h-7 text-[#2d2f31] ml-1" />
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ===================== STATS ===================== */}
      <section className="py-12 bg-[#f7f9fa] dark:bg-[#2d2f31] border-y border-[#d1d7dc] dark:border-[#3e4143]">
        <div className="max-w-[1340px] mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: 500, suffix: "+", label: "Khóa học" },
              { value: 10000, suffix: "+", label: "Học sinh" },
              { value: 200, suffix: "+", label: "Giáo viên" },
              { value: 98, suffix: "%", label: "Hài lòng" },
            ].map(({ value, suffix, label }) => (
              <Reveal key={label}>
                <div>
                  <p className="text-3xl sm:text-4xl font-extrabold text-[#2d2f31] dark:text-white mb-1">
                    <Counter end={value} suffix={suffix} />
                  </p>
                  <p className="text-sm font-bold text-gray-600 dark:text-gray-300">{label}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== CTA ===================== */}
      <section className="py-16 sm:py-20 bg-[#2d2f31] dark:bg-[#1c1d1f]">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <Reveal>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-white">
              Sẵn sàng để bứt phá điểm số?
            </h2>
            <p className="text-base sm:text-lg mb-8 text-[#b0b5b9] max-w-xl mx-auto">
              Tham gia cùng hàng nghìn học sinh đang cải thiện kết quả mỗi ngày.
            </p>
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-2 bg-[#a435f0] hover:bg-[#8710d8] text-white font-bold text-base px-8 py-3.5 transition-colors rounded"
            >
              Đăng ký miễn phí <ArrowRight className="w-5 h-5" />
            </Link>
          </Reveal>
        </div>
      </section>

      <Footer />
    </div>
  );
}
