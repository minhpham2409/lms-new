"use client";

import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Shield } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <Navbar />
      <div className="pt-24 pb-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="section-tag mx-auto mb-4"><Shield className="w-3.5 h-3.5" /> Bảo mật</div>
            <h1 className="text-3xl font-extrabold mb-3">Chính sách <span className="gradient-text">quyền riêng tư</span></h1>
            <p className="text-sm" style={{ color: "#8892a4" }}>Cập nhật lần cuối: 01/05/2026</p>
          </div>
          <div className="card-base" style={{ color: "#8892a4" }}>
            {[
              { title: "1. Thu thập thông tin", text: "Chúng tôi thu thập thông tin cá nhân (tên, email, số điện thoại) khi bạn đăng ký tài khoản, cùng dữ liệu học tập (tiến độ, điểm số) để cải thiện trải nghiệm." },
              { title: "2. Sử dụng thông tin", text: "Thông tin được sử dụng để: cung cấp dịch vụ, cá nhân hóa trải nghiệm học tập, gửi thông báo liên quan, và cải thiện nền tảng." },
              { title: "3. Bảo vệ dữ liệu", text: "Dữ liệu được mã hóa và lưu trữ trên máy chủ bảo mật. Chúng tôi không bán thông tin cá nhân cho bên thứ ba." },
              { title: "4. Cookie", text: "Chúng tôi sử dụng cookie để duy trì phiên đăng nhập và phân tích hành vi sử dụng nhằm cải thiện dịch vụ." },
              { title: "5. Quyền của bạn", text: "Bạn có quyền yêu cầu truy cập, chỉnh sửa hoặc xóa dữ liệu cá nhân bất cứ lúc nào bằng cách liên hệ đội ngũ hỗ trợ." },
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
