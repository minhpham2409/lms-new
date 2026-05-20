"use client";

import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { FileText } from "lucide-react";

const sections = [
  { title: "1. Chấp nhận điều khoản", text: "Bằng việc truy cập và sử dụng LumiLearn, bạn đồng ý tuân thủ và chịu ràng buộc bởi các điều khoản và điều kiện sử dụng dưới đây. Nếu bạn không đồng ý với bất kỳ phần nào của điều khoản này, vui lòng ngừng sử dụng dịch vụ của chúng tôi." },
  { title: "2. Tài khoản người dùng", text: "Bạn chịu hoàn toàn trách nhiệm bảo mật thông tin đăng nhập tài khoản. Không được chia sẻ mật khẩu cho bất kỳ ai. Mỗi cá nhân chỉ được sở hữu một tài khoản. Mọi hoạt động xảy ra dưới tài khoản của bạn đều thuộc trách nhiệm của bạn." },
  { title: "3. Quyền sở hữu trí tuệ", text: "Toàn bộ nội dung trên nền tảng (video, bài giảng, quiz, hình ảnh, văn bản) thuộc quyền sở hữu trí tuệ của LumiLearn và các giáo viên đăng tải. Nghiêm cấm sao chép, tải xuống, phân phối lại, bán hoặc tạo sản phẩm phái sinh từ nội dung mà không có sự cho phép bằng văn bản." },
  { title: "4. Thanh toán & Hoàn tiền", text: "Thanh toán cho khóa học sẽ được xử lý qua các cổng thanh toán bảo mật. Giá được hiển thị bằng đồng Việt Nam (VNĐ). Chính sách hoàn tiền: trong vòng 7 ngày kể từ ngày mua, nếu chưa hoàn thành quá 20% nội dung khóa học, bạn có thể yêu cầu hoàn tiền đầy đủ." },
  { title: "5. Quy tắc ứng xử cộng đồng", text: "Người dùng phải tôn trọng lẫn nhau trong phần bình luận, thảo luận. Nghiêm cấm đăng nội dung xúc phạm, phân biệt đối xử, spam, hoặc vi phạm pháp luật. Nội dung vi phạm sẽ bị xóa mà không cần thông báo trước và tài khoản có thể bị đình chỉ hoặc chấm dứt vĩnh viễn." },
  { title: "6. Trách nhiệm dịch vụ", text: "LumiLearn cung cấp dịch vụ theo nguyên tắc 'như hiện trạng'. Chúng tôi không đảm bảo dịch vụ hoạt động liên tục, không bị gián đoạn. Chúng tôi không chịu trách nhiệm đối với thiệt hại trực tiếp hoặc gián tiếp phát sinh từ việc sử dụng dịch vụ." },
  { title: "7. Bảo vệ người dùng dưới 18 tuổi", text: "LumiLearn chào đón học sinh dưới 18 tuổi. Đối với trẻ em, chúng tôi khuyến khích cha mẹ/người giám hộ giám sát quá trình học tập và sử dụng tính năng phụ huynh tích hợp trong nền tảng để theo dõi tiến độ và hoạt động." },
  { title: "8. Thay đổi điều khoản", text: "Chúng tôi có thể sửa đổi các điều khoản này bất kỳ lúc nào. Mọi thay đổi sẽ có hiệu lực sau 30 ngày kể từ khi được đăng lên nền tảng. Tiếp tục sử dụng dịch vụ sau ngày thay đổi có hiệu lực đồng nghĩa với việc bạn chấp nhận các điều khoản mới." },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#1c1d1f]">
      <Navbar />

      {/* Hero */}
      <section className="pt-28 pb-12 bg-[#f7f9fa] dark:bg-[#2d2f31] border-b border-[#d1d7dc] dark:border-[#3e4143]">
        <div className="max-w-[800px] mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#f3f0ff] dark:bg-[rgba(164,53,240,0.15)] border border-[#e9e0ff] dark:border-[rgba(164,53,240,0.3)] rounded text-xs font-bold text-[#5624d0] dark:text-[#c0a5f7] mb-5">
            <FileText className="w-3.5 h-3.5" /> Pháp lý
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3 text-[#2d2f31] dark:text-white">
            Điều khoản <span style={{ background: "linear-gradient(135deg,#a435f0,#5624d0)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>sử dụng dịch vụ</span>
          </h1>
          <p className="text-sm text-[#6a6f73]">Cập nhật lần cuối: 01 tháng 5, 2026</p>
        </div>
      </section>

      <div className="py-16">
        <div className="max-w-[800px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Intro */}
          <div className="bg-[#fef3c7] dark:bg-[rgba(229,152,25,0.08)] border border-[#fde68a] dark:border-[rgba(229,152,25,0.2)] rounded p-5 mb-10">
            <p className="text-sm text-[#92400e] dark:text-[#fbbf24] leading-relaxed">
              <strong>Lưu ý quan trọng:</strong> Vui lòng đọc kỹ các điều khoản này trước khi sử dụng dịch vụ. Việc sử dụng dịch vụ đồng nghĩa với việc bạn đã đọc, hiểu và đồng ý với tất cả các điều khoản được nêu dưới đây.
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
            <h3 className="text-base font-bold text-[#2d2f31] dark:text-white mb-2">Câu hỏi về điều khoản?</h3>
            <p className="text-sm text-[#6a6f73] mb-4">Liên hệ bộ phận pháp lý qua email <strong>legal@lumilearn.edu.vn</strong></p>
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
