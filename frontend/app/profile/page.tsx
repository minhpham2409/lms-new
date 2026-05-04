"use client";

import { useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { User, Mail, Phone, MapPin, Camera, Save, Shield, Bell, Key } from "lucide-react";

export default function ProfilePage() {
  const [tab, setTab] = useState<"info" | "security" | "notifications">("info");
  const [form, setForm] = useState({
    firstName: "Nguyễn", lastName: "Văn A", email: "nguyenvana@email.com",
    phone: "0901234567", address: "TP. Hồ Chí Minh", bio: "Học sinh lớp 8, yêu thích Toán học",
  });

  const tabs = [
    { id: "info" as const, label: "Thông tin", icon: User },
    { id: "security" as const, label: "Bảo mật", icon: Shield },
    { id: "notifications" as const, label: "Thông báo", icon: Bell },
  ];

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <Navbar />
      <div className="pt-20 pb-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-extrabold mb-6">Hồ sơ cá nhân</h1>

          {/* Avatar */}
          <div className="card-base mb-6 flex items-center gap-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold text-white" style={{ background: "linear-gradient(135deg, #7c3aed, #0891b2)" }}>
                NA
              </div>
              <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#7c3aed" }}>
                <Camera className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
            <div>
              <h2 className="text-lg font-bold">Nguyễn Văn A</h2>
              <p className="text-sm" style={{ color: "#8892a4" }}>Học sinh • Tham gia 6 tháng trước</p>
              <div className="flex gap-2 mt-2">
                <span className="badge badge-primary">3 khóa học</span>
                <span className="badge badge-success">1 chứng chỉ</span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: tab === id ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${tab === id ? "rgba(124,58,237,0.4)" : "rgba(255,255,255,0.08)"}`,
                  color: tab === id ? "#a78bfa" : "#8892a4",
                }}
              >
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {tab === "info" && (
            <div className="card-base">
              <h3 className="font-bold mb-5">Thông tin cá nhân</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { label: "Họ", key: "firstName", icon: User },
                  { label: "Tên", key: "lastName", icon: User },
                  { label: "Email", key: "email", icon: Mail },
                  { label: "Số điện thoại", key: "phone", icon: Phone },
                ].map(({ label, key, icon: Icon }) => (
                  <div key={key}>
                    <label className="block text-sm font-medium mb-2">{label}</label>
                    <div className="relative">
                      <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#8892a4" }} />
                      <input
                        value={(form as any)[key]}
                        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                        className="input-base pl-11"
                      />
                    </div>
                  </div>
                ))}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-2">Địa chỉ</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#8892a4" }} />
                    <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="input-base pl-11" />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-2">Giới thiệu</label>
                  <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} className="input-base resize-none" />
                </div>
              </div>
              <button className="btn-primary mt-6"><Save className="w-4 h-4" /> Lưu thay đổi</button>
            </div>
          )}

          {tab === "security" && (
            <div className="card-base">
              <h3 className="font-bold mb-5">Đổi mật khẩu</h3>
              <div className="space-y-4 max-w-md">
                {["Mật khẩu hiện tại", "Mật khẩu mới", "Xác nhận mật khẩu mới"].map((label) => (
                  <div key={label}>
                    <label className="block text-sm font-medium mb-2">{label}</label>
                    <div className="relative">
                      <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#8892a4" }} />
                      <input type="password" placeholder="••••••••" className="input-base pl-11" />
                    </div>
                  </div>
                ))}
                <button className="btn-primary"><Save className="w-4 h-4" /> Cập nhật mật khẩu</button>
              </div>
            </div>
          )}

          {tab === "notifications" && (
            <div className="card-base">
              <h3 className="font-bold mb-5">Cài đặt thông báo</h3>
              <div className="space-y-4">
                {[
                  { label: "Thông báo email", desc: "Nhận thông báo qua email" },
                  { label: "Bài học mới", desc: "Khi giáo viên thêm bài học mới" },
                  { label: "Nhắc nhở học tập", desc: "Nhắc nhở học hàng ngày" },
                  { label: "Kết quả bài kiểm tra", desc: "Khi có kết quả mới" },
                ].map(({ label, desc }) => (
                  <div key={label} className="flex items-center justify-between py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                    <div>
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-xs" style={{ color: "#8892a4" }}>{desc}</p>
                    </div>
                    <button className="w-11 h-6 rounded-full relative transition-colors" style={{ background: "rgba(124,58,237,0.5)" }}>
                      <div className="w-5 h-5 rounded-full bg-white absolute top-0.5 right-0.5 transition-all" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
