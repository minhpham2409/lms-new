import { Layers, Plus, Trash2 } from "lucide-react";

export function Step2Sections({ sections, setSections }: any) {
  const addSection = () => {
    setSections([...sections, { id: `tmp-${Date.now()}`, title: "", lessons: [], expanded: true }]);
  };

  const removeSection = (id: string) => {
    setSections(sections.filter((s: any) => s.id !== id));
  };

  const updateTitle = (id: string, title: string) => {
    setSections(sections.map((s: any) => s.id === id ? { ...s, title } : s));
  };

  return (
    <div className="card-base animate-scale-in">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold flex items-center gap-2 text-lg">
          <Layers className="w-5 h-5" style={{ color: "#0891b2" }} /> Bước 2: Thêm chương (Sections)
        </h3>
        <button onClick={addSection} className="btn-secondary text-sm">
          <Plus className="w-4 h-4" /> Thêm chương
        </button>
      </div>

      {sections.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-2xl" style={{ borderColor: "var(--border)" }}>
          <Layers className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--foreground-muted)" }} />
          <p className="font-semibold mb-1">Chưa có chương nào</p>
          <p className="text-sm mb-4" style={{ color: "var(--foreground-muted)" }}>Khóa học cần ít nhất 1 chương để thêm bài giảng</p>
          <button onClick={addSection} className="btn-primary"><Plus className="w-4 h-4" /> Bắt đầu tạo chương</button>
        </div>
      ) : (
        <div className="space-y-4">
          {sections.map((sec: any, index: number) => (
            <div key={sec.id} className="p-4 rounded-xl flex items-center gap-3 transition-all" style={{ background: "var(--muted)", border: "1px solid var(--border)" }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm" style={{ background: "rgba(8,145,178,0.15)", color: "#0891b2" }}>
                {index + 1}
              </div>
              <div className="flex-1">
                <input
                  value={sec.title}
                  onChange={(e) => updateTitle(sec.id, e.target.value)}
                  placeholder="Nhập tên chương (VD: Chương 1: Số tự nhiên)"
                  className="input-base w-full py-2"
                />
              </div>
              <button onClick={() => removeSection(sec.id)} className="btn-ghost px-2 py-2" title="Xóa chương">
                <Trash2 className="w-4 h-4" style={{ color: "#ef4444" }} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
