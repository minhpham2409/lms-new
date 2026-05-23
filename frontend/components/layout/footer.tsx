import Link from "next/link";
import { Logo } from "@/components/ui/logo";

const footerLinks = {
  platform: { title: "Nền tảng", links: [{ label: "Khóa học", href: "/courses" }, { label: "Giáo viên", href: "/teachers" }, { label: "Giới thiệu", href: "/about" }] },
  support: { title: "Hỗ trợ", links: [{ label: "Trợ giúp", href: "/help" }, { label: "Liên hệ", href: "/contact" }, { label: "Điều khoản", href: "/terms" }] },
  roles: { title: "Dành cho", links: [{ label: "Học sinh", href: "/courses" }, { label: "Giáo viên", href: "/teachers" }, { label: "Phụ huynh", href: "/parent" }] },
};

export function Footer() {
  return (
    <footer style={{ background: "var(--secondary)", color: "var(--secondary-foreground)" }}>
      <div className="max-w-[1200px] mx-auto px-6 sm:px-10 pt-14 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          <div className="lg:col-span-2">
            <Link href="/" className="inline-block mb-5"><Logo size="lg" /></Link>
            <p className="text-sm leading-relaxed mb-5 max-w-xs opacity-60">
              Nền tảng học tập thông minh kết nối giáo viên, học sinh và phụ huynh. Mang lại trải nghiệm giáo dục hiện đại.
            </p>
          </div>
          {Object.values(footerLinks).map((s) => (
            <div key={s.title}>
              <h3 className="text-sm font-bold mb-4">{s.title}</h3>
              <ul className="space-y-2.5">
                {s.links.map((l) => (
                  <li key={l.href}><Link href={l.href} className="text-sm opacity-50 hover:opacity-80 transition-opacity">{l.label}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          <p className="text-xs opacity-40">© 2026 LumiLearn. Made in Vietnam.</p>
          <p className="text-xs opacity-40">providminh24092004@gmail.com · 0916 869 648</p>
        </div>
      </div>
    </footer>
  );
}
