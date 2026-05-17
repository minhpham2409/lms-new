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
    <footer className="bg-[#2d2f31] border-t border-[#3e4143]">
      <div className="max-w-[1340px] mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-[#5624d0] rounded-full flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg text-white">
                HọcLộ Trình
              </span>
            </Link>
            <p className="text-sm leading-relaxed mb-5 max-w-xs text-[#b0b5b9]">
              Nền tảng học tập thông minh kết nối giáo viên, học sinh và phụ huynh.
              Mang lại trải nghiệm giáo dục hiện đại, cá nhân hóa.
            </p>
            {/* Social links */}
            <div className="flex items-center gap-2">
              {[Facebook, Youtube, Twitter, Github].map((Icon, i) => (
                <button
                  key={i}
                  className="w-8 h-8 rounded flex items-center justify-center transition-colors text-[#b0b5b9] hover:text-white hover:bg-[#3e4143]"
                >
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.values(footerLinks).map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-bold mb-3 text-white">
                {section.title}
              </h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-[#b0b5b9] hover:text-white transition-colors"
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
        <div className="border-t border-[#3e4143] pt-6 mb-6 flex flex-col sm:flex-row gap-4">
          {[
            { icon: Mail, text: "providminh24092004@gmail.com" },
            { icon: Phone, text: "0916 869 648" },
            { icon: MapPin, text: "TP. Hồ Chí Minh, Việt Nam" },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2 text-sm text-[#b0b5b9]">
              <Icon className="w-4 h-4 flex-shrink-0 text-[#6a6f73]" />
              <span>{text}</span>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-[#3e4143] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#6a6f73]">
            © 2026 HọcLộ Trình. Tất cả quyền được bảo lưu.
          </p>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-[#16a34a]" />
            <span className="text-xs text-[#6a6f73]">
              Hệ thống hoạt động bình thường
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
