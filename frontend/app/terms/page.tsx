"use client";

import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

const sections = [
  { title: "1. Chấp nhận điều khoản", text: "Bằng việc truy cập và sử dụng LumiLearn, bạn đồng ý tuân thủ và chịu ràng buộc bởi các điều khoản và điều kiện sử dụng dưới đây. Nếu bạn không đồng ý với bất kỳ phần nào của điều khoản này, vui lòng ngừng sử dụng dịch vụ của chúng tôi." },
  { title: "2. Tài khoản người dùng", text: "Bạn chịu hoàn toàn trách nhiệm bảo mật thông tin đăng nhập tài khoản. Không được chia sẻ mật khẩu cho bất kỳ ai. Mỗi cá nhân chỉ được sở hữu một tài khoản. Mọi hoạt động xảy ra dưới tài khoản của bạn đều thuộc trách nhiệm của bạn." },
  { title: "3. Quyền sở hữu trí tuệ", text: "Toàn bộ nội dung trên nền tảng (video, bài giảng, quiz, hình ảnh, văn bản) thuộc quyền sở hữu trí tuệ của LumiLearn và các giáo viên đăng tải. Nghiêm cấm sao chép, tải xuống, phân phối lại, bán hoặc tạo sản phẩm phái sinh từ nội dung mà không có sự cho phép bằng văn bản." },
  { title: "4. Thanh toán & Hoàn tiền", text: "Thanh toán cho khóa học sẽ được xử lý qua các cổng thanh toán bảo mật. Giá được hiển thị bằng đồng Việt Nam (VNĐ). Chính sách hoàn tiền: trong vòng 7 ngày kể từ ngày mua, nếu chưa hoàn thành quá 20% nội dung khóa học, bạn có thể yêu cầu hoàn tiền đầy đủ." },
  { title: "5. Quy tắc ứng xử cộng đồng", text: "Người dùng phải tôn trọng lẫn nhau trong phần bình luận, thảo luận. Nghiêm cấm đăng nội dung xúc phạm, phân biệt đối xử, spam, hoặc vi phạm pháp luật. Nội dung vi phạm sẽ bị xóa mà không cần thông báo trước." },
  { title: "6. Trách nhiệm dịch vụ", text: "LumiLearn cung cấp dịch vụ theo nguyên tắc 'như hiện trạng'. Chúng tôi không đảm bảo dịch vụ hoạt động liên tục, không bị gián đoạn. Chúng tôi không chịu trách nhiệm đối với thiệt hại trực tiếp hoặc gián tiếp phát sinh từ việc sử dụng dịch vụ." },
  { title: "7. Bảo vệ người dùng dưới 18 tuổi", text: "LumiLearn chào đón học sinh dưới 18 tuổi. Đối với trẻ em, chúng tôi khuyến khích cha mẹ/người giám hộ giám sát quá trình học tập và sử dụng tính năng phụ huynh tích hợp trong nền tảng." },
  { title: "8. Thay đổi điều khoản", text: "Chúng tôi có thể sửa đổi các điều khoản này bất kỳ lúc nào. Mọi thay đổi sẽ có hiệu lực sau 30 ngày kể từ khi được đăng lên nền tảng." },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <Navbar />
      <section className="pt-28 pb-12" style={{ background: "var(--background-2)", borderBottom: "1px solid var(--border)" }}>
        <div className="max-w-[800px] mx-auto px-6 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.15em] mb-3" style={{ color: "var(--primary)" }}>Pháp lý</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-3">Điều khoản <span style={{ color: "var(--primary)" }}>sử dụng</span></h1>
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Cập nhật lần cuối: 01 tháng 5, 2026</p>
        </div>
      </section>
      <div className="py-16">
        <div className="max-w-[800px] mx-auto px-6">
          <div className="card-base p-5 mb-10" style={{ background: "var(--muted)" }}>
            <p className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}><strong>Lưu ý:</strong> Vui lòng đọc kỹ các điều khoản này trước khi sử dụng dịch vụ.</p>
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
            <h3 className="text-base font-bold mb-2">Câu hỏi về điều khoản?</h3>
            <p className="text-sm mb-4" style={{ color: "var(--muted-foreground)" }}>Liên hệ <strong>legal@lumilearn.edu.vn</strong></p>
            <a href="/contact" className="px-5 py-2.5 rounded-lg font-bold text-sm" style={{ border: "1.5px solid var(--border)" }}>Liên hệ hỗ trợ</a>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
