"use client";

import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { GraduationCap, Users, BookOpen, Award, Heart, Globe, Target, Sparkles } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <Navbar />

      <section className="pt-28 pb-16 relative overflow-hidden">
        <div className="orb orb-violet w-[400px] h-[400px] -top-40 left-[-100px] opacity-30" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <div className="section-tag mx-auto mb-4">
            <Sparkles className="w-3.5 h-3.5" /> Về chúng tôi
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-6">
            Sứ mệnh <span className="gradient-text">đổi mới giáo dục</span>
          </h1>
          <p className="text-lg leading-relaxed max-w-2xl mx-auto" style={{ color: "#8892a4" }}>
            HọcLộ Trình ra đời với khát vọng mang công nghệ hiện đại vào giáo dục,
            giúp học sinh Việt Nam tiếp cận kiến thức chất lượng cao mọi lúc, mọi nơi.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Heart, title: "Tận tâm", desc: "Đặt lợi ích học sinh lên hàng đầu", color: "#ec4899" },
              { icon: Target, title: "Chất lượng", desc: "Nội dung được biên soạn kỹ lưỡng", color: "#7c3aed" },
              { icon: Globe, title: "Tiếp cận", desc: "Ai cũng có thể học, ở bất cứ đâu", color: "#0891b2" },
              { icon: Award, title: "Minh bạch", desc: "Tiến độ học tập rõ ràng, công khai", color: "#10b981" },
            ].map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="card-base card-hover text-center">
                <div
                  className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                  style={{ background: `${color}22`, border: `1px solid ${color}44` }}
                >
                  <Icon className="w-7 h-7" style={{ color }} />
                </div>
                <h3 className="text-lg font-bold mb-2">{title}</h3>
                <p className="text-sm" style={{ color: "#8892a4" }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className="glass-card rounded-3xl p-10 grid sm:grid-cols-3 gap-8 text-center"
            style={{ boxShadow: "0 30px 80px rgba(124,58,237,0.1)" }}
          >
            {[
              { value: "10,000+", label: "Học sinh tin dùng", icon: Users },
              { value: "500+", label: "Khóa học chất lượng", icon: BookOpen },
              { value: "200+", label: "Giáo viên uy tín", icon: GraduationCap },
            ].map(({ value, label, icon: Icon }) => (
              <div key={label}>
                <Icon className="w-8 h-8 mx-auto mb-3" style={{ color: "#7c3aed" }} />
                <p className="text-3xl font-extrabold mb-1">{value}</p>
                <p className="text-sm" style={{ color: "#8892a4" }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
