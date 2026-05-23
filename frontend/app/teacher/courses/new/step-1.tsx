import { BookOpen, BadgeDollarSign, ReceiptText, TrendingUp } from "lucide-react";

export function Step1BasicInfo({ title, setTitle, description, setDescription, category, setCategory, level, setLevel, price, setPrice, allowPlatformPromotions, setAllowPlatformPromotions }: any) {
  const categories = ["Toán", "Lý", "Hóa", "Anh văn", "Ngữ văn", "Tin học", "Sinh học", "Lịch sử", "Ngoại ngữ khác"];
  const levels = ["Lớp 6", "Lớp 7", "Lớp 8", "Lớp 9", "Lớp 10", "Lớp 11", "Lớp 12", "Tất cả"];
  const numericPrice = Math.max(0, Number(price) || 0);
  const platformFee = Math.round(numericPrice * 0.2);
  const teacherRevenue = numericPrice - platformFee;

  return (
    <div className="card-base animate-scale-in">
      <h3 className="font-bold mb-6 flex items-center gap-2 text-lg">
        <BookOpen className="w-5 h-5" style={{ color: "#F8B486" }} /> Bước 1: Thông tin cơ bản
      </h3>
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-semibold mb-1.5">Tên khóa học *</label>
          <input value={title} onChange={e => setTitle(e.target.value)} className="input-base" placeholder="VD: Toán học cơ bản — Lớp 6" />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1.5">Mô tả chi tiết</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={5} className="input-base resize-none" placeholder="Giới thiệu về khóa học, mục tiêu đầu ra..." />
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-1.5">Danh mục</label>
            <select value={category} onChange={e => setCategory(e.target.value)} className="input-base">
              <option value="">Chọn danh mục</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5">Cấp độ</label>
            <select value={level} onChange={e => setLevel(e.target.value)} className="input-base">
              <option value="">Chọn cấp độ</option>
              {levels.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5">Giá tiền (VNĐ)</label>
            <input type="number" value={price} onChange={e => setPrice(e.target.value)} className="input-base" placeholder="0 = Miễn phí" />
            {numericPrice > 0 && (
              <div className="mt-3 overflow-hidden rounded-lg border" style={{ background: "var(--background)", borderColor: "var(--border)" }}>
                <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                  <div className="flex h-8 w-8 items-center justify-center rounded-md" style={{ background: "rgba(248,180,134,0.12)", color: "#F8B486" }}>
                    <ReceiptText className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Doanh thu dự kiến</p>
                    <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>Phí nền tảng cố định 20%</p>
                  </div>
                </div>
                <div className="space-y-3 p-4">
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="flex items-center gap-2" style={{ color: "var(--foreground-muted)" }}><BadgeDollarSign className="h-4 w-4" /> Giá bán</span>
                    <span className="font-bold">{numericPrice.toLocaleString("vi-VN")} đ</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span style={{ color: "var(--foreground-muted)" }}>Phí nền tảng</span>
                    <span className="font-bold text-red-400">-{platformFee.toLocaleString("vi-VN")} đ</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 rounded-md px-3 py-2" style={{ background: "rgba(248,180,134,0.10)" }}>
                    <span className="flex items-center gap-2 text-sm font-bold" style={{ color: "#F8B486" }}><TrendingUp className="h-4 w-4" /> Thực nhận</span>
                    <span className="text-lg font-extrabold" style={{ color: "#F8B486" }}>{teacherRevenue.toLocaleString("vi-VN")} đ</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="pt-4 mt-2" style={{ borderTop: "1px solid var(--border)" }}>
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative flex items-center justify-center mt-0.5">
              <input 
                type="checkbox" 
                checked={allowPlatformPromotions}
                onChange={e => setAllowPlatformPromotions(e.target.checked)}
                className="peer sr-only"
              />
              <div className="w-5 h-5 rounded border-2 transition-colors peer-checked:bg-[var(--primary)] peer-checked:border-[var(--primary)] border-[var(--border)] group-hover:border-[var(--primary)]"></div>
              <svg className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold mb-0.5">Cho phép Nền tảng chạy khuyến mãi</p>
              <p className="text-xs" style={{ color: "#6a6f73" }}>
                Đồng ý cho học viên áp dụng Voucher của hệ thống (ví dụ: thưởng Bảng xếp hạng) vào khóa học này.
              </p>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}
