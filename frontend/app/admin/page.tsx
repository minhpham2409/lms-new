"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/components/auth/auth-state";
import {
  Users, BookOpen, DollarSign, TrendingUp, Shield, BarChart3, Search,
  Eye, Trash2, UserCheck, UserX,
  Tag, Package, RefreshCw, Activity, Wallet,
  CheckCircle2, Clock, XCircle, Loader2, BanknoteIcon, AlertTriangle,
  Server, Percent, Flag, Lock, Unlock,
} from "lucide-react";
import { toast } from "sonner";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";
const ADMIN_PAGE_SIZE = 10;

const roleColors: Record<string, string> = { student: "#FFCCAA", teacher: "#94A3B8", parent: "#FFCCAA", admin: "#F8B486" };
const roleLabels: Record<string, string> = { student: "Học sinh", teacher: "Giáo viên", parent: "Phụ huynh", admin: "Admin" };
const statusIcons: Record<string, { color: string; Icon: any }> = {
  completed: { color: "#F8B486", Icon: CheckCircle2 }, paid: { color: "#F8B486", Icon: CheckCircle2 },
  pending: { color: "#FFCCAA", Icon: Clock }, refunded: { color: "#F8B486", Icon: XCircle },
  active: { color: "#F8B486", Icon: CheckCircle2 }, expired: { color: "#F8B486", Icon: XCircle },
};

type Tab = "overview" | "revenue" | "users" | "courses" | "orders" | "coupons" | "payouts" | "queues" | "race" | "fee";

function CreateTeacherModal({ onClose, onCreate, prefill }: {
  onClose: () => void;
  onCreate: (data: any) => Promise<void>;
  prefill?: { fullName?: string; email?: string; phone?: string; expertise?: string; experience?: string; message?: string };
}) {
  // Auto-fill from teacher application if available
  const nameParts = (prefill?.fullName || "").trim().split(/\s+/);
  const autoLastName = nameParts.pop() || "";
  const autoFirstName = nameParts.join(" ");
  const autoUsername = (prefill?.email || "").split("@")[0].replace(/[^a-z0-9_]/gi, "").toLowerCase();

  const [form, setForm] = useState({
    username: autoUsername,
    email: prefill?.email || "",
    firstName: autoFirstName,
    lastName: autoLastName,
    password: "",
    phone: prefill?.phone || "",
    expertise: prefill?.expertise || "",
    experience: prefill?.experience || "",
    message: prefill?.message || "",
  });
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.username || !form.email || !form.password) return;
    setSaving(true);
    // Merge phone/expertise/experience/message into bio field
    const bioParts = [
      form.phone && `📞 SĐT: ${form.phone}`,
      form.expertise && `🎓 Chuyên môn: ${form.expertise}`,
      form.experience && `📝 Kinh nghiệm: ${form.experience}`,
      form.message && `💬 ${form.message}`,
    ].filter(Boolean);
    const bio = bioParts.join("\n");
    await onCreate({
      username: form.username,
      email: form.email,
      firstName: form.firstName,
      lastName: form.lastName,
      password: form.password,
      role: "teacher",
      ...(bio && { bio }),
    });
    setSaving(false);
    onClose();
  }

  const inputCls = "w-full px-3 py-2 border border-[#d1d7dc] dark:border-[#6a6f73] bg-transparent text-sm text-[#2d2f31] dark:text-white rounded outline-none focus:border-[#F8B486] transition-colors";
  const labelCls = "block text-xs font-bold mb-1 text-[#2d2f31] dark:text-white";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-[#2d2f31] border border-[#d1d7dc] dark:border-[#3e4143] rounded-lg w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#d1d7dc] dark:border-[#3e4143]">
          <div>
            {prefill && <p className="text-[10px] font-bold text-[#F8B486] uppercase tracking-wide">Từ đơn đăng ký</p>}
            <h3 className="text-base font-bold text-[#2d2f31] dark:text-white">Tạo tài khoản giáo viên</h3>
          </div>
          <button onClick={onClose} className="text-[#6a6f73] hover:text-[#2d2f31] dark:hover:text-white transition-colors">✕</button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          {/* Section: Thông tin cơ bản */}
          <p className="text-xs font-bold text-[#6a6f73] uppercase tracking-wide">Thông tin tài khoản</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Họ</label>
              <input value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} placeholder="Nguyễn Văn" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Tên</label>
              <input value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} placeholder="A" className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Username *</label>
              <input value={form.username} onChange={e => setForm({...form, username: e.target.value})} placeholder="teacher_name" required className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Mật khẩu *</label>
              <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="Ít nhất 6 ký tự" required minLength={6} className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Email *</label>
              <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="teacher@email.com" required className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Số điện thoại</label>
              <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="0912 345 678" className={inputCls} />
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-[#d1d7dc] dark:border-[#3e4143]" />

          {/* Section: Hồ sơ giảng viên */}
          <p className="text-xs font-bold text-[#6a6f73] uppercase tracking-wide">Hồ sơ giảng viên</p>
          <div>
            <label className={labelCls}>Chuyên môn</label>
            <input value={form.expertise} onChange={e => setForm({...form, expertise: e.target.value})} placeholder="Toán, Vật lý, Lập trình..." className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Kinh nghiệm giảng dạy</label>
            <textarea value={form.experience} onChange={e => setForm({...form, experience: e.target.value})} placeholder="VD: 5 năm dạy THPT, có kênh YouTube 10K sub..." rows={2} className={`${inputCls} resize-none`} />
          </div>
          <div>
            <label className={labelCls}>Giới thiệu / Ghi chú</label>
            <textarea value={form.message} onChange={e => setForm({...form, message: e.target.value})} placeholder="Thông tin thêm, link portfolio nếu có..." rows={3} className={`${inputCls} resize-none`} />
          </div>

          <div className="pt-2 flex gap-3">
            <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-[#FFCCAA] hover:bg-[#e09a70] text-white font-bold text-sm rounded transition-colors disabled:opacity-60">
              {saving ? "Đang tạo..." : "Tạo tài khoản giáo viên"}
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2.5 border border-[#d1d7dc] dark:border-[#6a6f73] text-sm font-bold text-[#2d2f31] dark:text-white rounded hover:bg-[#f7f9fa] dark:hover:bg-[#3e4143] transition-colors">
              Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CreateCouponModal({ onClose, onCreate }: { onClose: () => void; onCreate: (data: any) => Promise<void> }) {
  const [form, setForm] = useState({ code: "", discount: 10, maxUses: "", expiresAt: "", isActive: true });
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.code || form.discount <= 0) return;
    setSaving(true);
    const data: any = { 
      code: form.code, 
      discount: Number(form.discount),
      isActive: form.isActive 
    };
    if (form.maxUses) data.maxUses = Number(form.maxUses);
    if (form.expiresAt) data.expiresAt = new Date(form.expiresAt).toISOString();
    
    await onCreate(data);
    setSaving(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-[#2d2f31] border border-[#d1d7dc] dark:border-[#3e4143] rounded w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#d1d7dc] dark:border-[#3e4143]">
          <h3 className="text-base font-bold text-[#2d2f31] dark:text-white">Tạo mã giảm giá</h3>
          <button onClick={onClose} className="text-[#6a6f73] hover:text-[#2d2f31] dark:hover:text-white transition-colors">✕</button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold mb-1 text-[#2d2f31] dark:text-white">Mã Coupon *</label>
            <input value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} placeholder="GIAM10" required className="w-full px-3 py-2 border border-[#d1d7dc] dark:border-[#6a6f73] bg-transparent text-sm text-[#2d2f31] dark:text-white rounded outline-none focus:border-[#F8B486] uppercase" />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1 text-[#2d2f31] dark:text-white">Phần trăm giảm (%) *</label>
            <input type="number" min="1" max="100" value={form.discount} onChange={e => setForm({...form, discount: Number(e.target.value)})} required className="w-full px-3 py-2 border border-[#d1d7dc] dark:border-[#6a6f73] bg-transparent text-sm text-[#2d2f31] dark:text-white rounded outline-none focus:border-[#F8B486]" />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1 text-[#2d2f31] dark:text-white">Số lần dùng tối đa (Tùy chọn)</label>
            <input type="number" min="1" value={form.maxUses} onChange={e => setForm({...form, maxUses: e.target.value})} placeholder="Để trống nếu không giới hạn" className="w-full px-3 py-2 border border-[#d1d7dc] dark:border-[#6a6f73] bg-transparent text-sm text-[#2d2f31] dark:text-white rounded outline-none focus:border-[#F8B486]" />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1 text-[#2d2f31] dark:text-white">Ngày hết hạn (Tùy chọn)</label>
            <input type="date" value={form.expiresAt} onChange={e => setForm({...form, expiresAt: e.target.value})} className="w-full px-3 py-2 border border-[#d1d7dc] dark:border-[#6a6f73] bg-transparent text-sm text-[#2d2f31] dark:text-white rounded outline-none focus:border-[#F8B486]" />
          </div>
          <div className="pt-2 flex gap-3">
            <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-[#FFCCAA] hover:bg-[#8710d8] text-white font-bold text-sm rounded transition-colors disabled:opacity-60">
              {saving ? "Đang tạo..." : "Tạo mã"}
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2.5 border border-[#d1d7dc] dark:border-[#6a6f73] text-sm font-bold text-[#2d2f31] dark:text-white rounded hover:bg-[#f7f9fa] dark:hover:bg-[#3e4143] transition-colors">
              Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AdminPageInner() {
  const router = useRouter();
  const { user, token, isLoggedIn, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<Tab>("overview");
  const [search, setSearch] = useState("");
  const [showCreateTeacher, setShowCreateTeacher] = useState<false | { prefill?: any }>(false);
  const [showCreateCoupon, setShowCreateCoupon] = useState(false);

  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [refundRequests, setRefundRequests] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any>(null);
  const [revenueDetails, setRevenueDetails] = useState<any>(null);
  const [courseStats, setCourseStats] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [queues, setQueues] = useState<any>(null);
  const [raceConfig, setRaceConfig] = useState<any>(null);
  const [feeConfig, setFeeConfig] = useState<any>(null);
  const [pageByTab, setPageByTab] = useState<Partial<Record<Tab, number>>>({});

  useEffect(() => {
    if (authLoading) return;
    if (!isLoggedIn) { router.push("/auth/login"); return; }
    if (user?.role !== "admin") {
      if (user?.role === "teacher") router.push("/teacher");
      else if (user?.role === "parent") router.push("/parent");
      else router.push("/dashboard");
    }
  }, [user, isLoggedIn, authLoading, router]);

  // Auto-open create teacher modal when redirected from notifications
  const searchParams = useSearchParams();
  useEffect(() => {
    if (searchParams.get('createTeacher') === '1') {
      try {
        const prefillRaw = searchParams.get('prefill');
        const prefill = prefillRaw ? JSON.parse(prefillRaw) : undefined;
        setShowCreateTeacher({ prefill });
        // Clean URL after reading params
        router.replace('/admin', { scroll: false });
      } catch {}
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    if (token && user?.role === "admin") fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user]);

  async function fetchAll() {
    setDataLoading(true);
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [statsR, usersR, coursesR, ordersR, couponsR, revR, revDetailR, csR, payoutsR, refundsR, queuesR, raceR, feeR] = await Promise.all([
        fetch(`${API}/admin/dashboard`, { headers }).then(r => r.ok ? r.json() : null),
        fetch(`${API}/admin/users`, { headers }).then(r => r.ok ? r.json() : []),
        fetch(`${API}/admin/courses`, { headers }).then(r => r.ok ? r.json() : []),
        fetch(`${API}/admin/orders`, { headers }).then(r => r.ok ? r.json() : []),
        fetch(`${API}/coupons`, { headers }).then(r => r.ok ? r.json() : []),
        fetch(`${API}/admin/stats/revenue`, { headers }).then(r => r.ok ? r.json() : null),
        fetch(`${API}/admin/stats/revenue/detail`, { headers }).then(r => r.ok ? r.json() : null),
        fetch(`${API}/admin/stats/courses`, { headers }).then(r => r.ok ? r.json() : []),
        fetch(`${API}/wallets/admin/payouts`, { headers }).then(r => r.ok ? r.json() : { data: [] }),
        fetch(`${API}/admin/refund-requests`, { headers }).then(r => r.ok ? r.json() : []),
        fetch(`${API}/admin/queues/health`, { headers }).then(r => r.ok ? r.json() : null),
        fetch(`${API}/monthly-race/xp-config`, { headers }).then(r => r.ok ? r.json() : null),
        fetch(`${API}/wallets/admin/configs/fee`, { headers }).then(r => r.ok ? r.json() : null),
      ]);
      setStats(statsR);
      setUsers(Array.isArray(usersR) ? usersR : Array.isArray(usersR?.data) ? usersR.data : []);
      setCourses(Array.isArray(coursesR) ? coursesR : Array.isArray(coursesR?.data) ? coursesR.data : []);
      setOrders(Array.isArray(ordersR) ? ordersR : Array.isArray(ordersR?.data) ? ordersR.data : []);
      setCoupons(Array.isArray(couponsR) ? couponsR : Array.isArray(couponsR?.data) ? couponsR.data : []);
      setPayouts(Array.isArray(payoutsR) ? payoutsR : Array.isArray(payoutsR?.data) ? payoutsR.data : []);
      setRefundRequests(Array.isArray(refundsR) ? refundsR : []);
      setRevenueData(revR);
      setRevenueDetails(revDetailR);
      setCourseStats(Array.isArray(csR) ? csR : Array.isArray(csR?.data) ? csR.data : []);
      setQueues(queuesR);
      setRaceConfig(raceR);
      setFeeConfig(feeR);
    } catch {} finally { setDataLoading(false); }
  }

  async function deleteUser(id: string) {
    if (!confirm("Xóa người dùng này?")) return;
    try {
      const res = await fetch(`${API}/admin/users/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { setUsers(users.filter(u => u.id !== id)); toast.success("Đã xóa"); }
    } catch { toast.error("Lỗi"); }
  }

  async function toggleUserStatus(id: string, currentStatus: boolean) {
    try {
      const res = await fetch(`${API}/admin/users/${id}/status`, { 
        method: "PUT", 
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isActive: !currentStatus })
      });
      if (res.ok) { 
        setUsers(users.map(u => u.id === id ? { ...u, isActive: !currentStatus } : u));
        toast.success(currentStatus ? "Đã khóa người dùng" : "Đã mở khóa người dùng"); 
      }
    } catch { toast.error("Lỗi"); }
  }

  async function publishCourse(id: string) {
    try {
      const res = await fetch(`${API}/admin/courses/${id}/approve`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { setCourses(courses.map(c => c.id === id ? { ...c, status: "published" } : c)); toast.success("Đã xuất bản"); }
    } catch { toast.error("Lỗi"); }
  }

  async function rejectCourse(id: string) {
    if (!confirm("Từ chối khóa học này?")) return;
    try {
      const res = await fetch(`${API}/admin/courses/${id}/reject`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        setCourses(courses.map(c => c.id === id ? { ...c, status: "rejected" } : c));
        toast.success("Đã từ chối");
      }
    } catch { toast.error("Lỗi"); }
  }

  async function _deleteCourse(id: string) {
    if (!confirm("Xóa khóa học này?")) return;
    try {
      const res = await fetch(`${API}/admin/courses/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { setCourses(courses.filter(c => c.id !== id)); toast.success("Đã xóa"); }
    } catch { toast.error("Lỗi"); }
  }

  async function _createUser(data: any) {
    try {
      const res = await fetch(`${API}/admin/users`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(data) });
      if (res.ok) { fetchAll(); toast.success("Đã tạo người dùng"); }
      else { const d = await res.json(); toast.error(d.message || "Lỗi"); }
    } catch { toast.error("Lỗi"); }
  }

  async function _updateUser(id: string, data: any) {
    try {
      const res = await fetch(`${API}/admin/users/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(data) });
      if (res.ok) { fetchAll(); toast.success("Đã cập nhật"); }
    } catch { toast.error("Lỗi"); }
  }

  async function _createCoupon(data: any) {
    try {
      const res = await fetch(`${API}/coupons`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(data) });
      if (res.ok) { fetchAll(); toast.success("Đã tạo mã giảm giá"); }
      else { const d = await res.json(); toast.error(d.message || "Lỗi"); }
    } catch { toast.error("Lỗi"); }
  }

  async function approvePayout(payoutId: string) {
    const bankTransferRef = prompt("Nhập mã giao dịch chuyển khoản (VD: VCB123456):");
    if (bankTransferRef === null) return;
    const adminNote = prompt("Ghi chú (tùy chọn):") || undefined;
    try {
      const res = await fetch(`${API}/wallets/admin/payouts/${payoutId}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ bankTransferRef: bankTransferRef || undefined, adminNote }),
      });
      if (res.ok) {
        setPayouts(payouts.map(p => p.id === payoutId ? { ...p, status: "APPROVED", bankTransferRef } : p));
        toast.success("Đã duyệt yêu cầu rút tiền");
      } else {
        const d = await res.json();
        toast.error(d.message || "Lỗi");
      }
    } catch { toast.error("Lỗi kết nối"); }
  }

  async function markRefundPaid(refundId: string) {
    const bankTransferRef = prompt("Nhập mã giao dịch hoàn tiền")?.trim() || "";
    if (!bankTransferRef) {
      toast.error("Cần nhập mã giao dịch hoàn tiền để audit");
      return;
    }
    try {
      const res = await fetch(`${API}/admin/refund-requests/${refundId}/paid`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ bankTransferRef }),
      });
      if (res.ok) {
        toast.success("Đã xác nhận hoàn tiền");
        fetchAll();
      } else {
        const d = await res.json();
        toast.error(d.message || "Lỗi");
      }
    } catch {
      toast.error("Lỗi kết nối");
    }
  }

  async function rejectPayout(payoutId: string) {
    const adminNote = prompt("Lý do từ chối:");
    if (!adminNote) return;
    try {
      const res = await fetch(`${API}/wallets/admin/payouts/${payoutId}/reject`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ adminNote }),
      });
      if (res.ok) {
        setPayouts(payouts.map(p => p.id === payoutId ? { ...p, status: "REJECTED", adminNote } : p));
        toast.success("Đã từ chối yêu cầu rút tiền");
      } else {
        const d = await res.json();
        toast.error(d.message || "Lỗi");
      }
    } catch { toast.error("Lỗi kết nối"); }
  }

  async function saveFeeConfig(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/wallets/admin/configs/fee`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(feeConfig) });
      if (res.ok) toast.success("Đã lưu phí nền tảng");
      else toast.error("Lỗi");
    } catch { toast.error("Lỗi"); }
  }

  async function finalizeRace() {
    if (!confirm("Chốt thi đua tháng này? Hành động này sẽ trao thưởng cho học sinh.")) return;
    try {
      const res = await fetch(`${API}/monthly-race/finalize`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { toast.success("Đã tổng kết tháng"); fetchAll(); }
      else toast.error("Lỗi");
    } catch { toast.error("Lỗi"); }
  }

  if (authLoading || !user || user.role !== "admin") {
    return (<div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
      <div className="w-8 h-8 border-2 border-[#F8B486] border-t-transparent rounded-full animate-spin" />
    </div>);
  }

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "overview", label: "Tổng quan", icon: BarChart3 },
    { id: "revenue", label: "Doanh thu", icon: BanknoteIcon },
    { id: "users", label: "Người dùng", icon: Users },
    { id: "courses", label: "Khóa học", icon: BookOpen },
    { id: "orders", label: "Đơn hàng", icon: Package },
    { id: "coupons", label: "Mã giảm giá", icon: Tag },
    { id: "payouts", label: "Rút tiền", icon: Wallet },
    { id: "queues", label: "Hệ thống", icon: Server },
    { id: "race", label: "Thi đua", icon: Flag },
    { id: "fee", label: "Phí", icon: Percent },
  ];
  const primaryTabs = tabs.slice(0, 5);
  const secondaryTabs = tabs.slice(5);
  const activeTabInfo = tabs.find(t => t.id === tab) || tabs[0];
  const isSecondaryActive = secondaryTabs.some(t => t.id === tab);

  const filteredUsers = users.filter(u => !search || u.username?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()));
  const getPaged = <T,>(items: T[], key: Tab) => {
    const totalPages = Math.max(1, Math.ceil(items.length / ADMIN_PAGE_SIZE));
    const page = Math.min(pageByTab[key] || 1, totalPages);
    const start = (page - 1) * ADMIN_PAGE_SIZE;
    return { page, totalPages, items: items.slice(start, start + ADMIN_PAGE_SIZE) };
  };
  const pagedUsers = getPaged(filteredUsers, "users");
  const pagedCourses = getPaged(courses, "courses");
  const pagedOrders = getPaged(orders, "orders");
  const pagedCoupons = getPaged(coupons, "coupons");
  const pagedPayouts = getPaged(payouts, "payouts");
  const PaginationControls = ({ pageKey, page, totalPages, totalItems }: { pageKey: Tab; page: number; totalPages: number; totalItems: number }) => {
    if (totalItems <= ADMIN_PAGE_SIZE) return null;
    return (
      <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs" style={{ color: "#6a6f73" }}>
          Trang {page}/{totalPages} · {totalItems} mục
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPageByTab(prev => ({ ...prev, [pageKey]: Math.max(1, page - 1) }))}
            disabled={page <= 1}
            className="rounded-lg border border-border px-3 py-2 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40 hover:bg-muted"
          >
            Trước
          </button>
          <button
            onClick={() => setPageByTab(prev => ({ ...prev, [pageKey]: Math.min(totalPages, page + 1) }))}
            disabled={page >= totalPages}
            className="rounded-lg border border-border px-3 py-2 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40 hover:bg-muted"
          >
            Sau
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      {showCreateTeacher && (
        <CreateTeacherModal
          onClose={() => setShowCreateTeacher(false)}
          onCreate={async (data) => { await _createUser(data); }}
          prefill={typeof showCreateTeacher === 'object' ? showCreateTeacher.prefill : undefined}
        />
      )}
      {showCreateCoupon && (
        <CreateCouponModal
          onClose={() => setShowCreateCoupon(false)}
          onCreate={async (data) => { await _createCoupon(data); }}
        />
      )}
      <Navbar />
      <div className="pt-20 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-5 rounded-2xl border border-border bg-card p-4 sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ background: "rgba(248,180,134,0.15)" }}>
                <Shield className="w-6 h-6" style={{ color: "#F8B486" }} />
              </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "#6a6f73" }}>Quản trị hệ thống</p>
                  <h1 className="truncate text-2xl font-extrabold">Admin Panel</h1>
                  <p className="text-sm" style={{ color: "#6a6f73" }}>Đang xem: <span className="font-bold text-foreground">{activeTabInfo.label}</span></p>
                </div>
              </div>
              <button onClick={fetchAll} className="btn-secondary w-full justify-center px-4 py-2.5 text-sm lg:w-auto">
                <RefreshCw className="w-4 h-4" /> Làm mới
              </button>
            </div>

            <div className="mt-5 block md:hidden">
              <select
                value={tab}
                onChange={(e) => setTab(e.target.value as Tab)}
                className="w-full rounded-lg border border-border bg-background px-3 py-3 text-sm font-bold outline-none focus:border-primary"
              >
                {tabs.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>

            <div className="mt-5 hidden items-center justify-between gap-3 md:flex">
              <div className="flex min-w-0 items-center gap-1.5 rounded-xl border border-border bg-background p-1">
                {primaryTabs.map((t) => (
                  <button key={t.id} onClick={() => setTab(t.id)}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold transition-colors lg:px-4 ${
                      tab === t.id ? "bg-primary text-primary-foreground" : "text-foreground-muted hover:bg-muted hover:text-foreground"
                    }`}>
                    <t.icon className="w-4 h-4" /> <span className="hidden lg:inline">{t.label}</span>
                  </button>
                ))}
              </div>

              <select
                value={isSecondaryActive ? tab : ""}
                onChange={(e) => { if (e.target.value) setTab(e.target.value as Tab); }}
                className={`shrink-0 rounded-xl border px-4 py-2.5 text-sm font-bold outline-none transition-colors ${
                  isSecondaryActive ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-foreground-muted"
                }`}
              >
                <option value="">Công cụ quản trị</option>
                {secondaryTabs.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>
          </div>

          {dataLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" style={{ color: "#F8B486" }} /></div>
          ) : (
            <>
              {/* OVERVIEW */}
              {tab === "overview" && (() => {
                const revMonths = revenueData?.months || [];
                const maxRev = Math.max(...revMonths.map((m: any) => m.revenue), 1);
                const roleData = stats?.usersByRole || { student: 0, teacher: 0, parent: 0, admin: 0 };
                const totalRoleUsers = Object.values(roleData).reduce((a: number, b: any) => a + (b as number), 0) as number;
                const csData = stats?.coursesByStatus || { draft: 0, pending: 0, published: 0 };
                const topCourses = [...courseStats].sort((a: any, b: any) => (b.enrollments || 0) - (a.enrollments || 0)).slice(0, 5);
                const pendingCourses = courses.filter(c => c.status === 'pending' || c.status === 'draft');
                const _completedOrders = orders.filter(o => o.status === 'completed' || o.status === 'paid');
                const pendingOrders = orders.filter(o => o.status === 'pending');
                const totalRevenue = revenueData?.totalRevenue || stats?.revenue || 0;
                const publishedRate = courses.length > 0 ? Math.round(((csData.published || 0) / courses.length) * 100) : 0;
                const paidOrders = orders.filter(o => o.status === "completed" || o.status === "paid").length;
                const paidRate = orders.length > 0 ? Math.round((paidOrders / orders.length) * 100) : 0;

                return (
                  <div className="space-y-6">
                    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-foreground-muted">Tổng quan vận hành</p>
                          <h2 className="mt-1 text-2xl font-extrabold">Tình hình hệ thống</h2>
                          <p className="mt-1 text-sm text-foreground-muted">Theo dõi người dùng, khóa học, đơn hàng và doanh thu trong một màn hình.</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                          <div className="rounded-lg border border-border bg-background px-4 py-3">
                            <p className="text-[10px] font-bold uppercase text-foreground-muted">Duyệt khóa học</p>
                            <p className="mt-1 text-lg font-extrabold text-primary">{publishedRate}%</p>
                          </div>
                          <div className="rounded-lg border border-border bg-background px-4 py-3">
                            <p className="text-[10px] font-bold uppercase text-foreground-muted">Đơn đã thu</p>
                            <p className="mt-1 text-lg font-extrabold">{paidRate}%</p>
                          </div>
                          <div className="col-span-2 rounded-lg border border-border bg-background px-4 py-3 sm:col-span-1">
                            <p className="text-[10px] font-bold uppercase text-foreground-muted">Doanh thu</p>
                            <p className="mt-1 text-lg font-extrabold">{totalRevenue.toLocaleString("vi-VN")} ₫</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Top stats */}
                    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
                      {[
                        { label: "Người dùng", value: stats?.users ?? users.length, icon: Users, color: "#F8B486", sub: `+${(stats?.recentUsers || []).length} mới` },
                        { label: "Khóa học", value: stats?.courses ?? courses.length, icon: BookOpen, color: "#94A3B8", sub: `${csData.published} xuất bản` },
                        { label: "Bài học", value: stats?.lessons ?? 0, icon: Activity, color: "#FFCCAA", sub: "tổng bài" },
                        { label: "Đăng ký", value: stats?.enrollments ?? 0, icon: TrendingUp, color: "#F8B486", sub: "lượt đăng ký" },
                        { label: "Đơn hàng", value: orders.length, icon: Package, color: "#FFCCAA", sub: `${pendingOrders.length} chờ xử lý` },
                        { label: "Doanh thu", value: totalRevenue ? `${(totalRevenue / 1000000).toFixed(1)}M` : "0", icon: DollarSign, color: "#F8B486", sub: "VNĐ" },
                      ].map(({ label, value, icon: Icon, color, sub }) => (
                        <div key={label} className="rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
                          <div className="mb-3 flex items-center justify-between">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: `${color}18` }}>
                              <Icon className="w-4 h-4" style={{ color }} />
                            </div>
                          </div>
                          <p className="text-2xl font-extrabold">{value}</p>
                          <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-foreground-muted">{label}</p>
                          <p className="mt-1 text-[10px] font-bold" style={{ color }}>{sub}</p>
                        </div>
                      ))}
                    </div>

                    <div className="grid gap-6 lg:grid-cols-3">
                      {/* Revenue chart */}
                      <div className="rounded-xl border border-border bg-card p-6 shadow-sm lg:col-span-2">
                        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <h3 className="flex items-center gap-2 text-sm font-bold">
                              <DollarSign className="w-4 h-4" style={{ color: "#F8B486" }} /> Doanh thu 12 tháng
                            </h3>
                            <p className="mt-1 text-xs text-foreground-muted">Tổng: {(revenueData?.totalRevenue || 0).toLocaleString("vi-VN")} ₫</p>
                          </div>
                          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">{revMonths.length} tháng</span>
                        </div>
                        <div className="flex items-end gap-1.5 h-44">
                          {revMonths.map((m: any, i: number) => {
                            const h = maxRev > 0 ? (m.revenue / maxRev) * 100 : 0;
                            const isLast = i === revMonths.length - 1;
                            return (
                              <div key={m.month} className="flex-1 flex flex-col items-center gap-1 group relative">
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded-lg text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                                  {m.revenue.toLocaleString()} ₫ · {m.orders} đơn
                                </div>
                                <div className="w-full rounded-t-md transition-all duration-300 hover:opacity-80" style={{
                                  height: `${Math.max(h, 4)}%`,
                                  background: isLast ? "linear-gradient(to top, #F8B486, #94A3B8)" : "rgba(248,180,134,0.25)",
                                  minHeight: 4,
                                }} />
                                <span className="text-[9px]" style={{ color: "#6a6f73" }}>{m.month.split('-')[1]}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* User role distribution */}
                      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                        <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                          <Users className="w-4 h-4" style={{ color: "#F8B486" }} /> Phân bố người dùng
                        </h3>
                        <div className="space-y-3">
                          {([
                            { role: "student", label: "Học sinh", color: "#F8B486" },
                            { role: "teacher", label: "Giáo viên", color: "#94A3B8" },
                            { role: "parent", label: "Phụ huynh", color: "#FFCCAA" },
                            { role: "admin", label: "Admin", color: "#F8B486" },
                          ] as const).map(({ role, label, color }) => {
                            const count = roleData[role] || 0;
                            const pct = totalRoleUsers > 0 ? Math.round((count / totalRoleUsers) * 100) : 0;
                            return (
                              <div key={role}>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-semibold">{label}</span>
                                  <span className="text-xs font-bold">{count} <span style={{ color: "#6a6f73" }}>({pct}%)</span></span>
                                </div>
                                <div className="w-full h-2 rounded-full" style={{ background: "var(--border)" }}>
                                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <div className="mt-4 pt-3 text-center" style={{ borderTop: "1px solid var(--border)" }}>
                          <p className="text-2xl font-extrabold gradient-text">{totalRoleUsers}</p>
                          <p className="text-[10px]" style={{ color: "#6a6f73" }}>Tổng người dùng</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-3">
                      {/* Course status */}
                      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                        <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                          <BookOpen className="w-4 h-4" style={{ color: "#94A3B8" }} /> Trạng thái khóa học
                        </h3>
                        <div className="grid grid-cols-3 gap-3 text-center mb-4">
                          {[
                            { label: "Xuất bản", value: csData.published, color: "#F8B486" },
                            { label: "Chờ duyệt", value: csData.pending, color: "#FFCCAA" },
                            { label: "Nháp", value: csData.draft, color: "#6b7280" },
                          ].map(({ label, value, color }) => (
                            <div key={label} className="p-3 rounded-xl" style={{ background: `${color}10`, border: `1px solid ${color}25` }}>
                              <p className="text-xl font-extrabold" style={{ color }}>{value}</p>
                              <p className="text-[10px]" style={{ color: "#6a6f73" }}>{label}</p>
                            </div>
                          ))}
                        </div>
                        {pendingCourses.length > 0 && (
                          <div className="p-2.5 rounded-xl" style={{ background: "rgba(255,204,170,0.08)", border: "1px solid rgba(255,204,170,0.2)" }}>
                            <p className="text-xs font-semibold flex items-center gap-1" style={{ color: "#FFCCAA" }}>
                              <Clock className="w-3 h-3" /> {pendingCourses.length} khóa học cần xử lý
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Top courses */}
                      <div className="rounded-xl border border-border bg-card p-6 shadow-sm lg:col-span-2">
                        <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" style={{ color: "#FFCCAA" }} /> Top khóa học (theo học sinh)
                        </h3>
                        {topCourses.length === 0 ? (
                          <p className="text-xs text-center py-4" style={{ color: "#6a6f73" }}>Chưa có dữ liệu</p>
                        ) : (
                          <div className="space-y-2.5">
                            {topCourses.map((c: any, i: number) => {
                              const maxEnroll = topCourses[0]?.enrollments || 1;
                              const barW = Math.max((c.enrollments / maxEnroll) * 100, 8);
                              const colors = ["#FFCCAA", "#94A3B8", "#FFCCAA", "#FFCCAA", "#F8B486"];
                              return (
                                <div key={c.id} className="flex items-center gap-3">
                                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0" style={{ background: colors[i % 5] }}>
                                    {i + 1}
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-0.5">
                                      <p className="text-xs font-semibold truncate">{c.title}</p>
                                      <span className="text-xs font-bold flex-shrink-0 ml-2" style={{ color: colors[i % 5] }}>{c.enrollments}</span>
                                    </div>
                                    <div className="w-full h-1.5 rounded-full" style={{ background: "var(--border)" }}>
                                      <div className="h-full rounded-full transition-all" style={{ width: `${barW}%`, background: colors[i % 5] }} />
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-2">
                      {/* Recent users */}
                      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                        <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                          <Users className="w-4 h-4" style={{ color: "#F8B486" }} /> Người dùng mới nhất
                        </h3>
                        <div className="space-y-2">
                          {(stats?.recentUsers || []).map((u: any) => (
                            <div key={u.id} className="flex items-center gap-3 p-2.5 rounded-xl" style={{ background: "var(--muted)" }}>
                              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: roleColors[u.role] || "#FFCCAA" }}>
                                {(u.username || "?").charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold truncate">{u.username}</p>
                                <p className="text-[10px]" style={{ color: "#6a6f73" }}>{u.email}</p>
                              </div>
                              <span className="badge text-[10px]" style={{ background: `${roleColors[u.role]}18`, color: roleColors[u.role], border: `1px solid ${roleColors[u.role]}33` }}>{roleLabels[u.role]}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Recent courses */}
                      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                        <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                          <BookOpen className="w-4 h-4" style={{ color: "#94A3B8" }} /> Khóa học gần đây
                        </h3>
                        <div className="space-y-2">
                          {(stats?.recentCourses || []).map((c: any) => (
                            <div key={c.id} className="flex items-center gap-3 p-2.5 rounded-xl" style={{ background: "var(--muted)" }}>
                              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(148,163,184,0.12)" }}>
                                <BookOpen className="w-4 h-4" style={{ color: "#94A3B8" }} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold truncate">{c.title}</p>
                                <p className="text-[10px]" style={{ color: "#6a6f73" }}>{c.author?.username} · {c._count?.enrollments || 0} HS</p>
                              </div>
                              <span className={`badge ${c.status === "published" ? "badge-success" : "badge-warning"} text-[10px]`}>{c.status === "published" ? "Xuất bản" : c.status}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {tab === "revenue" && (() => {
                const detail = revenueDetails || {};
                const summary = detail.summary || {};
                const money = (value: any) => `${Number(value || 0).toLocaleString("vi-VN")} ₫`;
                const topCourses = detail.topCourses || [];
                const recentOrders = detail.recentOrders || [];
                const paymentIssues = detail.paymentIssues || [];
                const refunds = refundRequests.length ? refundRequests : detail.refundRequests || [];
                const receivedRevenue = Number(summary.receivedRevenue || summary.grossRevenue || 0);
                const platformRevenue = Number(summary.platformRevenue || 0);
                const teacherRevenue = Number(summary.teacherRevenue || 0);
                const discountTotal = Number(summary.discountTotal || 0);
                const platformShare = receivedRevenue > 0 ? Math.round((platformRevenue / receivedRevenue) * 100) : 0;
                const teacherShare = receivedRevenue > 0 ? Math.round((teacherRevenue / receivedRevenue) * 100) : 0;

                return (
                  <div className="space-y-6">
                    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-foreground-muted">Quản trị tài chính</p>
                          <h2 className="mt-1 text-2xl font-extrabold">Doanh thu & đối soát</h2>
                          <p className="mt-1 text-sm text-foreground-muted">Theo dõi dòng tiền đã thu, chia sẻ doanh thu, đơn lỗi và yêu cầu hoàn tiền.</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                          <div className="rounded-lg border border-border bg-background px-4 py-3">
                            <p className="text-[10px] font-bold uppercase text-foreground-muted">Tỷ lệ nền tảng</p>
                            <p className="mt-1 text-lg font-extrabold text-primary">{platformShare}%</p>
                          </div>
                          <div className="rounded-lg border border-border bg-background px-4 py-3">
                            <p className="text-[10px] font-bold uppercase text-foreground-muted">Tỷ lệ GV</p>
                            <p className="mt-1 text-lg font-extrabold">{teacherShare}%</p>
                          </div>
                          <div className="col-span-2 rounded-lg border border-border bg-background px-4 py-3 sm:col-span-1">
                            <p className="text-[10px] font-bold uppercase text-foreground-muted">Cần xử lý</p>
                            <p className="mt-1 text-lg font-extrabold text-[#FFCCAA]">{paymentIssues.length + refunds.filter((r: any) => r.status !== "PAID").length}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      {[
                        { label: "Tiền đã nhận", value: money(receivedRevenue), icon: DollarSign, color: "#F8B486", sub: "Dòng tiền vào" },
                        { label: "Nền tảng giữ lại", value: money(platformRevenue), icon: Percent, color: "#F8B486", sub: `${platformShare}% doanh thu` },
                        { label: "Đã ghi nhận GV", value: money(teacherRevenue), icon: Wallet, color: "#94A3B8", sub: `${teacherShare}% doanh thu` },
                        { label: "Giảm giá", value: money(discountTotal), icon: Tag, color: "#FFCCAA", sub: "Coupon/ưu đãi" },
                      ].map(({ label, value, icon: Icon, color, sub }) => (
                        <div key={label} className="rounded-xl border border-border bg-card p-5 shadow-sm">
                          <div className="mb-4 flex items-center justify-between">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: `${color}18` }}>
                            <Icon className="w-5 h-5" style={{ color }} />
                            </div>
                          </div>
                          <p className="text-xl font-extrabold">{value}</p>
                          <p className="mt-1 text-xs font-bold">{label}</p>
                          <p className="mt-1 text-[10px] font-bold" style={{ color }}>{sub}</p>
                        </div>
                      ))}
                    </div>

                    <div className="grid gap-6 lg:grid-cols-3">
                      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                        <h3 className="font-bold mb-4 flex items-center gap-2">
                          <Activity className="w-4 h-4 text-[#FFCCAA]" /> Trạng thái thanh toán
                        </h3>
                        <div className="space-y-3">
                          {[
                            { label: "Đã thanh toán", count: summary.paidOrders, amount: summary.grossRevenue, color: "#F8B486" },
                            { label: "Chờ thanh toán", count: summary.pendingOrders, amount: summary.pendingAmount, color: "#FFCCAA" },
                            { label: "Chuyển thừa", count: refunds.filter((r: any) => r.status !== "PAID").length, amount: summary.overpaidAmount, color: "#94A3B8" },
                            { label: "Thất bại", count: summary.failedOrders, amount: summary.failedAmount, color: "#F8B486" },
                          ].map((row) => (
                            <div key={row.label} className="rounded-lg border border-border bg-background p-3">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-semibold">{row.label}</span>
                                <span className="text-xs font-bold" style={{ color: row.color }}>{row.count || 0} đơn</span>
                              </div>
                              <p className="text-sm mt-1" style={{ color: "#6a6f73" }}>{money(row.amount)}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-xl border border-border bg-card p-6 shadow-sm lg:col-span-2">
                        <div className="mb-4 flex items-start justify-between gap-3">
                          <div>
                            <h3 className="flex items-center gap-2 font-bold">
                              <TrendingUp className="w-4 h-4 text-[#F8B486]" /> Top khóa học theo doanh thu
                            </h3>
                            <p className="mt-1 text-xs text-foreground-muted">Xếp hạng khóa học tạo doanh thu cao nhất.</p>
                          </div>
                          <span className="rounded-full bg-muted px-3 py-1 text-xs font-bold text-foreground-muted">{topCourses.length} khóa</span>
                        </div>
                        {topCourses.length === 0 ? (
                          <p className="text-sm py-8 text-center" style={{ color: "#6a6f73" }}>Chưa có doanh thu khóa học</p>
                        ) : (
                          <div className="space-y-3">
                            {topCourses.map((course: any, index: number) => (
                              <div key={course.id} className="flex items-center gap-3 rounded-lg border border-border bg-background p-3">
                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">{index + 1}</span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-bold truncate">{course.title}</p>
                                  <p className="text-xs" style={{ color: "#6a6f73" }}>
                                    {course.teacher?.firstName || course.teacher?.username || "Giáo viên"} · {course.orders} lượt mua
                                  </p>
                                </div>
                                <span className="font-extrabold text-sm text-[#F8B486]">{money(course.revenue)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-2">
                      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                        <h3 className="font-bold mb-4 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[#F8B486]" /> Đơn đã thu gần đây
                        </h3>
                        <div className="space-y-3">
                          {recentOrders.length === 0 ? (
                            <p className="text-sm py-6 text-center" style={{ color: "#6a6f73" }}>Chưa có đơn đã thanh toán</p>
                          ) : recentOrders.map((order: any) => (
                            <div key={order.id} className="rounded-lg border border-border bg-background p-3">
                              <div className="flex justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="text-sm font-bold">#{order.id?.substring(0, 8)} · {order.user?.username || "Khách hàng"}</p>
                                  <p className="text-xs truncate" style={{ color: "#6a6f73" }}>
                                    {(order.items || []).map((i: any) => i.course?.title).filter(Boolean).join(", ") || "Khóa học"}
                                  </p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <p className="text-sm font-extrabold text-[#F8B486]">{money(order.payment?.paidAmount || order.finalPrice)}</p>
                                  {Number(order.payment?.overpaidAmount || 0) > 0 && (
                                    <p className="text-[10px] text-[#FFCCAA]">Dư {money(order.payment.overpaidAmount)}</p>
                                  )}
                                  <p className="text-[10px] font-mono" style={{ color: "#6a6f73" }}>{order.payment?.txnRef || "—"}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                        <h3 className="font-bold mb-4 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-[#FFCCAA]" /> Cần đối soát
                        </h3>
                        <div className="space-y-3">
                          {paymentIssues.length === 0 ? (
                            <p className="text-sm py-6 text-center" style={{ color: "#6a6f73" }}>Không có webhook lỗi hoặc chuyển sai mã</p>
                          ) : paymentIssues.map((event: any) => {
                            const payload = event.payload || {};
                            return (
                              <div key={event.id} className="rounded-lg border border-[#FFCCAA]/30 bg-[#FFCCAA]/5 p-3">
                                <div className="flex justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="text-sm font-bold text-[#FFCCAA]">{event.error || "Webhook cần kiểm tra"}</p>
                                    <p className="text-xs truncate" style={{ color: "#6a6f73" }}>
                                      Nội dung: {payload.content || payload.description || "—"}
                                    </p>
                                  </div>
                                  <div className="text-right flex-shrink-0">
                                    <p className="text-xs font-mono">{event.txnRef || "Không có mã"}</p>
                                    <p className="text-[10px]" style={{ color: "#6a6f73" }}>{new Date(event.receivedAt).toLocaleString("vi-VN")}</p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h3 className="flex items-center gap-2 font-bold">
                            <BanknoteIcon className="w-4 h-4 text-[#94A3B8]" /> Yêu cầu hoàn tiền chuyển dư
                          </h3>
                          <p className="mt-1 text-xs text-foreground-muted">Theo dõi các giao dịch học viên/phụ huynh chuyển thừa.</p>
                        </div>
                        <span className="rounded-full bg-muted px-3 py-1 text-xs font-bold text-foreground-muted">{refunds.length} yêu cầu</span>
                      </div>
                      {refunds.length === 0 ? (
                        <p className="text-sm py-6 text-center" style={{ color: "#6a6f73" }}>Chưa có yêu cầu hoàn tiền</p>
                      ) : (
                        <div className="grid md:grid-cols-2 gap-4">
                          {refunds.map((refund: any) => (
                            <div key={refund.id} className="flex gap-4 rounded-lg border border-border bg-background p-4">
                              {refund.refundQrUrl && (
                                <img src={refund.refundQrUrl} alt="QR hoàn tiền" className="w-28 h-28 object-contain bg-white rounded" />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between gap-2">
                                  <p className="text-sm font-bold truncate">#{refund.orderId?.substring(0, 8)}</p>
                                  <span className="text-[10px] font-bold" style={{ color: refund.status === "PAID" ? "#F8B486" : "#FFCCAA" }}>
                                    {refund.status === "PAID" ? "Đã hoàn" : "Chờ hoàn"}
                                  </span>
                                </div>
                                <p className="text-lg font-extrabold text-[#94A3B8]">{money(refund.amount)}</p>
                                <p className="text-xs truncate" style={{ color: "#6a6f73" }}>
                                  {refund.bankName} · {refund.bankAccount} · {refund.bankOwner}
                                </p>
                                <p className="text-[10px] truncate" style={{ color: "#6a6f73" }}>
                                  {refund.parent?.username || "Phụ huynh"} · {new Date(refund.createdAt).toLocaleString("vi-VN")}
                                </p>
                                {refund.status !== "PAID" && (
                                  <button onClick={() => markRefundPaid(refund.id)} className="btn-primary mt-3 text-xs px-3 py-2">
                                    Xác nhận đã chuyển
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* USERS */}
              {tab === "users" && (
                <div className="bg-card border border-border shadow-sm overflow-hidden">
                  <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3" style={{ borderBottom: "1px solid var(--border)" }}>
                    <h2 className="font-bold">Quản lý người dùng <span className="text-xs font-normal" style={{ color: "#6a6f73" }}>({filteredUsers.length} người)</span></h2>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowCreateTeacher({})}
                        className="flex items-center gap-1.5 px-4 py-2 bg-[#FFCCAA] hover:bg-[#8710d8] text-white text-xs font-bold rounded transition-colors whitespace-nowrap"
                      >
                        + Tạo giáo viên
                      </button>
                      <div className="relative sm:w-56">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#6a6f73" }} />
                        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm kiếm..." className="input-base pl-9 py-2 text-sm" />
                      </div>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr style={{ borderBottom: "1px solid var(--border)" }}>
                        {["Username", "Email", "Vai trò", "Trạng thái", "Ngày tham gia", ""].map(h => (
                          <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: "#6a6f73" }}>{h}</th>
                        ))}
                      </tr></thead>
                      <tbody>
                        {pagedUsers.items.map(u => (
                          <tr key={u.id} className="transition-colors hover:bg-[var(--muted)]" style={{ borderBottom: "1px solid var(--border)" }}>
                            <td className="px-4 py-3.5 font-semibold">{u.firstName || u.username}</td>
                            <td className="px-4 py-3.5" style={{ color: "#6a6f73" }}>{u.email}</td>
                            <td className="px-4 py-3.5"><span className="badge" style={{ background: `${roleColors[u.role] || "#FFCCAA"}18`, color: roleColors[u.role] || "#FFCCAA", border: `1px solid ${roleColors[u.role] || "#FFCCAA"}33` }}>{roleLabels[u.role] || u.role}</span></td>
                            <td className="px-4 py-3.5">
                              <span className="flex items-center gap-1 text-xs">
                                {u.isActive ? <UserCheck className="w-3 h-3" style={{ color: "#F8B486" }} /> : <UserX className="w-3 h-3" style={{ color: "#F8B486" }} />}
                                <span style={{ color: u.isActive ? "#F8B486" : "#F8B486" }}>{u.isActive ? "Active" : "Inactive"}</span>
                              </span>
                            </td>
                            <td className="px-4 py-3.5" style={{ color: "#6a6f73" }}>{new Date(u.createdAt).toLocaleDateString("vi-VN")}</td>
                            <td className="px-4 py-3.5"><div className="flex gap-1">
                              <button onClick={() => toggleUserStatus(u.id, u.isActive)} className="btn-ghost px-2 py-1" title={u.isActive ? "Khóa" : "Mở khóa"}>
                                {u.isActive ? <Lock className="w-3.5 h-3.5 text-yellow-500" /> : <Unlock className="w-3.5 h-3.5 text-green-500" />}
                              </button>
                              <button onClick={() => deleteUser(u.id)} className="btn-ghost px-2 py-1"><Trash2 className="w-3.5 h-3.5" style={{ color: "#F8B486" }} /></button>
                            </div></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <PaginationControls pageKey="users" page={pagedUsers.page} totalPages={pagedUsers.totalPages} totalItems={filteredUsers.length} />
                </div>
              )}

              {/* COURSES */}
              {tab === "courses" && (
                <div className="bg-card border border-border shadow-sm overflow-hidden">
                  <div className="p-5 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
                    <h2 className="font-bold">Quản lý khóa học <span className="text-xs font-normal" style={{ color: "#6a6f73" }}>({courses.length})</span></h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr style={{ borderBottom: "1px solid var(--border)" }}>
                        {["Khóa học", "Giáo viên", "Giá", "Học sinh", "Trạng thái", ""].map(h => (
                          <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: "#6a6f73" }}>{h}</th>
                        ))}
                      </tr></thead>
                      <tbody>
                        {pagedCourses.items.map(c => (
                          <tr key={c.id} className="transition-colors hover:bg-[var(--muted)]" style={{ borderBottom: "1px solid var(--border)" }}>
                            <td className="px-4 py-3.5 font-semibold max-w-[200px] truncate">{c.title}</td>
                            <td className="px-4 py-3.5" style={{ color: "#6a6f73" }}>{c.author?.username || "—"}</td>
                            <td className="px-4 py-3.5" style={{ color: "#F8B486" }}>{c.price > 0 ? `${c.price.toLocaleString()} ₫` : "Miễn phí"}</td>
                            <td className="px-4 py-3.5">{c._count?.enrollments || 0}</td>
                            <td className="px-4 py-3.5"><span className={`badge ${c.status === "published" ? "badge-success" : "badge-warning"} text-[10px]`}>{c.status === "published" ? "Xuất bản" : c.status === "draft" ? "Nháp" : c.status}</span></td>
                            <td className="px-4 py-3.5"><div className="flex gap-1">
                              {c.status !== "published" && <button onClick={() => publishCourse(c.id)} className="btn-ghost px-2 py-1 text-xs" style={{ color: "#F8B486" }}>Duyệt</button>}
                              {c.status !== "published" && c.status !== "rejected" && <button onClick={() => rejectCourse(c.id)} className="btn-ghost px-2 py-1 text-xs" style={{ color: "#F8B486" }}>Từ chối</button>}
                              <button onClick={() => window.open(`/courses/${c.id}`, '_blank')} className="btn-ghost px-2 py-1"><Eye className="w-3.5 h-3.5" /></button>
                            </div></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <PaginationControls pageKey="courses" page={pagedCourses.page} totalPages={pagedCourses.totalPages} totalItems={courses.length} />
                </div>
              )}

              {/* ORDERS */}
              {tab === "orders" && (
                <div className="bg-card border border-border shadow-sm overflow-hidden">
                  <div className="p-5 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
                    <h2 className="font-bold">Quản lý đơn hàng <span className="text-xs font-normal" style={{ color: "#6a6f73" }}>({orders.length})</span></h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr style={{ borderBottom: "1px solid var(--border)" }}>
                        {["Mã đơn", "Khách hàng", "Số tiền", "Trạng thái", "Ngày"].map(h => (
                          <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: "#6a6f73" }}>{h}</th>
                        ))}
                      </tr></thead>
                      <tbody>
                        {orders.length === 0 ? (
                          <tr><td colSpan={5} className="px-4 py-8 text-center text-sm" style={{ color: "#6a6f73" }}>Chưa có đơn hàng nào</td></tr>
                        ) : pagedOrders.items.map(o => {
                          const st = statusIcons[o.status] || statusIcons.pending;
                          return (
                            <tr key={o.id} className="transition-colors hover:bg-[var(--muted)]" style={{ borderBottom: "1px solid var(--border)" }}>
                              <td className="px-4 py-3.5 font-mono font-bold" style={{ color: "#FFCCAA" }}>{o.id.substring(0, 8)}</td>
                              <td className="px-4 py-3.5">{o.user?.username || "—"}</td>
                              <td className="px-4 py-3.5 font-semibold">{(o.finalPrice || o.totalPrice || 0).toLocaleString()} ₫</td>
                              <td className="px-4 py-3.5"><span className="flex items-center gap-1 text-xs"><st.Icon className="w-3 h-3" style={{ color: st.color }} /><span style={{ color: st.color }}>{o.status}</span></span></td>
                              <td className="px-4 py-3.5" style={{ color: "#6a6f73" }}>{new Date(o.createdAt).toLocaleDateString("vi-VN")}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <PaginationControls pageKey="orders" page={pagedOrders.page} totalPages={pagedOrders.totalPages} totalItems={orders.length} />
                </div>
              )}

              {/* COUPONS */}
              {tab === "coupons" && (
                <div className="bg-card border border-border shadow-sm p-6">
                  <div className="flex items-center justify-between mb-6 border-b border-border pb-4">
                    <h2 className="font-bold flex items-center gap-2"><Tag className="w-5 h-5 text-[#FFCCAA]" /> Quản lý Mã giảm giá</h2>
                    <button onClick={() => setShowCreateCoupon(true)} className="btn-primary">Tạo mã mới</button>
                  </div>
                  {coupons.length === 0 ? (
                    <div className="text-center py-12">
                      <Tag className="w-10 h-10 mx-auto mb-3" style={{ color: "#6a6f73" }} />
                      <p className="text-sm" style={{ color: "#6a6f73" }}>Chưa có mã giảm giá nào</p>
                    </div>
                  ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {pagedCoupons.items.map(c => {
                        const st = statusIcons[c.isActive ? "active" : "expired"] || statusIcons.active;
                        return (
                          <div key={c.id} className="card-base card-hover">
                            <div className="flex items-center justify-between mb-3">
                              <span className="font-mono font-bold text-lg" style={{ color: "#FFCCAA" }}>{c.code}</span>
                              <span className="flex items-center gap-1 text-xs"><st.Icon className="w-3 h-3" style={{ color: st.color }} /><span style={{ color: st.color }}>{c.isActive ? "active" : "expired"}</span></span>
                            </div>
                            <p className="text-2xl font-extrabold mb-3 gradient-text">{c.discount}%</p>
                            <div className="space-y-2 text-xs" style={{ color: "#6a6f73" }}>
                              <div className="flex justify-between"><span>Đã dùng</span><span className="font-semibold" style={{ color: "var(--foreground)" }}>{c.usedCount}/{c.maxUses || "∞"}</span></div>
                              {c.maxUses && <div className="progress-bar"><div className="progress-fill" style={{ width: `${(c.usedCount / c.maxUses) * 100}%` }} /></div>}
                              {c.expiresAt && <div className="flex justify-between"><span>Hết hạn</span><span>{new Date(c.expiresAt).toLocaleDateString("vi-VN")}</span></div>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <PaginationControls pageKey="coupons" page={pagedCoupons.page} totalPages={pagedCoupons.totalPages} totalItems={coupons.length} />
                </div>
              )}

              {/* PAYOUTS */}
              {tab === "payouts" && (
                <div className="bg-card border border-border shadow-sm overflow-hidden">
                  <div className="p-5 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
                    <h2 className="font-bold">Yêu cầu rút tiền <span className="text-xs font-normal" style={{ color: "#6a6f73" }}>({payouts.length})</span></h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr style={{ borderBottom: "1px solid var(--border)" }}>
                        {["Giáo viên", "Số tiền", "Ngân hàng", "Số TK", "Chủ TK", "Trạng thái", "Ngày", "Thao tác"].map(h => (
                          <th key={h} className="text-left px-4 py-3 text-xs font-semibold whitespace-nowrap" style={{ color: "#6a6f73" }}>{h}</th>
                        ))}
                      </tr></thead>
                      <tbody>
                        {payouts.length === 0 ? (
                          <tr><td colSpan={8} className="px-4 py-8 text-center text-sm" style={{ color: "#6a6f73" }}>Chưa có yêu cầu rút tiền nào</td></tr>
                        ) : pagedPayouts.items.map((p: any) => {
                          const bank = p.bankDetails || {};
                          const statusColors: Record<string, string> = { PENDING: "#FFCCAA", APPROVED: "#F8B486", REJECTED: "#F8B486", CANCELLED: "#6b7280" };
                          const statusLabels: Record<string, string> = { PENDING: "Chờ duyệt", APPROVED: "Đã duyệt", REJECTED: "Từ chối", CANCELLED: "Đã hủy" };
                          const sc = statusColors[p.status] || "#6b7280";
                          return (
                            <tr key={p.id} className="transition-colors hover:bg-[var(--muted)]" style={{ borderBottom: "1px solid var(--border)" }}>
                              <td className="px-4 py-3.5 font-semibold">{p.user?.username || p.user?.firstName || "—"}</td>
                              <td className="px-4 py-3.5 font-bold" style={{ color: "#F8B486" }}>{Number(p.amount).toLocaleString()} ₫</td>
                              <td className="px-4 py-3.5" style={{ color: "#6a6f73" }}>{bank.bankName || p.user?.bankName || "—"}</td>
                              <td className="px-4 py-3.5 font-mono text-xs">{bank.bankAccount || p.user?.bankAccount || "—"}</td>
                              <td className="px-4 py-3.5">{bank.bankOwner || p.user?.bankOwner || "—"}</td>
                              <td className="px-4 py-3.5">
                                <span className="px-2 py-1 rounded-full text-[10px] font-bold" style={{ background: `${sc}15`, color: sc, border: `1px solid ${sc}30` }}>
                                  {statusLabels[p.status] || p.status}
                                </span>
                                {p.bankTransferRef && <p className="text-[10px] mt-1 font-mono" style={{ color: "#6a6f73" }}>Ref: {p.bankTransferRef}</p>}
                                {p.adminNote && <p className="text-[10px] mt-0.5" style={{ color: "#6a6f73" }}>{p.adminNote}</p>}
                              </td>
                              <td className="px-4 py-3.5 whitespace-nowrap" style={{ color: "#6a6f73" }}>{new Date(p.createdAt).toLocaleDateString("vi-VN")}</td>
                              <td className="px-4 py-3.5">
                                {p.status === "PENDING" && (
                                  <div className="flex gap-1">
                                    <button onClick={() => approvePayout(p.id)} className="btn-ghost px-2 py-1 text-xs" style={{ color: "#F8B486" }}>Duyệt</button>
                                    <button onClick={() => rejectPayout(p.id)} className="btn-ghost px-2 py-1 text-xs" style={{ color: "#F8B486" }}>Từ chối</button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <PaginationControls pageKey="payouts" page={pagedPayouts.page} totalPages={pagedPayouts.totalPages} totalItems={payouts.length} />
                </div>
              )}
              {/* QUEUES */}
              {tab === "queues" && (
                <div className="bg-card border border-border shadow-sm p-6">
                  <h2 className="font-bold mb-4 flex items-center gap-2"><Server className="w-5 h-5 text-[#FFCCAA]" /> Sức khỏe hàng đợi (Queues)</h2>
                  {queues ? (
                    <div className="space-y-4">
                      {queues.queues && queues.queues.map((q: any) => (
                        <div key={q.name} className="p-4 border border-border rounded flex justify-between items-center bg-[var(--muted)]">
                          <div>
                            <p className="font-bold text-[#FFCCAA]">{q.name}</p>
                            <div className="flex gap-4 mt-2 text-sm text-[#6a6f73]">
                              <p>Active: <span className="font-bold text-[#F8B486]">{q.active}</span></p>
                              <p>Waiting: <span className="font-bold text-[#FFCCAA]">{q.waiting}</span></p>
                              <p>Failed: <span className="font-bold text-[#F8B486]">{q.failed}</span></p>
                            </div>
                          </div>
                          {q.isPaused ? (
                            <span className="badge badge-warning">Tạm dừng</span>
                          ) : (
                            <span className="badge badge-success">Hoạt động</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[#6a6f73]">Không có dữ liệu hàng đợi.</p>
                  )}
                </div>
              )}

              {/* RACE CONFIG */}
              {tab === "race" && (
                <div className="bg-card border border-border shadow-sm p-6">
                  <div className="flex items-center justify-between mb-6 border-b border-border pb-4">
                    <h2 className="font-bold flex items-center gap-2"><Flag className="w-5 h-5 text-[#FFCCAA]" /> Cấu hình Thi đua Tháng</h2>
                    <button onClick={finalizeRace} className="btn-primary">Tổng kết tháng này</button>
                  </div>
                  {raceConfig ? (
                    <div className="space-y-4">
                      <p className="text-sm text-[#6a6f73] mb-4">Các điểm XP cấu hình cho các hoạt động. (Tính năng cập nhật đang được phát triển)</p>
                      <div className="grid sm:grid-cols-2 gap-4">
                        {Object.entries(raceConfig).map(([k, v]) => (
                          <div key={k} className="p-3 border border-border rounded flex justify-between items-center bg-[var(--muted)]">
                            <span className="font-medium text-sm">{k}</span>
                            <span className="font-bold text-[#FFCCAA]">{String(v)} XP</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-[#6a6f73]">Không thể lấy cấu hình thi đua.</p>
                  )}
                </div>
              )}

              {/* FEE CONFIG */}
              {tab === "fee" && (
                <div className="bg-card border border-border shadow-sm p-6 max-w-xl">
                  <h2 className="font-bold flex items-center gap-2 mb-6"><Percent className="w-5 h-5 text-[#FFCCAA]" /> Cấu hình Phí Nền tảng</h2>
                  {feeConfig ? (
                    <form onSubmit={saveFeeConfig} className="space-y-4">
                      <div>
                        <label className="block text-sm font-bold mb-2">Phí nền tảng (%)</label>
                        <input type="number" step="0.1" value={feeConfig.percentage} onChange={e => setFeeConfig({...feeConfig, percentage: Number(e.target.value)})} className="input-base" />
                        <p className="text-xs text-[#6a6f73] mt-1">Phần trăm hoa hồng hệ thống giữ lại từ mỗi khóa học được bán.</p>
                      </div>
                      <button type="submit" className="btn-primary w-full">Lưu cấu hình</button>
                    </form>
                  ) : (
                    <p className="text-sm text-[#6a6f73]">Đang tải cấu hình phí...</p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}><div className="w-8 h-8 border-2 border-[#F8B486] border-t-transparent rounded-full animate-spin" /></div>}>
      <AdminPageInner />
    </Suspense>
  );
}
