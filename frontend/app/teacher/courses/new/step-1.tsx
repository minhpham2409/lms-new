import { BookOpen } from "lucide-react";

export function Step1BasicInfo({ title, setTitle, description, setDescription, category, setCategory, level, setLevel, price, setPrice, allowPlatformPromotions, setAllowPlatformPromotions }: any) {
  const categories = ["Toán", "Lý", "Hóa", "Anh văn", "Ngữ văn", "Tin học", "Sinh học", "Lịch sử", "Ngoại ngữ khác"];
  const levels = ["Lớp 6", "Lớp 7", "Lớp 8", "Lớp 9", "Lớp 10", "Lớp 11", "Lớp 12", "Tất cả"];

  return (
    <div className="card-base animate-scale-in">
      <h3 className="font-bold mb-6 flex items-center gap-2 text-lg">
        <BookOpen className="w-5 h-5" style={{ color: "#5624d0" }} /> Bước 1: Thông tin cơ bản
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
