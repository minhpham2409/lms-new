import { UnifiedPageShell } from "@/components/layout/unified-page-shell";

export const metadata = {
  title: "Trợ giúp | HọcLộ Trình",
  description: "Câu hỏi thường gặp và trợ giúp sử dụng HọcLộ Trình.",
};

export default function Help() {
  const faqs = [
    {
      q: "Làm thế nào để đăng ký tài khoản?",
      a: "Nhấn nút 'Đăng ký' trên trang chủ, chọn vai trò (học sinh/giáo viên/phụ huynh), điền thông tin và xác nhận email.",
    },
    {
      q: "Có thể đổi vai trò sau khi đăng ký không?",
      a: "Liên hệ hỗ trợ để được giúp đỡ thay đổi vai trò tài khoản.",
    },
    {
      q: "Học sinh làm sao để đăng ký khóa học?",
      a: "Vào mục 'Khóa học' → Chọn khóa → Nhấn 'Đăng ký' → Hoàn tất thanh toán.",
    },
    {
      q: "Phụ huynh làm sao để theo dõi tiến độ con?",
      a: "Vào mục 'Phụ huynh' → 'Liên kết con em' → Chấp nhận lời mời từ con → Xem tiến độ chi tiết.",
    },
    {
      q: "Giáo viên có thể tạo khóa học mới như thế nào?",
      a: "Vào mục 'Giáo viên' → 'Khóa học của tôi' → 'Tạo khóa học mới' → Điền thông tin và xuất bản.",
    },
    {
      q: "Có thể hoàn tiền nếu không hài lòng không?",
      a: "Chúng tôi chấp nhận hoàn tiền trong vòng 7 ngày sau khi đăng ký. Liên hệ hỗ trợ.",
    },
    {
      q: "Làm sao để liên hệ hỗ trợ?",
      a: "Vào trang 'Liên hệ' hoặc gửi email: lienhe@hoclotrinh.edu.vn",
    },
  ];

  return (
    <UnifiedPageShell contentClassName="py-16">
      <div className="landing-page max-w-4xl mx-auto px-4 md:px-6">
        <div className="mb-12 text-center">
          <h1 className="section-title mb-4">Trợ giúp & Câu hỏi thường gặp</h1>
          <p className="section-subtitle">
            Tìm câu trả lời cho các câu hỏi phổ biến của bạn
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <details
              key={idx}
              className="border border-slate-200 rounded-lg p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 transition"
            >
              <summary className="font-semibold text-lg text-blue-700 flex justify-between items-center">
                {faq.q}
                <span className="text-sm">+</span>
              </summary>
              <p className="mt-3 section-content leading-relaxed">{faq.a}</p>
            </details>
          ))}
        </div>

        <div className="mt-12 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h2 className="font-semibold text-lg mb-2">Không tìm thấy câu trả lời?</h2>
          <p className="section-content mb-4">
            Liên hệ với đội hỗ trợ của chúng tôi để được giúp đỡ thêm.
          </p>
          <a
            href="/contact"
            className="btn btn-primary"
          >
            Gửi tin nhắn hỗ trợ
          </a>
        </div>
      </div>
    </UnifiedPageShell>
  );
}
