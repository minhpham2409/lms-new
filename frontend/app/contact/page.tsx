"use client";

import { useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Mail, Phone, MapPin, Send, MessageCircle, Clock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      toast.success("Đã gửi tin nhắn! Chúng tôi sẽ phản hồi trong 24 giờ.");
    }, 1500);
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#1c1d1f]">
      <Navbar />

      {/* Hero */}
      <section className="pt-28 pb-12 border-b border-[#d1d7dc] dark:border-[#3e4143] bg-[#f7f9fa] dark:bg-[#2d2f31]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#f3f0ff] dark:bg-[rgba(164,53,240,0.15)] border border-[#e9e0ff] dark:border-[rgba(164,53,240,0.3)] rounded text-xs font-bold text-[#5624d0] dark:text-[#c0a5f7] mb-5">
            <MessageCircle className="w-3.5 h-3.5" /> Liên hệ với chúng tôi
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-4 text-[#2d2f31] dark:text-white">
            Chúng tôi luôn <span style={{ background: "linear-gradient(135deg,#a435f0,#5624d0)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>sẵn sàng hỗ trợ</span>
          </h1>
          <p className="text-base text-[#6a6f73] max-w-xl mx-auto">
            Gửi tin nhắn cho chúng tôi và đội ngũ sẽ phản hồi trong vòng 24 giờ làm việc
          </p>
        </div>
      </section>

      <div className="py-16">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8">

            {/* Left - Contact info */}
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-[#2d2f31] dark:text-white mb-6">Thông tin liên hệ</h2>

              {[
                { icon: Mail, label: "Email hỗ trợ", value: "support@hoclotrinh.vn", sub: "Phản hồi trong 24 giờ" },
                { icon: Phone, label: "Điện thoại", value: "+84 (028) 3600 0000", sub: "Thứ 2 - Thứ 6, 8:00 - 17:00" },
                { icon: MapPin, label: "Địa chỉ", value: "TP. Hồ Chí Minh", sub: "Việt Nam" },
              ].map(({ icon: Icon, label, value, sub }) => (
                <div key={label} className="flex items-start gap-4 bg-white dark:bg-[#2d2f31] border border-[#d1d7dc] dark:border-[#3e4143] rounded p-5">
                  <div className="w-10 h-10 rounded flex items-center justify-center flex-shrink-0" style={{ background: "rgba(86,36,208,0.08)" }}>
                    <Icon className="w-5 h-5 text-[#5624d0]" />
                  </div>
                  <div>
                    <p className="text-xs text-[#6a6f73] mb-0.5">{label}</p>
                    <p className="text-sm font-bold text-[#2d2f31] dark:text-white">{value}</p>
                    <p className="text-xs text-[#6a6f73] mt-0.5">{sub}</p>
                  </div>
                </div>
              ))}

              {/* Response time badge */}
              <div className="bg-[#f3f0ff] dark:bg-[rgba(164,53,240,0.1)] border border-[#e9e0ff] dark:border-[rgba(164,53,240,0.25)] rounded p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-[#5624d0]" />
                  <span className="text-sm font-bold text-[#5624d0]">Thời gian phản hồi</span>
                </div>
                <p className="text-xs text-[#6a6f73]">
                  Chúng tôi cam kết phản hồi mọi yêu cầu trong vòng <strong>24 giờ làm việc</strong>. Câu hỏi khẩn cấp liên hệ qua điện thoại.
                </p>
              </div>
            </div>

            {/* Right - Contact form */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-[#2d2f31] border border-[#d1d7dc] dark:border-[#3e4143] rounded p-8">
                {submitted ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-[#dcfce7] rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="w-8 h-8 text-[#16a34a]" />
                    </div>
                    <h3 className="text-xl font-bold text-[#2d2f31] dark:text-white mb-2">Tin nhắn đã được gửi!</h3>
                    <p className="text-[#6a6f73] mb-6">Chúng tôi sẽ liên hệ lại với bạn trong vòng 24 giờ.</p>
                    <button onClick={() => { setSubmitted(false); setForm({ name: "", email: "", subject: "", message: "" }); }}
                      className="inline-flex items-center gap-2 px-6 py-2.5 border border-[#2d2f31] dark:border-white text-[#2d2f31] dark:text-white font-bold text-sm hover:bg-[#f7f9fa] dark:hover:bg-[#3e4143] transition-colors rounded">
                      Gửi tin nhắn khác
                    </button>
                  </div>
                ) : (
                  <>
                    <h2 className="text-xl font-bold text-[#2d2f31] dark:text-white mb-6">Gửi tin nhắn cho chúng tôi</h2>
                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="grid sm:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-sm font-bold mb-1.5 text-[#2d2f31] dark:text-white">Họ tên *</label>
                          <input
                            required
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className="w-full px-4 py-3 border border-[#d1d7dc] dark:border-[#6a6f73] bg-transparent text-[#2d2f31] dark:text-white rounded outline-none focus:border-[#5624d0] text-sm transition-colors"
                            placeholder="Nguyễn Văn A"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold mb-1.5 text-[#2d2f31] dark:text-white">Email *</label>
                          <input
                            required type="email"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            className="w-full px-4 py-3 border border-[#d1d7dc] dark:border-[#6a6f73] bg-transparent text-[#2d2f31] dark:text-white rounded outline-none focus:border-[#5624d0] text-sm transition-colors"
                            placeholder="email@example.com"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-bold mb-1.5 text-[#2d2f31] dark:text-white">Chủ đề *</label>
                        <select
                          required
                          value={form.subject}
                          onChange={(e) => setForm({ ...form, subject: e.target.value })}
                          className="w-full px-4 py-3 border border-[#d1d7dc] dark:border-[#6a6f73] bg-white dark:bg-[#2d2f31] text-[#2d2f31] dark:text-white rounded outline-none focus:border-[#5624d0] text-sm transition-colors"
                        >
                          <option value="">Chọn chủ đề...</option>
                          <option value="technical">Hỗ trợ kỹ thuật</option>
                          <option value="billing">Thanh toán & Hóa đơn</option>
                          <option value="course">Câu hỏi về khóa học</option>
                          <option value="teacher">Đăng ký làm giáo viên</option>
                          <option value="partnership">Hợp tác kinh doanh</option>
                          <option value="other">Khác</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold mb-1.5 text-[#2d2f31] dark:text-white">Nội dung *</label>
                        <textarea
                          required
                          value={form.message}
                          onChange={(e) => setForm({ ...form, message: e.target.value })}
                          rows={6}
                          className="w-full px-4 py-3 border border-[#d1d7dc] dark:border-[#6a6f73] bg-transparent text-[#2d2f31] dark:text-white rounded outline-none focus:border-[#5624d0] text-sm transition-colors resize-none"
                          placeholder="Mô tả chi tiết vấn đề hoặc câu hỏi của bạn..."
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex items-center gap-2 px-8 py-3 bg-[#a435f0] hover:bg-[#8710d8] text-white font-bold text-sm transition-colors rounded disabled:opacity-60"
                      >
                        {loading ? (
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                        {loading ? "Đang gửi..." : "Gửi tin nhắn"}
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
