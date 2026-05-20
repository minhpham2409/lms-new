"use client";

import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Shield } from "lucide-react";

const sections = [
  { title: "1. Thu thập thông tin", text: "Chúng tôi thu thập thông tin cá nhân (tên, email, số điện thoại) khi bạn đăng ký tài khoản, cùng dữ liệu học tập (tiến độ, điểm số, thời gian học) để cải thiện trải nghiệm của bạn trên nền tảng." },
  { title: "2. Mục đích sử dụng thông tin", text: "Thông tin được sử dụng để: cung cấp dịch vụ học tập, cá nhân hóa trải nghiệm, gửi thông báo liên quan đến khóa học và kết quả học tập, xử lý thanh toán, và liên tục cải thiện nền tảng." },
  { title: "3. Bảo vệ dữ liệu", text: "Toàn bộ dữ liệu cá nhân được mã hóa bằng SSL/TLS và lưu trữ trên máy chủ bảo mật. Chúng tôi áp dụng các biện pháp kỹ thuật và tổ chức phù hợp để bảo vệ thông tin khỏi truy cập trái phép, mất mát hoặc tiết lộ không được phép." },
  { title: "4. Chia sẻ thông tin", text: "Chúng tôi không bán, trao đổi hoặc cho thuê thông tin cá nhân của bạn cho bên thứ ba. Thông tin có thể được chia sẻ với giáo viên của khóa học bạn đăng ký (chỉ tên và tiến độ học tập) nhằm mục đích hỗ trợ học tập." },
  { title: "5. Cookie và theo dõi", text: "Chúng tôi sử dụng cookie để duy trì phiên đăng nhập, ghi nhớ tùy chọn của bạn và phân tích hành vi sử dụng nhằm cải thiện dịch vụ. Bạn có thể tắt cookie trong cài đặt trình duyệt nhưng điều này có thể ảnh hưởng đến một số tính năng." },
  { title: "6. Quyền của bạn", text: "Bạn có quyền yêu cầu truy cập, chỉnh sửa hoặc xóa dữ liệu cá nhân bất cứ lúc nào. Để thực hiện các quyền này, hãy liên hệ qua email support@lumilearn.edu.vn hoặc sử dụng tính năng quản lý tài khoản trong hồ sơ cá nhân." },
  { title: "7. Lưu giữ dữ liệu", text: "Chúng tôi lưu giữ thông tin của bạn trong suốt thời gian tài khoản còn hoạt động và tối đa 2 năm sau khi bạn xóa tài khoản (theo quy định pháp luật về thuế và giao dịch điện tử)." },
  { title: "8. Thay đổi chính sách", text: "Chúng tôi có thể cập nhật Chính sách Quyền riêng tư này theo thời gian. Mọi thay đổi quan trọng sẽ được thông báo qua email hoặc thông báo nổi bật trên nền tảng trước ít nhất 30 ngày." },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#1c1d1f]">
      <Navbar />

      {/* Hero */}
      <section className="pt-28 pb-12 bg-[#f7f9fa] dark:bg-[#2d2f31] border-b border-[#d1d7dc] dark:border-[#3e4143]">
        <div className="max-w-[800px] mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#f3f0ff] dark:bg-[rgba(164,53,240,0.15)] border border-[#e9e0ff] dark:border-[rgba(164,53,240,0.3)] rounded text-xs font-bold text-[#5624d0] dark:text-[#c0a5f7] mb-5">
            <Shield className="w-3.5 h-3.5" /> Bảo mật & Quyền riêng tư
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3 text-[#2d2f31] dark:text-white">
            Chính sách <span style={{ background: "linear-gradient(135deg,#a435f0,#5624d0)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>quyền riêng tư</span>
          </h1>
          <p className="text-sm text-[#6a6f73]">Cập nhật lần cuối: 01 tháng 5, 2026</p>
        </div>
      </section>

      <div className="py-16">
        <div className="max-w-[800px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Intro */}
          <div className="bg-[#f3f0ff] dark:bg-[rgba(164,53,240,0.08)] border border-[#e9e0ff] dark:border-[rgba(164,53,240,0.2)] rounded p-6 mb-10">
            <p className="text-sm text-[#2d2f31] dark:text-[#b0b5b9] leading-relaxed">
              Tại LumiLearn, chúng tôi coi trọng sự riêng tư của bạn. Chính sách này giải thích cách chúng tôi thu thập, sử dụng và bảo vệ thông tin cá nhân của bạn khi sử dụng nền tảng của chúng tôi.
            </p>
          </div>

          {/* Content */}
          <div className="space-y-0 border border-[#d1d7dc] dark:border-[#3e4143] rounded overflow-hidden">
            {sections.map(({ title, text }, i) => (
              <div key={title} className={`p-6 ${i < sections.length - 1 ? "border-b border-[#d1d7dc] dark:border-[#3e4143]" : ""}`}>
                <h2 className="text-base font-bold mb-2 text-[#2d2f31] dark:text-white">{title}</h2>
                <p className="text-sm text-[#6a6f73] leading-relaxed">{text}</p>
              </div>
            ))}
          </div>

          {/* Contact */}
          <div className="mt-10 bg-[#f7f9fa] dark:bg-[#2d2f31] border border-[#d1d7dc] dark:border-[#3e4143] rounded p-6 text-center">
            <h3 className="text-base font-bold text-[#2d2f31] dark:text-white mb-2">Có câu hỏi về chính sách?</h3>
            <p className="text-sm text-[#6a6f73] mb-4">Liên hệ với chúng tôi qua email <strong>support@lumilearn.edu.vn</strong></p>
            <a href="/contact" className="inline-flex items-center gap-2 px-5 py-2.5 border border-[#2d2f31] dark:border-white text-[#2d2f31] dark:text-white font-bold text-sm hover:bg-[#f7f9fa] dark:hover:bg-[#3e4143] transition-colors rounded">
              Liên hệ hỗ trợ
            </a>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
