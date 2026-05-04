"use client";

import { useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Mail, Phone, MapPin, Send, MessageCircle } from "lucide-react";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <Navbar />
      <div className="pt-24 pb-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="section-tag mx-auto mb-4"><MessageCircle className="w-3.5 h-3.5" /> Liên hệ</div>
            <h1 className="text-3xl font-extrabold mb-3">Chúng tôi luôn <span className="gradient-text">sẵn sàng hỗ trợ</span></h1>
            <p className="text-base" style={{ color: "#8892a4" }}>Gửi tin nhắn cho chúng tôi, đội ngũ sẽ phản hồi trong 24 giờ</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-10">
            {[
              { icon: Mail, label: "Email", value: "support@hoclotrinh.vn" },
              { icon: Phone, label: "Điện thoại", value: "+84 (028) 3600 0000" },
              { icon: MapPin, label: "Địa chỉ", value: "TP. Hồ Chí Minh" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="card-base text-center">
                <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background: "rgba(124,58,237,0.15)" }}>
                  <Icon className="w-5 h-5" style={{ color: "#7c3aed" }} />
                </div>
                <p className="text-sm font-semibold mb-1">{label}</p>
                <p className="text-xs" style={{ color: "#8892a4" }}>{value}</p>
              </div>
            ))}
          </div>

          <div className="card-base max-w-2xl mx-auto">
            <h2 className="font-bold mb-5">Gửi tin nhắn</h2>
            <form className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Họ tên</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-base" placeholder="Nguyễn Văn A" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-base" placeholder="email@example.com" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Chủ đề</label>
                <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="input-base" placeholder="Hỗ trợ đăng ký khóa học" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Nội dung</label>
                <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={5} className="input-base resize-none" placeholder="Mô tả chi tiết vấn đề..." />
              </div>
              <button type="button" className="btn-primary"><Send className="w-4 h-4" /> Gửi tin nhắn</button>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
