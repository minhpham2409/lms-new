"use client";

import { useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { HelpCircle, ChevronDown, Search, BookOpen, CreditCard, User, Shield } from "lucide-react";

const faqCategories = [
  { label: "Tài khoản", icon: User, items: [
    { q: "Làm sao để đăng ký tài khoản?", a: "Nhấn nút 'Bắt đầu miễn phí' ở trang chủ, điền thông tin và chọn vai trò (Học sinh, Giáo viên, Phụ huynh)." },
    { q: "Quên mật khẩu thì làm sao?", a: "Vào trang đăng nhập, nhấn 'Quên mật khẩu' và làm theo hướng dẫn gửi đến email." },
  ]},
  { label: "Khóa học", icon: BookOpen, items: [
    { q: "Khóa học miễn phí có giới hạn không?", a: "Không, bạn được truy cập toàn bộ nội dung khóa miễn phí, bao gồm video và bài tập." },
    { q: "Làm sao để nhận chứng chỉ?", a: "Hoàn thành 100% nội dung khóa học và đạt điểm tối thiểu trong bài kiểm tra cuối khóa." },
  ]},
  { label: "Thanh toán", icon: CreditCard, items: [
    { q: "Chấp nhận phương thức thanh toán nào?", a: "Chuyển khoản ngân hàng, ví điện tử (MoMo, ZaloPay) và thẻ tín dụng/ghi nợ quốc tế." },
    { q: "Chính sách hoàn tiền?", a: "Bạn có thể yêu cầu hoàn tiền trong 7 ngày kể từ ngày mua nếu chưa hoàn thành quá 20% khóa học." },
  ]},
];

export default function HelpPage() {
  const [openItem, setOpenItem] = useState<string | null>(null);

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <Navbar />
      <div className="pt-24 pb-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="section-tag mx-auto mb-4"><HelpCircle className="w-3.5 h-3.5" /> Trung tâm trợ giúp</div>
            <h1 className="text-3xl font-extrabold mb-3">Bạn cần <span className="gradient-text">giúp đỡ?</span></h1>
            <p className="text-base" style={{ color: "#8892a4" }}>Tìm câu trả lời cho các thắc mắc phổ biến</p>
          </div>

          <div className="relative mb-10">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: "#8892a4" }} />
            <input placeholder="Tìm kiếm câu hỏi..." className="input-base pl-12 py-4 text-base" />
          </div>

          <div className="space-y-8">
            {faqCategories.map((cat) => {
              const Icon = cat.icon;
              return (
                <div key={cat.label}>
                  <h2 className="flex items-center gap-2 text-lg font-bold mb-4">
                    <Icon className="w-5 h-5" style={{ color: "#7c3aed" }} /> {cat.label}
                  </h2>
                  <div className="space-y-2">
                    {cat.items.map((item) => {
                      const key = `${cat.label}-${item.q}`;
                      const isOpen = openItem === key;
                      return (
                        <div key={key} className="card-base overflow-hidden">
                          <button onClick={() => setOpenItem(isOpen ? null : key)} className="w-full flex items-center justify-between p-4 text-left">
                            <span className="font-medium text-sm">{item.q}</span>
                            <ChevronDown className={`w-4 h-4 transition-transform flex-shrink-0 ml-3 ${isOpen ? "rotate-180" : ""}`} style={{ color: "#8892a4" }} />
                          </button>
                          {isOpen && (
                            <div className="px-4 pb-4 text-sm leading-relaxed" style={{ color: "#8892a4" }}>{item.a}</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
