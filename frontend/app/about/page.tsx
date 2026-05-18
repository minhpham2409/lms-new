"use client";

import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { GraduationCap, Users, BookOpen, Award, Heart, Globe, Target, Zap, CheckCircle2, ArrowRight } from "lucide-react";

const STATS = [
  { value: "10,000+", label: "Học sinh tin dùng", icon: Users, color: "#a435f0" },
  { value: "500+", label: "Khóa học chất lượng", icon: BookOpen, color: "#0891b2" },
  { value: "200+", label: "Giáo viên uy tín", icon: GraduationCap, color: "#10b981" },
  { value: "98%", label: "Học sinh hài lòng", icon: Award, color: "#f59e0b" },
];

const VALUES = [
  { icon: Heart, title: "Tận tâm với học sinh", desc: "Chúng tôi đặt lợi ích và trải nghiệm của học sinh lên hàng đầu trong mọi quyết định.", color: "#ec4899" },
  { icon: Target, title: "Chất lượng nội dung", desc: "Mỗi khóa học được biên soạn kỹ lưỡng bởi các giáo viên giàu kinh nghiệm.", color: "#a435f0" },
  { icon: Globe, title: "Tiếp cận mọi nơi", desc: "Bất kỳ ai, ở bất cứ đâu đều có thể học tập chất lượng cao với chi phí hợp lý.", color: "#0891b2" },
  { icon: Zap, title: "Công nghệ hiện đại", desc: "Ứng dụng công nghệ AI và gamification để cá nhân hóa hành trình học tập.", color: "#f59e0b" },
];

const BENEFITS = [
  "Hơn 500 khóa học từ các môn học cấp THCS và THPT",
  "Video chất lượng HD với phụ đề tiếng Việt",
  "Bài tập tương tác và quiz kiểm tra kiến thức",
  "Chứng chỉ hoàn thành được xác nhận",
  "Theo dõi tiến độ chi tiết theo thời gian thực",
  "Hệ thống phụ huynh theo dõi kết quả con em",
  "Giáo viên được hỗ trợ công cụ dạy học chuyên nghiệp",
  "Thi đua tháng với phần thưởng hấp dẫn",
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#1c1d1f]">
      <Navbar />

      {/* =================== HERO =================== */}
      <section className="pt-28 pb-16 border-b border-[#d1d7dc] dark:border-[#3e4143]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#f3f0ff] dark:bg-[rgba(164,53,240,0.15)] border border-[#e9e0ff] dark:border-[rgba(164,53,240,0.3)] rounded text-xs font-bold text-[#5624d0] dark:text-[#c0a5f7] mb-5">
                <GraduationCap className="w-3.5 h-3.5" /> Về chúng tôi
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-5 text-[#2d2f31] dark:text-white">
                Sứ mệnh đổi mới <span style={{ background: "linear-gradient(135deg,#a435f0,#5624d0)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>giáo dục Việt Nam</span>
              </h1>
              <p className="text-base leading-relaxed text-[#6a6f73] mb-8 max-w-lg">
                HọcLộ Trình ra đời với khát vọng mang công nghệ hiện đại vào giáo dục,
                giúp học sinh Việt Nam tiếp cận kiến thức chất lượng cao mọi lúc, mọi nơi.
                Chúng tôi tin rằng mọi học sinh đều xứng đáng được học tập tốt nhất.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/courses" className="inline-flex items-center gap-2 px-6 py-3 bg-[#a435f0] hover:bg-[#8710d8] text-white font-bold text-sm transition-colors rounded">
                  Khám phá khóa học <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/teachers" className="inline-flex items-center gap-2 px-6 py-3 border border-[#2d2f31] dark:border-white text-[#2d2f31] dark:text-white font-bold text-sm hover:bg-[#f7f9fa] dark:hover:bg-[#3e4143] transition-colors rounded">
                  Gặp gỡ giáo viên
                </Link>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="grid grid-cols-2 gap-4">
                {STATS.map(({ value, label, icon: Icon, color }) => (
                  <div key={label} className="bg-white dark:bg-[#2d2f31] border border-[#d1d7dc] dark:border-[#3e4143] rounded p-6 text-center hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ background: `${color}15` }}>
                      <Icon className="w-6 h-6" style={{ color }} />
                    </div>
                    <p className="text-2xl font-bold text-[#2d2f31] dark:text-white">{value}</p>
                    <p className="text-xs text-[#6a6f73] mt-1">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =================== STATS (mobile) =================== */}
      <section className="lg:hidden py-10 bg-[#f7f9fa] dark:bg-[#2d2f31] border-b border-[#d1d7dc] dark:border-[#3e4143]">
        <div className="max-w-[1200px] mx-auto px-4">
          <div className="grid grid-cols-2 gap-4">
            {STATS.map(({ value, label, icon: Icon, color }) => (
              <div key={label} className="bg-white dark:bg-[#1c1d1f] border border-[#d1d7dc] dark:border-[#3e4143] rounded p-5 text-center">
                <Icon className="w-6 h-6 mx-auto mb-2" style={{ color }} />
                <p className="text-xl font-bold text-[#2d2f31] dark:text-white">{value}</p>
                <p className="text-xs text-[#6a6f73] mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =================== VALUES =================== */}
      <section className="py-16 sm:py-20">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-sm font-bold text-[#6a6f73] uppercase tracking-wider mb-3">Giá trị cốt lõi</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#2d2f31] dark:text-white">
              Những gì làm chúng tôi khác biệt
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {VALUES.map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="bg-white dark:bg-[#2d2f31] border border-[#d1d7dc] dark:border-[#3e4143] p-6 text-center rounded hover:shadow-md transition-shadow group">
                <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center transition-transform group-hover:scale-110" style={{ background: `${color}15` }}>
                  <Icon className="w-7 h-7" style={{ color }} />
                </div>
                <h3 className="text-base font-bold mb-2 text-[#2d2f31] dark:text-white">{title}</h3>
                <p className="text-sm text-[#6a6f73] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =================== BENEFITS =================== */}
      <section className="py-16 bg-[#f7f9fa] dark:bg-[#2d2f31] border-y border-[#d1d7dc] dark:border-[#3e4143]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-sm font-bold text-[#6a6f73] uppercase tracking-wider mb-3">Tính năng nổi bật</p>
              <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-[#2d2f31] dark:text-white">
                Mọi thứ bạn cần để học tốt hơn
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {BENEFITS.map((benefit) => (
                  <div key={benefit} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#10b981]" />
                    <span className="text-sm text-[#2d2f31] dark:text-[#b0b5b9]">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white dark:bg-[#1c1d1f] border border-[#d1d7dc] dark:border-[#3e4143] rounded p-8">
              <h3 className="text-lg font-bold mb-6 text-[#2d2f31] dark:text-white">Câu chuyện của chúng tôi</h3>
              <div className="space-y-4 text-sm text-[#6a6f73] leading-relaxed">
                <p>
                  HọcLộ Trình được thành lập năm 2024 bởi nhóm kỹ sư và giáo viên với đam mê cải thiện chất lượng giáo dục tại Việt Nam.
                </p>
                <p>
                  Chúng tôi nhận thấy rằng dù công nghệ phát triển mạnh mẽ, nhiều học sinh ở vùng nông thôn và các gia đình khó khăn vẫn không có cơ hội tiếp cận giáo dục chất lượng.
                </p>
                <p>
                  Với sứ mệnh "Giáo dục cho mọi người", chúng tôi xây dựng một nền tảng nơi học sinh có thể học từ những giáo viên tốt nhất, bất kể ở đâu.
                </p>
              </div>
              <div className="mt-6 pt-6 border-t border-[#d1d7dc] dark:border-[#3e4143]">
                <Link href="/contact" className="inline-flex items-center gap-2 text-sm font-bold text-[#5624d0] dark:text-[#c0a5f7] hover:underline">
                  Liên hệ với chúng tôi <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =================== CTA =================== */}
      <section className="py-16 sm:py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-[#2d2f31] dark:text-white">
            Sẵn sàng bắt đầu hành trình học tập?
          </h2>
          <p className="text-base text-[#6a6f73] mb-8">
            Tham gia cùng hơn 10,000 học sinh đang học tập mỗi ngày trên HọcLộ Trình
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/auth/register" className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#a435f0] hover:bg-[#8710d8] text-white font-bold transition-colors rounded">
              Đăng ký miễn phí <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/courses" className="inline-flex items-center gap-2 px-8 py-3.5 border border-[#2d2f31] dark:border-white text-[#2d2f31] dark:text-white font-bold hover:bg-[#f7f9fa] dark:hover:bg-[#3e4143] transition-colors rounded">
              Xem khóa học
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
