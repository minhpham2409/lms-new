import Link from "next/link";
import { GraduationCap, Mail, Phone, MapPin, Github, Twitter, Facebook, Youtube } from "lucide-react";

const footerLinks = {
  platform: {
    title: "Nền tảng",
    links: [
      { label: "Khóa học", href: "/courses" },
      { label: "Giáo viên", href: "/teachers" },
      { label: "Chứng chỉ", href: "/certificates" },
      { label: "Blog", href: "/blog" },
    ],
  },
  support: {
    title: "Hỗ trợ",
    links: [
      { label: "Trung tâm trợ giúp", href: "/help" },
      { label: "Liên hệ", href: "/contact" },
      { label: "Điều khoản", href: "/terms" },
      { label: "Quyền riêng tư", href: "/privacy" },
    ],
  },
  roles: {
    title: "Dành cho",
    links: [
      { label: "Học sinh", href: "/for/students" },
      { label: "Giáo viên", href: "/for/teachers" },
      { label: "Phụ huynh", href: "/for/parents" },
      { label: "Nhà trường", href: "/for/schools" },
    ],
  },
};

export function Footer() {
  return (
    <footer
      className="relative mt-24 border-t"
      style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(8, 12, 20, 0.9)" }}
    >
      {/* Glow accent */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-px"
        style={{ background: "linear-gradient(to right, transparent, rgba(124,58,237,0.5), transparent)" }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #7c3aed, #0891b2)" }}
              >
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg">
                <span className="gradient-text">HọcLộ</span>
                <span style={{ color: "#f1f5ff" }}>Trình</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed mb-6 max-w-xs" style={{ color: "#8892a4" }}>
              Nền tảng học tập thông minh kết nối giáo viên, học sinh và phụ huynh.
              Mang lại trải nghiệm giáo dục hiện đại, cá nhân hóa.
            </p>
            {/* Social links */}
            <div className="flex items-center gap-2">
              {[Facebook, Youtube, Twitter, Github].map((Icon, i) => (
                <button
                  key={i}
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "#8892a4",
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget;
                    el.style.background = "rgba(124,58,237,0.2)";
                    el.style.borderColor = "rgba(124,58,237,0.3)";
                    el.style.color = "#a78bfa";
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget;
                    el.style.background = "rgba(255,255,255,0.05)";
                    el.style.borderColor = "rgba(255,255,255,0.08)";
                    el.style.color = "#8892a4";
                  }}
                >
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.values(footerLinks).map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold mb-4" style={{ color: "#f1f5ff" }}>
                {section.title}
              </h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm transition-colors duration-200"
                      style={{ color: "#8892a4" }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLAnchorElement).style.color = "#a78bfa";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLAnchorElement).style.color = "#8892a4";
                      }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Contact info */}
        <div
          className="rounded-2xl p-5 mb-8 flex flex-col sm:flex-row gap-4"
          style={{
            background: "rgba(19,26,46,0.6)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          {[
            { icon: Mail, text: "providminh24092004@gmail.com" },
            { icon: Phone, text: "0916 869 648" },
            { icon: MapPin, text: "TP. Hồ Chí Minh, Việt Nam" },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2 text-sm" style={{ color: "#8892a4" }}>
              <Icon className="w-4 h-4 flex-shrink-0" style={{ color: "#7c3aed" }} />
              <span>{text}</span>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          className="pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ borderColor: "rgba(255,255,255,0.06)" }}
        >
          <p className="text-xs" style={{ color: "#8892a4" }}>
            © 2026 HọcLộ Trình. Tất cả quyền được bảo lưu.
          </p>
          <div className="flex items-center gap-1">
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: "#10b981", boxShadow: "0 0 8px rgba(16,185,129,0.5)" }}
            />
            <span className="text-xs" style={{ color: "#8892a4" }}>
              Hệ thống hoạt động bình thường
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
