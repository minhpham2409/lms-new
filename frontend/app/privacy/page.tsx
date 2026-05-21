"use client";

import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

const sections = [
  { title: "1. Thu thập thông tin", text: "Chúng tôi thu thập thông tin cá nhân (tên, email, số điện thoại) khi bạn đăng ký tài khoản, cùng dữ liệu học tập (tiến độ, điểm số, thời gian học) để cải thiện trải nghiệm của bạn trên nền tảng." },
  { title: "2. Mục đích sử dụng", text: "Thông tin được sử dụng để: cung cấp dịch vụ học tập, cá nhân hóa trải nghiệm, gửi thông báo liên quan đến khóa học và kết quả học tập, xử lý thanh toán, và liên tục cải thiện nền tảng." },
  { title: "3. Bảo vệ dữ liệu", text: "Toàn bộ dữ liệu cá nhân được mã hóa bằng SSL/TLS và lưu trữ trên máy chủ bảo mật. Chúng tôi áp dụng các biện pháp kỹ thuật và tổ chức phù hợp để bảo vệ thông tin." },
  { title: "4. Chia sẻ thông tin", text: "Chúng tôi không bán, trao đổi hoặc cho thuê thông tin cá nhân của bạn cho bên thứ ba. Thông tin có thể được chia sẻ với giáo viên nhằm mục đích hỗ trợ học tập." },
  { title: "5. Cookie", text: "Chúng tôi sử dụng cookie để duy trì phiên đăng nhập, ghi nhớ tùy chọn và phân tích hành vi sử dụng nhằm cải thiện dịch vụ." },
  { title: "6. Quyền của bạn", text: "Bạn có quyền yêu cầu truy cập, chỉnh sửa hoặc xóa dữ liệu cá nhân bất cứ lúc nào qua email support@lumilearn.edu.vn." },
  { title: "7. Lưu giữ dữ liệu", text: "Chúng tôi lưu giữ thông tin trong suốt thời gian tài khoản còn hoạt động và tối đa 2 năm sau khi bạn xóa tài khoản." },
  { title: "8. Thay đổi chính sách", text: "Chúng tôi có thể cập nhật chính sách này theo thời gian. Mọi thay đổi quan trọng sẽ được thông báo trước ít nhất 30 ngày." },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <Navbar />
      <section className="pt-28 pb-12" style={{ background: "var(--background-2)", borderBottom: "1px solid var(--border)" }}>
        <div className="max-w-[800px] mx-auto px-6 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.15em] mb-3" style={{ color: "var(--primary)" }}>Bảo mật</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-3">Chính sách <span style={{ color: "var(--primary)" }}>quyền riêng tư</span></h1>
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Cập nhật lần cuối: 01 tháng 5, 2026</p>
        </div>
      </section>
      <div className="py-16">
        <div className="max-w-[800px] mx-auto px-6">
          <div className="card-base p-5 mb-10" style={{ background: "var(--muted)" }}>
            <p className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
              Tại LumiLearn, chúng tôi coi trọng sự riêng tư của bạn. Chính sách này giải thích cách chúng tôi thu thập, sử dụng và bảo vệ thông tin cá nhân.
            </p>
          </div>
          <div className="card-base overflow-hidden p-0">
            {sections.map(({ title, text }, i) => (
              <div key={title} className="p-6" style={i < sections.length - 1 ? { borderBottom: "1px solid var(--border)" } : {}}>
                <h2 className="text-base font-bold mb-2">{title}</h2>
                <p className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{text}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 card-base text-center" style={{ background: "var(--muted)" }}>
            <h3 className="text-base font-bold mb-2">Có câu hỏi?</h3>
            <p className="text-sm mb-4" style={{ color: "var(--muted-foreground)" }}>Liên hệ <strong>support@lumilearn.edu.vn</strong></p>
            <a href="/contact" className="px-5 py-2.5 rounded-lg font-bold text-sm" style={{ border: "1.5px solid var(--border)" }}>Liên hệ hỗ trợ</a>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
