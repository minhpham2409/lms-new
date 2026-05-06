"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import {
  ArrowLeft, Save, Plus, Trash2, GripVertical, BookOpen, Play,
  FileText, Image, Settings, Eye,
} from "lucide-react";

const initialSections = [
  { id: "s1", title: "Giới thiệu khóa học", lessons: [
    { id: "l1", title: "Chào mừng", type: "video" },
    { id: "l2", title: "Cách sử dụng", type: "video" },
  ]},
  { id: "s2", title: "Kiến thức cơ bản", lessons: [
    { id: "l3", title: "Bài 1: Khái niệm", type: "video" },
    { id: "l4", title: "Bài tập thực hành", type: "assignment" },
  ]},
];

export default function TeacherCourseEditPage() {
  const { id } = useParams();
  const [tab, setTab] = useState<"content" | "settings">("content");
  const [title, setTitle] = useState("Toán học cơ bản — Lớp 6");
  const [description, setDescription] = useState("Nắm vững nền tảng toán học lớp 6 với video bài giảng chi tiết.");
  const [price, setPrice] = useState("0");

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <Navbar />
      <div className="pt-20 pb-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Link href="/teacher" className="flex items-center gap-1 text-sm" style={{ color: "#8892a4" }}>
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <h1 className="text-xl font-extrabold">Chỉnh sửa khóa học</h1>
            </div>
            <div className="flex gap-2">
              <button onClick={() => window.open(`/courses/${id}`, '_blank')} className="btn-secondary text-sm"><Eye className="w-4 h-4" /> Xem trước</button>
              <button className="btn-primary text-sm"><Save className="w-4 h-4" /> Lưu</button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            {[
              { id: "content" as const, label: "Nội dung", icon: BookOpen },
              { id: "settings" as const, label: "Cài đặt", icon: Settings },
            ].map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all" style={{
                background: tab === t.id ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${tab === t.id ? "rgba(124,58,237,0.4)" : "rgba(255,255,255,0.08)"}`,
                color: tab === t.id ? "#a78bfa" : "#8892a4",
              }}>
                <t.icon className="w-4 h-4" /> {t.label}
              </button>
            ))}
          </div>

          {tab === "content" && (
            <>
              {/* Sections */}
              <div className="space-y-4">
                {initialSections.map((sec) => (
                  <div key={sec.id} className="card-base">
                    <div className="flex items-center gap-3 mb-4">
                      <GripVertical className="w-4 h-4 cursor-grab" style={{ color: "#8892a4" }} />
                      <input value={sec.title} className="input-base flex-1 text-sm font-semibold" readOnly />
                      <button className="btn-ghost px-2 py-1.5"><Trash2 className="w-4 h-4" style={{ color: "#ef4444" }} /></button>
                    </div>
                    <div className="space-y-2 ml-7">
                      {sec.lessons.map((l) => (
                        <div key={l.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                          <GripVertical className="w-3 h-3 cursor-grab" style={{ color: "#8892a4" }} />
                          {l.type === "video" ? <Play className="w-4 h-4" style={{ color: "#7c3aed" }} /> : <FileText className="w-4 h-4" style={{ color: "#0891b2" }} />}
                          <span className="text-sm flex-1">{l.title}</span>
                          <span className="badge text-[10px]" style={{ background: `${l.type === "video" ? "#7c3aed" : "#0891b2"}22`, color: l.type === "video" ? "#a78bfa" : "#22d3ee", border: `1px solid ${l.type === "video" ? "#7c3aed" : "#0891b2"}44` }}>
                            {l.type === "video" ? "Video" : "Bài tập"}
                          </span>
                          <button className="btn-ghost px-1.5 py-1"><Trash2 className="w-3 h-3" style={{ color: "#ef4444" }} /></button>
                        </div>
                      ))}
                      <button className="btn-ghost text-xs w-full justify-center py-2" style={{ color: "#a78bfa", border: "1px dashed rgba(124,58,237,0.3)", borderRadius: "12px" }}>
                        <Plus className="w-3 h-3" /> Thêm bài học
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button className="btn-secondary w-full justify-center mt-4">
                <Plus className="w-4 h-4" /> Thêm chương mới
              </button>
            </>
          )}

          {tab === "settings" && (
            <div className="card-base">
              <h3 className="font-bold mb-5">Thông tin khóa học</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Tên khóa học</label>
                  <input value={title} onChange={(e) => setTitle(e.target.value)} className="input-base" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Mô tả</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="input-base resize-none" />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Giá (VNĐ)</label>
                    <input value={price} onChange={(e) => setPrice(e.target.value)} className="input-base" placeholder="0 = Miễn phí" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Danh mục</label>
                    <select className="input-base">
                      <option>Toán</option><option>Lý</option><option>Hóa</option><option>Anh văn</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Ảnh bìa</label>
                  <div className="border-2 border-dashed rounded-xl p-8 text-center" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
                    <Image className="w-8 h-8 mx-auto mb-2" style={{ color: "#8892a4" }} />
                    <p className="text-sm" style={{ color: "#8892a4" }}>Kéo thả hoặc click để tải ảnh</p>
                  </div>
                </div>
                <button className="btn-primary"><Save className="w-4 h-4" /> Lưu cài đặt</button>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
