"use client";

import { useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { toast } from "sonner";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true);
    setTimeout(() => { setLoading(false); setSubmitted(true); toast.success("Đã gửi! Chúng tôi sẽ phản hồi trong 24 giờ."); }, 1500);
  }

  const inputStyle = "w-full px-4 py-3 rounded-lg text-sm outline-none transition-all";
  const inputCss = { background: "var(--input)", border: "1.5px solid var(--border)", color: "var(--foreground)" };

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <Navbar />

      <section className="pt-28 pb-12" style={{ background: "var(--background-2)", borderBottom: "1px solid var(--border)" }}>
        <div className="max-w-[1200px] mx-auto px-6 sm:px-10 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.15em] mb-3" style={{ color: "var(--primary)" }}>Liên hệ</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-4">Chúng tôi luôn <span style={{ color: "var(--primary)" }}>sẵn sàng hỗ trợ</span></h1>
          <p className="text-base max-w-xl mx-auto" style={{ color: "var(--muted-foreground)" }}>Gửi tin nhắn và đội ngũ sẽ phản hồi trong 24 giờ</p>
        </div>
      </section>

      <div className="py-16">
        <div className="max-w-[1200px] mx-auto px-6 sm:px-10">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left */}
            <div className="space-y-5">
              <h2 className="text-xl font-bold mb-6">Thông tin liên hệ</h2>
              {[
                { label: "Email hỗ trợ", value: "support@lumilearn.edu.vn", sub: "Phản hồi trong 24 giờ" },
                { label: "Điện thoại", value: "+84 (028) 3600 0000", sub: "Thứ 2 - Thứ 6, 8:00 - 17:00" },
                { label: "Địa chỉ", value: "TP. Hồ Chí Minh", sub: "Việt Nam" },
              ].map(({ label, value, sub }) => (
                <div key={label} className="card-base">
                  <p className="text-xs mb-0.5" style={{ color: "var(--muted-foreground)" }}>{label}</p>
                  <p className="text-sm font-bold">{value}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{sub}</p>
                </div>
              ))}
              <div className="card-base" style={{ background: "var(--muted)" }}>
                <p className="text-sm font-bold mb-1" style={{ color: "var(--primary)" }}>Thời gian phản hồi</p>
                <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Cam kết phản hồi trong <strong>24 giờ làm việc</strong>.</p>
              </div>
            </div>

            {/* Right */}
            <div className="lg:col-span-2">
              <div className="card-base">
                {submitted ? (
                  <div className="text-center py-12">
                    <p className="text-3xl mb-4">✓</p>
                    <h3 className="text-xl font-bold mb-2">Tin nhắn đã được gửi!</h3>
                    <p className="text-sm mb-6" style={{ color: "var(--muted-foreground)" }}>Chúng tôi sẽ liên hệ lại trong 24 giờ.</p>
                    <button onClick={() => { setSubmitted(false); setForm({ name: "", email: "", subject: "", message: "" }); }}
                      className="px-6 py-2.5 rounded-lg font-bold text-sm" style={{ border: "1.5px solid var(--border)" }}>Gửi tin nhắn khác</button>
                  </div>
                ) : (
                  <>
                    <h2 className="text-xl font-bold mb-6">Gửi tin nhắn</h2>
                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="grid sm:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-sm font-semibold mb-1.5">Họ tên *</label>
                          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className={inputStyle} style={inputCss} placeholder="Nguyễn Văn A" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold mb-1.5">Email *</label>
                          <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                            className={inputStyle} style={inputCss} placeholder="email@example.com" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-1.5">Chủ đề *</label>
                        <select required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
                          className={inputStyle} style={inputCss}>
                          <option value="">Chọn chủ đề...</option>
                          <option value="technical">Hỗ trợ kỹ thuật</option>
                          <option value="billing">Thanh toán</option>
                          <option value="course">Khóa học</option>
                          <option value="teacher">Đăng ký giáo viên</option>
                          <option value="other">Khác</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-1.5">Nội dung *</label>
                        <textarea required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
                          rows={6} className={`${inputStyle} resize-none`} style={inputCss} placeholder="Mô tả chi tiết..." />
                      </div>
                      <button type="submit" disabled={loading}
                        className="px-8 py-3 rounded-lg font-bold text-sm transition-all hover:-translate-y-0.5 disabled:opacity-60"
                        style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
                        {loading ? "Đang gửi..." : "Gửi tin nhắn →"}
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
