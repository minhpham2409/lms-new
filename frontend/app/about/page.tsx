"use client";

import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

const STATS = [
  { value: "10,000+", label: "Học sinh tin dùng" },
  { value: "500+", label: "Khóa học chất lượng" },
  { value: "200+", label: "Giáo viên uy tín" },
  { value: "98%", label: "Học sinh hài lòng" },
];

const VALUES = [
  { title: "Tận tâm với học sinh", desc: "Chúng tôi đặt lợi ích và trải nghiệm của học sinh lên hàng đầu trong mọi quyết định." },
  { title: "Chất lượng nội dung", desc: "Mỗi khóa học được biên soạn kỹ lưỡng bởi các giáo viên giàu kinh nghiệm." },
  { title: "Tiếp cận mọi nơi", desc: "Bất kỳ ai, ở bất cứ đâu đều có thể học tập chất lượng cao với chi phí hợp lý." },
  { title: "Công nghệ hiện đại", desc: "Ứng dụng công nghệ AI và gamification để cá nhân hóa hành trình học tập." },
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
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <Navbar />

      {/* Hero */}
      <section className="pt-28 pb-16" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="max-w-[1200px] mx-auto px-6 sm:px-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.15em] mb-4" style={{ color: "var(--primary)" }}>Về chúng tôi</p>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight mb-5">
                Sứ mệnh đổi mới <span style={{ color: "var(--primary)" }}>giáo dục Việt Nam</span>
              </h1>
              <p className="text-base leading-relaxed mb-8 max-w-lg" style={{ color: "var(--muted-foreground)" }}>
                LumiLearn ra đời với khát vọng mang công nghệ hiện đại vào giáo dục,
                giúp học sinh Việt Nam tiếp cận kiến thức chất lượng cao mọi lúc, mọi nơi.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/courses" className="px-6 py-3 rounded-lg font-bold text-sm transition-all hover:-translate-y-0.5"
                  style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>Khám phá khóa học →</Link>
                <Link href="/teachers" className="px-6 py-3 rounded-lg font-bold text-sm transition-all hover:-translate-y-0.5"
                  style={{ border: "1.5px solid var(--border)", color: "var(--foreground)" }}>Gặp gỡ giáo viên</Link>
              </div>
            </div>
            <div className="hidden lg:grid grid-cols-2 gap-4">
              {STATS.map(({ value, label }) => (
                <div key={label} className="card-base text-center py-6">
                  <p className="text-2xl font-extrabold" style={{ color: "var(--primary)" }}>{value}</p>
                  <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats mobile */}
      <section className="lg:hidden py-10" style={{ background: "var(--background-2)", borderBottom: "1px solid var(--border)" }}>
        <div className="max-w-[1200px] mx-auto px-6 grid grid-cols-2 gap-4">
          {STATS.map(({ value, label }) => (
            <div key={label} className="card-base text-center py-5">
              <p className="text-xl font-extrabold" style={{ color: "var(--primary)" }}>{value}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="py-20">
        <div className="max-w-[1200px] mx-auto px-6 sm:px-10">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-[0.15em] mb-2" style={{ color: "var(--primary)" }}>Giá trị cốt lõi</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold">Những gì làm chúng tôi khác biệt</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {VALUES.map(({ title, desc }) => (
              <div key={title} className="card-base card-hover text-center group cursor-default">
                <h3 className="text-base font-bold mb-2 group-hover:text-[var(--primary)] transition-colors">{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16" style={{ background: "var(--background-2)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div className="max-w-[1200px] mx-auto px-6 sm:px-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.15em] mb-2" style={{ color: "var(--primary)" }}>Tính năng nổi bật</p>
              <h2 className="text-2xl sm:text-3xl font-extrabold mb-6">Mọi thứ bạn cần để học tốt hơn</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {BENEFITS.map(b => (
                  <div key={b} className="flex items-start gap-2.5">
                    <span className="text-sm mt-0.5 shrink-0" style={{ color: "var(--success)" }}>✓</span>
                    <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>{b}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="card-base">
              <h3 className="text-lg font-bold mb-6">Câu chuyện của chúng tôi</h3>
              <div className="space-y-4 text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                <p>LumiLearn được thành lập năm 2024 bởi nhóm kỹ sư và giáo viên với đam mê cải thiện chất lượng giáo dục tại Việt Nam.</p>
                <p>Chúng tôi nhận thấy rằng dù công nghệ phát triển mạnh mẽ, nhiều học sinh vẫn không có cơ hội tiếp cận giáo dục chất lượng.</p>
                <p>Với sứ mệnh &quot;Giáo dục cho mọi người&quot;, chúng tôi xây dựng nền tảng nơi học sinh có thể học từ những giáo viên tốt nhất.</p>
              </div>
              <div className="mt-6 pt-6" style={{ borderTop: "1px solid var(--border)" }}>
                <Link href="/contact" className="text-sm font-bold" style={{ color: "var(--primary)" }}>Liên hệ với chúng tôi →</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold mb-4">Sẵn sàng bắt đầu?</h2>
          <p className="text-base mb-8" style={{ color: "var(--muted-foreground)" }}>Tham gia cùng hơn 10,000 học sinh đang học tập mỗi ngày</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/auth/register" className="px-8 py-3.5 rounded-lg font-bold text-sm transition-all hover:-translate-y-0.5"
              style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>Đăng ký miễn phí →</Link>
            <Link href="/courses" className="px-8 py-3.5 rounded-lg font-bold text-sm transition-all hover:-translate-y-0.5"
              style={{ border: "1.5px solid var(--border)", color: "var(--foreground)" }}>Xem khóa học</Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
