"use client";

import { useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

const faqCategories = [
  {
    label: "Tài khoản",
    items: [
      { q: "Làm sao để đăng ký tài khoản?", a: "Nhấn nút 'Đăng ký' ở góc trên bên phải trang chủ, điền thông tin cá nhân, chọn vai trò và xác nhận email." },
      { q: "Quên mật khẩu thì làm sao?", a: "Vào trang đăng nhập, nhấn 'Quên mật khẩu', nhập email đăng ký và làm theo hướng dẫn." },
      { q: "Làm sao để cập nhật thông tin cá nhân?", a: "Vào trang Hồ sơ từ menu avatar phía trên bên phải, chỉnh sửa thông tin và nhấn 'Lưu thay đổi'." },
    ],
  },
  {
    label: "Khóa học",
    items: [
      { q: "Khóa học miễn phí có giới hạn không?", a: "Không, bạn được truy cập toàn bộ nội dung khóa miễn phí bao gồm video, bài tập và quiz." },
      { q: "Làm sao để nhận chứng chỉ?", a: "Hoàn thành 100% nội dung khóa học, hệ thống sẽ tự động cấp chứng chỉ." },
      { q: "Có thể học trên điện thoại không?", a: "Có, LumiLearn hoạt động tốt trên mọi thiết bị." },
    ],
  },
  {
    label: "Thanh toán",
    items: [
      { q: "Chấp nhận phương thức thanh toán nào?", a: "Chuyển khoản ngân hàng qua mã QR. Thanh toán được xác nhận tự động." },
      { q: "Chính sách hoàn tiền?", a: "Hoàn tiền trong 7 ngày kể từ ngày mua nếu chưa hoàn thành quá 20% nội dung." },
    ],
  },
  {
    label: "Bảo mật",
    items: [
      { q: "Thông tin có được bảo mật không?", a: "Có, toàn bộ dữ liệu được mã hóa và lưu trữ an toàn." },
      { q: "Đăng xuất khỏi thiết bị khác?", a: "Vào Cài đặt > Phiên đăng nhập để xem và kết thúc các phiên từ xa." },
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
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <Navbar />

      <section className="pt-28 pb-12" style={{ background: "var(--background-2)", borderBottom: "1px solid var(--border)" }}>
        <div className="max-w-[800px] mx-auto px-6 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.15em] mb-3" style={{ color: "var(--primary)" }}>Trợ giúp</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-4">Bạn cần <span style={{ color: "var(--primary)" }}>giúp đỡ?</span></h1>
          <p className="text-base mb-8" style={{ color: "var(--muted-foreground)" }}>Tìm câu trả lời cho các thắc mắc thường gặp</p>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm kiếm câu hỏi..."
            className="w-full max-w-xl mx-auto block px-4 py-3.5 rounded-lg text-sm outline-none transition-all"
            style={{ background: "var(--input)", border: "1.5px solid var(--border)", color: "var(--foreground)" }} />
        </div>
      </section>

      <div className="py-16">
        <div className="max-w-[900px] mx-auto px-6">
          {filteredCategories.length === 0 ? (
            <div className="text-center py-16">
              <h3 className="font-bold mb-1">Không tìm thấy câu hỏi phù hợp</h3>
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Thử từ khóa khác hoặc liên hệ hỗ trợ</p>
            </div>
          ) : (
            <div className="space-y-10">
              {filteredCategories.map((cat) => (
                <div key={cat.label}>
                  <h2 className="text-lg font-bold mb-4">{cat.label}</h2>
                  <div className="space-y-2">
                    {cat.items.map((item) => {
                      const key = `${cat.label}-${item.q}`;
                      const isOpen = openItem === key;
                      return (
                        <div key={key} className="card-base p-0 overflow-hidden">
                          <button onClick={() => setOpenItem(isOpen ? null : key)}
                            className="w-full flex items-center justify-between p-5 text-left transition-colors hover:bg-[var(--muted)]">
                            <span className="font-medium text-sm pr-4">{item.q}</span>
                            <span className="text-sm shrink-0 transition-transform" style={{ transform: isOpen ? "rotate(180deg)" : "none", color: "var(--muted-foreground)" }}>▾</span>
                          </button>
                          {isOpen && (
                            <div className="px-5 pb-5 text-sm leading-relaxed" style={{ color: "var(--muted-foreground)", borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
                              {item.a}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-16 card-base text-center" style={{ background: "var(--muted)" }}>
            <h3 className="text-lg font-bold mb-2">Vẫn chưa tìm được câu trả lời?</h3>
            <p className="text-sm mb-5" style={{ color: "var(--muted-foreground)" }}>Liên hệ đội ngũ hỗ trợ — phản hồi trong 24 giờ</p>
            <a href="/contact" className="px-6 py-3 rounded-lg font-bold text-sm transition-all hover:-translate-y-0.5"
              style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>Liên hệ ngay →</a>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
