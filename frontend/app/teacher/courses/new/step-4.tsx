import { CheckCircle2, Play, FileText, Image as ImageIcon } from "lucide-react";

export function Step4Review({ title, category, level, price, sections }: any) {
  const totalLessons = sections.reduce((acc: number, sec: any) => acc + sec.lessons.length, 0);

  return (
    <div className="card-base animate-scale-in">
      <h3 className="font-bold mb-6 flex items-center gap-2 text-lg">
        <CheckCircle2 className="w-5 h-5" style={{ color: "#10b981" }} /> Bước 4: Xem lại & Hoàn thành
      </h3>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h4 className="font-semibold text-sm mb-3" style={{ color: "#6a6f73" }}>Thông tin cơ bản</h4>
          <div className="space-y-3 p-4 rounded-xl" style={{ background: "var(--muted)", border: "1px solid var(--border)" }}>
            <p><strong>Tên:</strong> {title || <span className="text-red-500 text-xs">Chưa nhập</span>}</p>
            <p><strong>Danh mục:</strong> {category || "—"}</p>
            <p><strong>Cấp độ:</strong> {level || "—"}</p>
            <p><strong>Giá:</strong> {price ? `${Number(price).toLocaleString()} ₫` : "Miễn phí"}</p>
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-sm mb-3" style={{ color: "#6a6f73" }}>Thống kê nội dung</h4>
          <div className="space-y-3 p-4 rounded-xl" style={{ background: "var(--muted)", border: "1px solid var(--border)" }}>
            <p><strong>Tổng số chương:</strong> <span className="font-bold text-[#0891b2]">{sections.length}</span></p>
            <p><strong>Tổng số bài giảng:</strong> <span className="font-bold text-[#f59e0b]">{totalLessons}</span></p>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h4 className="font-semibold text-sm mb-3" style={{ color: "#6a6f73" }}>Cấu trúc chi tiết</h4>
        {sections.length === 0 ? (
          <p className="text-sm text-red-500">Chưa có nội dung nào được thêm!</p>
        ) : (
          <div className="space-y-3">
            {sections.map((sec: any, si: number) => (
              <div key={sec.id} className="p-3 rounded-lg" style={{ border: "1px solid var(--border)" }}>
                <p className="font-bold text-sm mb-2 text-[#0891b2]">Chương {si + 1}: {sec.title || "Chưa có tên"}</p>
                <div className="space-y-2 ml-4 border-l-2 pl-3" style={{ borderColor: "var(--border)" }}>
                  {sec.lessons.length === 0 ? (
                    <p className="text-xs text-red-500">Chưa có bài học</p>
                  ) : (
                    sec.lessons.map((les: any, li: number) => (
                      <div key={les.id} className="flex flex-col gap-1">
                        <p className="text-sm font-medium">{li + 1}. {les.title || "Bài học chưa có tên"}</p>
                        <div className="flex gap-2">
                          {les.videoUrl ? <span className="badge badge-success text-[10px]"><Play className="w-2.5 h-2.5 inline mr-1"/>Có video</span> : <span className="badge badge-warning text-[10px]">Thiếu video</span>}
                          {les.documentUrl && <span className="badge text-[10px]" style={{ background: "rgba(59,130,246,0.1)", color: "#3b82f6" }}><FileText className="w-2.5 h-2.5 inline mr-1"/>Có tài liệu</span>}
                          {les.assignmentImageUrl && <span className="badge text-[10px]" style={{ background: "rgba(16,185,129,0.1)", color: "#10b981" }}><ImageIcon className="w-2.5 h-2.5 inline mr-1"/>Có ảnh bài tập</span>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
