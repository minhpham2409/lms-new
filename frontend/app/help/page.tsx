"use client";

import { useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { HelpCircle, ChevronDown, Search, BookOpen, CreditCard, User, Shield, Video, Award } from "lucide-react";

const faqCategories = [
  {
    label: "Tài khoản",
    icon: User,
    color: "#a435f0",
    items: [
      { q: "Làm sao để đăng ký tài khoản?", a: "Nhấn nút 'Đăng ký' ở góc trên bên phải trang chủ, điền thông tin cá nhân, chọn vai trò (Học sinh hoặc Phụ huynh) và xác nhận email." },
      { q: "Quên mật khẩu thì làm sao?", a: "Vào trang đăng nhập, nhấn 'Quên mật khẩu', nhập email đăng ký và làm theo hướng dẫn gửi đến email của bạn." },
      { q: "Làm sao để cập nhật thông tin cá nhân?", a: "Vào trang Hồ sơ từ menu avatar phía trên bên phải, chỉnh sửa thông tin và nhấn 'Lưu thay đổi'." },
    ],
  },
  {
    label: "Khóa học",
    icon: BookOpen,
    color: "#0891b2",
    items: [
      { q: "Khóa học miễn phí có giới hạn nội dung không?", a: "Không, bạn được truy cập toàn bộ nội dung khóa miễn phí bao gồm video bài giảng, bài tập và quiz." },
      { q: "Làm sao để nhận chứng chỉ hoàn thành?", a: "Hoàn thành 100% nội dung khóa học (xem đủ video và nộp bài tập), hệ thống sẽ tự động cấp chứng chỉ." },
      { q: "Tôi có thể học trên điện thoại không?", a: "Có, HọcLộ Trình hoạt động tốt trên mọi thiết bị: máy tính, máy tính bảng và điện thoại thông minh." },
    ],
  },
  {
    label: "Video & Bài học",
    icon: Video,
    color: "#10b981",
    items: [
      { q: "Video bài giảng có chất lượng HD không?", a: "Có, tất cả video được tải lên ở chất lượng HD (720p-1080p) và hỗ trợ tua nhanh, xem lại không giới hạn." },
      { q: "Tiến độ xem video có được lưu không?", a: "Có, hệ thống tự động lưu tiến độ xem video. Khi bạn xem đủ 80% thời lượng video, bài học sẽ được đánh dấu hoàn thành." },
    ],
  },
  {
    label: "Thanh toán",
    icon: CreditCard,
    color: "#f59e0b",
    items: [
      { q: "Chấp nhận phương thức thanh toán nào?", a: "Chuyển khoản ngân hàng qua mã QR (Vietcombank, Techcombank, MBBank...). Thanh toán được xác nhận tự động qua webhook." },
      { q: "Chính sách hoàn tiền như thế nào?", a: "Bạn có thể yêu cầu hoàn tiền trong 7 ngày kể từ ngày mua nếu chưa hoàn thành quá 20% nội dung khóa học." },
      { q: "Mã giảm giá dùng ở đâu?", a: "Tại trang Giỏ hàng hoặc thanh toán, nhập mã coupon vào ô 'Áp dụng mã giảm giá' để được hưởng ưu đãi." },
    ],
  },
  {
    label: "Thành tích & Gamification",
    icon: Award,
    color: "#ec4899",
    items: [
      { q: "Hệ thống Streak là gì?", a: "Streak là chuỗi ngày học liên tiếp. Mỗi ngày bạn học tập, streak tăng thêm 1. Duy trì streak dài sẽ nhận phần thưởng đặc biệt như mã giảm giá." },
      { q: "Thi đua tháng hoạt động như thế nào?", a: "Mỗi tháng, học sinh tích lũy điểm XP từ việc xem video, làm quiz và nộp bài. Top 3 cuối tháng sẽ nhận voucher giảm giá từ 5-20%." },
    ],
  },
  {
    label: "Bảo mật",
    icon: Shield,
    color: "#6366f1",
    items: [
      { q: "Thông tin cá nhân của tôi có được bảo mật không?", a: "Có, toàn bộ dữ liệu được mã hóa và lưu trữ an toàn. Chúng tôi không bán hoặc chia sẻ thông tin cá nhân cho bên thứ ba." },
      { q: "Làm sao để đăng xuất khỏi thiết bị khác?", a: "Vào Cài đặt > Phiên đăng nhập, bạn có thể xem và kết thúc các phiên đăng nhập từ xa ngay lập tức." },
    ],
  },
];

export default function HelpPage() {
  const [openItem, setOpenItem] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filteredCategories = faqCategories.map(cat => ({
    ...cat,
    items: cat.items.filter(item =>
      !search || item.q.toLowerCase().includes(search.toLowerCase()) || item.a.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter(cat => cat.items.length > 0);

  return (
    <div className="min-h-screen bg-white dark:bg-[#1c1d1f]">
      <Navbar />

      {/* Hero */}
      <section className="pt-28 pb-12 bg-[#f7f9fa] dark:bg-[#2d2f31] border-b border-[#d1d7dc] dark:border-[#3e4143]">
        <div className="max-w-[800px] mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#f3f0ff] dark:bg-[rgba(164,53,240,0.15)] border border-[#e9e0ff] dark:border-[rgba(164,53,240,0.3)] rounded text-xs font-bold text-[#5624d0] dark:text-[#c0a5f7] mb-5">
            <HelpCircle className="w-3.5 h-3.5" /> Trung tâm trợ giúp
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-4 text-[#2d2f31] dark:text-white">
            Bạn cần <span style={{ background: "linear-gradient(135deg,#a435f0,#5624d0)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>giúp đỡ?</span>
          </h1>
          <p className="text-base text-[#6a6f73] mb-8">Tìm câu trả lời cho các thắc mắc thường gặp</p>

          {/* Search */}
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6a6f73]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm kiếm câu hỏi..."
              className="w-full pl-12 pr-4 py-4 text-base border border-[#d1d7dc] dark:border-[#6a6f73] bg-white dark:bg-[#1c1d1f] text-[#2d2f31] dark:text-white rounded outline-none focus:border-[#5624d0] transition-colors"
            />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <div className="py-16">
        <div className="max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8">
          {filteredCategories.length === 0 ? (
            <div className="text-center py-16">
              <HelpCircle className="w-12 h-12 mx-auto mb-3 text-[#6a6f73]" />
              <h3 className="font-bold text-[#2d2f31] dark:text-white mb-1">Không tìm thấy câu hỏi phù hợp</h3>
              <p className="text-sm text-[#6a6f73]">Thử tìm với từ khóa khác hoặc liên hệ hỗ trợ trực tiếp</p>
            </div>
          ) : (
            <div className="space-y-10">
              {filteredCategories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <div key={cat.label}>
                    <h2 className="flex items-center gap-3 text-lg font-bold mb-4 text-[#2d2f31] dark:text-white">
                      <div className="w-9 h-9 rounded flex items-center justify-center flex-shrink-0" style={{ background: `${cat.color}15` }}>
                        <Icon className="w-5 h-5" style={{ color: cat.color }} />
                      </div>
                      {cat.label}
                    </h2>
                    <div className="space-y-2">
                      {cat.items.map((item) => {
                        const key = `${cat.label}-${item.q}`;
                        const isOpen = openItem === key;
                        return (
                          <div key={key} className="bg-white dark:bg-[#2d2f31] border border-[#d1d7dc] dark:border-[#3e4143] rounded overflow-hidden">
                            <button
                              onClick={() => setOpenItem(isOpen ? null : key)}
                              className="w-full flex items-center justify-between p-5 text-left hover:bg-[#f7f9fa] dark:hover:bg-[#3e4143] transition-colors"
                            >
                              <span className="font-medium text-sm text-[#2d2f31] dark:text-white pr-4">{item.q}</span>
                              <ChevronDown className={`w-4 h-4 text-[#6a6f73] flex-shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                            </button>
                            {isOpen && (
                              <div className="px-5 pb-5 text-sm leading-relaxed text-[#6a6f73] border-t border-[#d1d7dc] dark:border-[#3e4143] pt-4">
                                {item.a}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Contact fallback */}
          <div className="mt-16 bg-[#f7f9fa] dark:bg-[#2d2f31] border border-[#d1d7dc] dark:border-[#3e4143] rounded p-8 text-center">
            <h3 className="text-lg font-bold text-[#2d2f31] dark:text-white mb-2">Vẫn chưa tìm được câu trả lời?</h3>
            <p className="text-sm text-[#6a6f73] mb-5">Liên hệ đội ngũ hỗ trợ — chúng tôi sẽ phản hồi trong vòng 24 giờ</p>
            <a href="/contact" className="inline-flex items-center gap-2 px-6 py-3 bg-[#a435f0] hover:bg-[#8710d8] text-white font-bold text-sm transition-colors rounded">
              Liên hệ ngay
            </a>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
