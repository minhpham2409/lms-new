"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/components/auth/auth-state";
import { User, Mail, Phone, MapPin, Camera, Save, Shield, Bell, Key, Loader2 } from "lucide-react";
import { toast } from "sonner";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

export default function ProfilePage() {
  const { user, token } = useAuth();
  const [tab, setTab] = useState<"info" | "security">("info");
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", address: "", bio: "" });
  const [saving, setSaving] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [pwSaving, setPwSaving] = useState(false);

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
    try {
      const res = await fetch(`${API}/auth/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      if (res.ok) toast.success("Đã lưu thay đổi!");
      else { const d = await res.json(); toast.error(d.message || "Lỗi lưu profile"); }
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
      if (res.ok) { toast.success("Đã đổi mật khẩu!"); setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" }); }
      else { const d = await res.json(); toast.error(d.message || "Sai mật khẩu hiện tại"); }
    } catch { toast.error("Lỗi kết nối"); }
    finally { setPwSaving(false); }
  }

  const tabs = [
    { id: "info" as const, label: "Thông tin", icon: User },
    { id: "security" as const, label: "Bảo mật", icon: Shield },
  ];

  const roleLabels: Record<string, string> = { student: "Học sinh", teacher: "Giáo viên", parent: "Phụ huynh", admin: "Admin" };
  const initials = (user?.firstName?.charAt(0) || "") + (user?.lastName?.charAt(0) || user?.username?.charAt(0) || "?");

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <Navbar />
      <div className="pt-20 pb-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-extrabold mb-6">Hồ sơ cá nhân</h1>

          <div className="card-base mb-6 flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold text-white" style={{ background: "linear-gradient(135deg, #7c3aed, #0891b2)" }}>
              {initials.toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-bold">{user?.firstName || user?.username || "—"} {user?.lastName || ""}</h2>
              <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>{roleLabels[user?.role || ""] || user?.role} • {user?.email}</p>
            </div>
          </div>

          <div className="flex gap-2 mb-6">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setTab(id)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: tab === id ? "rgba(124,58,237,0.2)" : "var(--muted)",
                  border: `1px solid ${tab === id ? "rgba(124,58,237,0.4)" : "var(--border)"}`,
                  color: tab === id ? "#a78bfa" : "var(--foreground-muted)",
                }}>
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </div>

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
                      <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--foreground-muted)" }} />
                      <input value={(form as any)[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="input-base pl-11" />
                    </div>
                  </div>
                ))}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-2">Địa chỉ</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--foreground-muted)" }} />
                    <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="input-base pl-11" />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-2">Giới thiệu</label>
                  <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} className="input-base resize-none" />
                </div>
              </div>
              <button onClick={saveProfile} disabled={saving} className="btn-primary mt-6">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Lưu thay đổi
              </button>
            </div>
          )}

          {tab === "security" && (
            <div className="card-base">
              <h3 className="font-bold mb-5">Đổi mật khẩu</h3>
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium mb-2">Mật khẩu hiện tại</label>
                  <div className="relative">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--foreground-muted)" }} />
                    <input type="password" value={pwForm.currentPassword} onChange={e => setPwForm({ ...pwForm, currentPassword: e.target.value })} placeholder="••••••••" className="input-base pl-11" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Mật khẩu mới</label>
                  <div className="relative">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--foreground-muted)" }} />
                    <input type="password" value={pwForm.newPassword} onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })} placeholder="••••••••" className="input-base pl-11" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Xác nhận mật khẩu mới</label>
                  <div className="relative">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--foreground-muted)" }} />
                    <input type="password" value={pwForm.confirmPassword} onChange={e => setPwForm({ ...pwForm, confirmPassword: e.target.value })} placeholder="••••••••" className="input-base pl-11" />
                  </div>
                </div>
                <button onClick={changePassword} disabled={pwSaving} className="btn-primary">
                  {pwSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Cập nhật mật khẩu
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
