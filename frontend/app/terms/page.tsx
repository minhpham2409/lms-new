"use client";

import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { FileText } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <Navbar />
      <div className="pt-24 pb-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="section-tag mx-auto mb-4"><FileText className="w-3.5 h-3.5" /> Pháp lý</div>
            <h1 className="text-3xl font-extrabold mb-3">Điều khoản <span className="gradient-text">sử dụng</span></h1>
            <p className="text-sm" style={{ color: "#8892a4" }}>Cập nhật lần cuối: 01/05/2026</p>
          </div>
          <div className="card-base prose-sm" style={{ color: "#8892a4" }}>
            {[
              { title: "1. Chấp nhận điều khoản", text: "Bằng việc truy cập và sử dụng HọcLộ Trình, bạn đồng ý tuân thủ các điều khoản dưới đây. Nếu không đồng ý, vui lòng ngừng sử dụng dịch vụ." },
              { title: "2. Tài khoản người dùng", text: "Bạn chịu trách nhiệm bảo mật thông tin tài khoản. Không chia sẻ mật khẩu cho bất kỳ ai. Mỗi người chỉ được sở hữu một tài khoản." },
              { title: "3. Nội dung khóa học", text: "Tất cả nội dung trên nền tảng thuộc quyền sở hữu trí tuệ của HọcLộ Trình và giáo viên. Nghiêm cấm sao chép, phân phối lại nội dung mà không có sự cho phép." },
              { title: "4. Thanh toán & hoàn tiền", text: "Thanh toán cho khóa học premium sẽ được xử lý qua các cổng thanh toán an toàn. Chính sách hoàn tiền áp dụng trong 7 ngày kể từ ngày mua." },
              { title: "5. Quy tắc ứng xử", text: "Người dùng cần tôn trọng lẫn nhau trong phần bình luận và thảo luận. Nội dung vi phạm sẽ bị xóa và tài khoản có thể bị khóa." },
            ].map(({ title, text }) => (
              <div key={title} className="mb-6">
                <h2 className="text-base font-bold mb-2" style={{ color: "#f1f5ff" }}>{title}</h2>
                <p className="text-sm leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
