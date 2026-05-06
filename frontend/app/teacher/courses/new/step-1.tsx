import { BookOpen } from "lucide-react";

export function Step1BasicInfo({ title, setTitle, description, setDescription, category, setCategory, level, setLevel, price, setPrice }: any) {
  const categories = ["Toán", "Lý", "Hóa", "Anh văn", "Ngữ văn", "Tin học", "Sinh học", "Lịch sử", "Ngoại ngữ khác"];
  const levels = ["Lớp 6", "Lớp 7", "Lớp 8", "Lớp 9", "Lớp 10", "Lớp 11", "Lớp 12", "Tất cả"];

  return (
    <div className="card-base animate-scale-in">
      <h3 className="font-bold mb-6 flex items-center gap-2 text-lg">
        <BookOpen className="w-5 h-5" style={{ color: "#7c3aed" }} /> Bước 1: Thông tin cơ bản
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
      </div>
    </div>
  );
}
