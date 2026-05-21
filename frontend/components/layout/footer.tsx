import Link from "next/link";
import { Mail, Phone, MapPin, Github, Twitter, Facebook, Youtube, Heart } from "lucide-react";
import { Logo } from "@/components/ui/logo";

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
    <footer style={{ background: "linear-gradient(180deg, #130f2a 0%, #0d0b1e 100%)", borderTop: "1px solid rgba(45,39,98,0.8)" }}>
      <div className="max-w-[1340px] mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-block mb-5">
              <Logo />
            </Link>
            <p className="text-sm leading-relaxed mb-5 max-w-xs" style={{ color: "rgba(165,180,252,0.7)" }}>
              Nền tảng học tập thông minh kết nối giáo viên, học sinh và phụ huynh.
              Mang lại trải nghiệm giáo dục hiện đại, cá nhân hóa.
            </p>
            {/* Social links */}
            <div className="flex items-center gap-2">
              {[
                { Icon: Facebook, color: "#818cf8" },
                { Icon: Youtube, color: "#f87171" },
                { Icon: Twitter, color: "#22d3ee" },
                { Icon: Github, color: "#a78bfa" },
              ].map(({ Icon, color }, i) => (
                <button
                  key={i}
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:-translate-y-0.5 hover:shadow-lg"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = `${color}22`; (e.currentTarget as HTMLButtonElement).style.borderColor = `${color}50`; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.08)"; }}
                >
                  <Icon className="w-4 h-4" style={{ color: "rgba(165,180,252,0.7)" }} />
                </button>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.values(footerLinks).map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-bold mb-4 text-white">{section.title}</h3>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm transition-colors hover:text-[#a5b4fc]"
                      style={{ color: "rgba(165,180,252,0.6)" }}
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
        <div className="border-t pt-8 mb-8 flex flex-col sm:flex-row gap-4 flex-wrap" style={{ borderColor: "rgba(45,39,98,0.8)" }}>
          {[
            { icon: Mail, text: "providminh24092004@gmail.com" },
            { icon: Phone, text: "0916 869 648" },
            { icon: MapPin, text: "TP. Hồ Chí Minh, Việt Nam" },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2.5 text-sm" style={{ color: "rgba(165,180,252,0.6)" }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(99,102,241,0.15)" }}>
                <Icon className="w-3.5 h-3.5" style={{ color: "#818cf8" }} />
              </div>
              <span>{text}</span>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4" style={{ borderColor: "rgba(45,39,98,0.8)" }}>
          <p className="text-xs flex items-center gap-1" style={{ color: "rgba(165,180,252,0.45)" }}>
            © 2026 LumiLearn. Made with <Heart className="w-3 h-3 text-red-400 fill-red-400" /> in Vietnam.
          </p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: "#34d399", boxShadow: "0 0 6px #34d399" }} />
            <span className="text-xs" style={{ color: "rgba(165,180,252,0.45)" }}>Hệ thống hoạt động bình thường</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
