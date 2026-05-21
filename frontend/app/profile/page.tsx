"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/components/auth/auth-state";
import { User, Mail, Shield, Key, Loader2, Settings, Camera, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

const TAB_ITEMS = [
  { id: "info", label: "Hồ sơ công khai", icon: User },
  { id: "security", label: "Bảo mật tài khoản", icon: Shield },
  { id: "sessions", label: "Phiên đăng nhập", icon: Settings },
];

export default function ProfilePage() {
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<"info" | "security" | "sessions">("info");
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", address: "", bio: "" });
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [pwSaving, setPwSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !token) router.push("/auth/login");
  }, [authLoading, token, router]);

  useEffect(() => {
    if (user) {
      setForm({
        firstName: user.firstName || "", lastName: user.lastName || "",
        email: user.email || "", phone: (user as any).phone || "",
        address: (user as any).address || "", bio: (user as any).bio || "",
      });
    }
  }, [user]);

  async function saveProfile() {
    setSaving(true);
    setSaveSuccess(false);
    try {
      const res = await fetch(`${API}/auth/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ firstName: form.firstName, lastName: form.lastName, bio: form.bio }),
      });
      if (res.ok) { toast.success("Đã lưu thay đổi!"); setSaveSuccess(true); setTimeout(() => setSaveSuccess(false), 3000); }
      else { const d = await res.json(); toast.error(d.message || "Lỗi lưu hồ sơ"); }
    } catch { toast.error("Lỗi kết nối"); }
    finally { setSaving(false); }
  }

  async function changePassword() {
    if (pwForm.newPassword !== pwForm.confirmPassword) { toast.error("Mật khẩu mới không khớp"); return; }
    if (pwForm.newPassword.length < 6) { toast.error("Mật khẩu mới tối thiểu 6 ký tự"); return; }
    setPwSaving(true);
    try {
      const res = await fetch(`${API}/auth/change-password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ oldPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }),
      });
      if (res.ok) { toast.success("Đã đổi mật khẩu thành công!"); setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" }); }
      else { const d = await res.json(); toast.error(d.message || "Sai mật khẩu hiện tại"); }
    } catch { toast.error("Lỗi kết nối"); }
    finally { setPwSaving(false); }
  }

  const roleLabels: Record<string, { label: string; color: string; bg: string }> = {
    student: { label: "Học sinh", color: "#F8B486", bg: "#f3f0ff" },
    teacher: { label: "Giáo viên", color: "#94A3B8", bg: "#e0f2fe" },
    parent: { label: "Phụ huynh", color: "#FFCCAA", bg: "#fef3c7" },
    admin: { label: "Quản trị", color: "#F8B486", bg: "#fee2e2" },
  };
  const roleInfo = roleLabels[user?.role || ""] || { label: user?.role || "", color: "#6a6f73", bg: "#f7f9fa" };
  const initials = ((user?.firstName?.charAt(0) || "") + (user?.lastName?.charAt(0) || user?.username?.charAt(0) || "?")).toUpperCase();
  const displayName = user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : user?.username || "";

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#1c1d1f]">
        <Loader2 className="w-8 h-8 animate-spin text-[#FFCCAA]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#1c1d1f]">
      <Navbar />

      {/* Page Header */}
      <div className="border-b border-[#d1d7dc] dark:border-[#3e4143] bg-white dark:bg-[#1c1d1f] pt-[70px]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold text-[#2d2f31] dark:text-white">Cài đặt tài khoản</h1>
          <p className="text-sm text-[#6a6f73] mt-1">Quản lý hồ sơ cá nhân và cài đặt bảo mật của bạn</p>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Sidebar */}
          <aside className="lg:w-72 flex-shrink-0">
            {/* User card */}
            <div className="bg-white dark:bg-[#2d2f31] border border-[#d1d7dc] dark:border-[#3e4143] rounded p-5 mb-5">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold text-white" style={{ background: "#FFCCAA" }}>
                    {initials}
                  </div>
                  <button className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#2d2f31] dark:bg-white rounded-full flex items-center justify-center">
                    <Camera className="w-2.5 h-2.5 text-white dark:text-[#2d2f31]" />
                  </button>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-[#2d2f31] dark:text-white truncate">{displayName}</p>
                  <p className="text-xs text-[#6a6f73] truncate">{user?.email}</p>
                  <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded text-xs font-bold" style={{ background: roleInfo.bg, color: roleInfo.color }}>
                    {roleInfo.label}
                  </span>
                </div>
              </div>
            </div>

            {/* Nav */}
            <nav className="bg-white dark:bg-[#2d2f31] border border-[#d1d7dc] dark:border-[#3e4143] rounded overflow-hidden">
              {TAB_ITEMS.map(({ id, label, icon: Icon }, i) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as "info" | "security" | "sessions")}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm font-medium transition-colors text-left ${i < TAB_ITEMS.length - 1 ? "border-b border-[#d1d7dc] dark:border-[#3e4143]" : ""} ${activeTab === id ? "bg-[#f3f0ff] dark:bg-[rgba(164,53,240,0.1)] text-[#F8B486] dark:text-[#c0a5f7] font-bold" : "text-[#2d2f31] dark:text-[#b0b5b9] hover:bg-[#f7f9fa] dark:hover:bg-[#3e4143]"}`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {label}
                </button>
              ))}
            </nav>
          </aside>

          {/* Main content */}
          <div className="flex-1">
            {/* Profile Info Tab */}
            {activeTab === "info" && (
              <div className="bg-white dark:bg-[#2d2f31] border border-[#d1d7dc] dark:border-[#3e4143] rounded">
                <div className="px-6 py-5 border-b border-[#d1d7dc] dark:border-[#3e4143]">
                  <h2 className="text-lg font-bold text-[#2d2f31] dark:text-white">Hồ sơ công khai</h2>
                  <p className="text-sm text-[#6a6f73] mt-1">Thông tin này sẽ hiển thị cho cộng đồng và giáo viên</p>
                </div>
                <div className="p-6">
                  <div className="space-y-5 max-w-2xl">
                    <div className="grid sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-bold mb-1.5 text-[#2d2f31] dark:text-white">Họ *</label>
                        <input
                          value={form.firstName}
                          onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                          className="w-full px-4 py-3 border border-[#d1d7dc] dark:border-[#6a6f73] bg-transparent text-[#2d2f31] dark:text-white rounded outline-none focus:border-[#F8B486] text-sm transition-colors"
                          placeholder="Nguyễn"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold mb-1.5 text-[#2d2f31] dark:text-white">Tên *</label>
                        <input
                          value={form.lastName}
                          onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                          className="w-full px-4 py-3 border border-[#d1d7dc] dark:border-[#6a6f73] bg-transparent text-[#2d2f31] dark:text-white rounded outline-none focus:border-[#F8B486] text-sm transition-colors"
                          placeholder="Văn A"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-1.5 text-[#2d2f31] dark:text-white">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6a6f73]" />
                        <input
                          value={form.email}
                          disabled
                          className="w-full pl-10 pr-4 py-3 border border-[#d1d7dc] dark:border-[#3e4143] bg-[#f7f9fa] dark:bg-[#1c1d1f] text-[#6a6f73] rounded text-sm cursor-not-allowed"
                        />
                      </div>
                      <p className="text-xs text-[#6a6f73] mt-1">Email không thể thay đổi sau khi đăng ký</p>
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-1.5 text-[#2d2f31] dark:text-white">Tiểu sử</label>
                      <textarea
                        value={form.bio}
                        onChange={(e) => setForm({ ...form, bio: e.target.value })}
                        rows={4}
                        className="w-full px-4 py-3 border border-[#d1d7dc] dark:border-[#6a6f73] bg-transparent text-[#2d2f31] dark:text-white rounded outline-none focus:border-[#F8B486] text-sm transition-colors resize-none"
                        placeholder="Giới thiệu đôi nét về bản thân, sở thích học tập hoặc kinh nghiệm của bạn..."
                        maxLength={500}
                      />
                      <p className="text-xs text-[#6a6f73] text-right mt-1">{form.bio.length}/500</p>
                    </div>
                    <div className="pt-4 border-t border-[#d1d7dc] dark:border-[#3e4143] flex items-center gap-4">
                      <button
                        onClick={saveProfile}
                        disabled={saving}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-[#FFCCAA] hover:bg-[#8710d8] text-white font-bold text-sm transition-colors rounded disabled:opacity-60"
                      >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        {saving ? "Đang lưu..." : "Lưu thay đổi"}
                      </button>
                      {saveSuccess && (
                        <span className="flex items-center gap-1.5 text-sm text-[#F8B486] font-medium">
                          <CheckCircle2 className="w-4 h-4" /> Đã lưu thành công!
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === "security" && (
              <div className="bg-white dark:bg-[#2d2f31] border border-[#d1d7dc] dark:border-[#3e4143] rounded">
                <div className="px-6 py-5 border-b border-[#d1d7dc] dark:border-[#3e4143]">
                  <h2 className="text-lg font-bold text-[#2d2f31] dark:text-white">Bảo mật tài khoản</h2>
                  <p className="text-sm text-[#6a6f73] mt-1">Thay đổi mật khẩu để bảo vệ tài khoản của bạn</p>
                </div>
                <div className="p-6">
                  <div className="space-y-5 max-w-md">
                    <div>
                      <label className="block text-sm font-bold mb-1.5 text-[#2d2f31] dark:text-white">Mật khẩu hiện tại *</label>
                      <div className="relative">
                        <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6a6f73]" />
                        <input
                          type="password"
                          value={pwForm.currentPassword}
                          onChange={e => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                          placeholder="••••••••"
                          className="w-full pl-10 pr-4 py-3 border border-[#d1d7dc] dark:border-[#6a6f73] bg-transparent text-[#2d2f31] dark:text-white rounded outline-none focus:border-[#F8B486] text-sm transition-colors"
                        />
                      </div>
                    </div>

                    <hr className="border-[#d1d7dc] dark:border-[#3e4143]" />

                    <div>
                      <label className="block text-sm font-bold mb-1.5 text-[#2d2f31] dark:text-white">Mật khẩu mới *</label>
                      <input
                        type="password"
                        value={pwForm.newPassword}
                        onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })}
                        placeholder="••••••••"
                        className="w-full px-4 py-3 border border-[#d1d7dc] dark:border-[#6a6f73] bg-transparent text-[#2d2f31] dark:text-white rounded outline-none focus:border-[#F8B486] text-sm transition-colors"
                      />
                      <p className="text-xs text-[#6a6f73] mt-1.5">Mật khẩu phải có ít nhất 6 ký tự</p>
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-1.5 text-[#2d2f31] dark:text-white">Xác nhận mật khẩu mới *</label>
                      <input
                        type="password"
                        value={pwForm.confirmPassword}
                        onChange={e => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                        placeholder="••••••••"
                        className={`w-full px-4 py-3 border bg-transparent text-[#2d2f31] dark:text-white rounded outline-none text-sm transition-colors ${pwForm.confirmPassword && pwForm.newPassword !== pwForm.confirmPassword ? "border-[#F8B486]" : "border-[#d1d7dc] dark:border-[#6a6f73] focus:border-[#F8B486]"}`}
                      />
                      {pwForm.confirmPassword && pwForm.newPassword !== pwForm.confirmPassword && (
                        <p className="text-xs text-[#F8B486] mt-1.5">Mật khẩu không khớp</p>
                      )}
                    </div>
                    <div className="pt-4 border-t border-[#d1d7dc] dark:border-[#3e4143]">
                      <button
                        onClick={changePassword}
                        disabled={pwSaving || !pwForm.currentPassword || !pwForm.newPassword || !pwForm.confirmPassword}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-[#2d2f31] dark:bg-white text-white dark:text-[#2d2f31] font-bold text-sm transition-colors rounded disabled:opacity-60 hover:bg-[#3e4143] dark:hover:bg-[#f7f9fa]"
                      >
                        {pwSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        {pwSaving ? "Đang đổi..." : "Đổi mật khẩu"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sessions Tab */}
            {activeTab === "sessions" && (
              <div className="bg-white dark:bg-[#2d2f31] border border-[#d1d7dc] dark:border-[#3e4143] rounded">
                <div className="px-6 py-5 border-b border-[#d1d7dc] dark:border-[#3e4143]">
                  <h2 className="text-lg font-bold text-[#2d2f31] dark:text-white">Phiên đăng nhập</h2>
                  <p className="text-sm text-[#6a6f73] mt-1">Quản lý các phiên đăng nhập hiện tại của bạn</p>
                </div>
                <div className="p-6">
                  <div className="space-y-4 max-w-2xl">
                    <div className="flex items-center gap-4 p-4 border border-[#d1d7dc] dark:border-[#3e4143] rounded bg-[#f7f9fa] dark:bg-[#1c1d1f]">
                      <div className="w-10 h-10 rounded-full bg-[#F8B486]/10 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-[#F8B486]" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-sm text-[#2d2f31] dark:text-white">Phiên hiện tại</p>
                        <p className="text-xs text-[#6a6f73]">
                          Trình duyệt web • Đang hoạt động
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold bg-[#F8B486]/10 text-[#F8B486]">
                        <CheckCircle2 className="w-3 h-3" /> Hiện tại
                      </span>
                    </div>
                    <p className="text-sm text-[#6a6f73]">
                      Nếu bạn nghi ngờ tài khoản bị truy cập trái phép, hãy đổi mật khẩu ngay trong tab &quot;Bảo mật tài khoản&quot;.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      <Footer />
    </div>
  );
}
