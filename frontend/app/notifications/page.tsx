"use client";

import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Bell, CheckCircle2, BookOpen, Award, MessageCircle, Clock } from "lucide-react";

const notifications = [
  { id: 1, type: "lesson", title: "Bài học mới: Phân số và thập phân", desc: "Thầy Minh vừa thêm bài học mới vào khóa Toán lớp 6", time: "2 giờ trước", read: false, icon: BookOpen, color: "#7c3aed" },
  { id: 2, type: "grade", title: "Kết quả bài kiểm tra", desc: "Bạn đạt 9/10 trong bài kiểm tra Toán chương 3", time: "5 giờ trước", read: false, icon: Award, color: "#10b981" },
  { id: 3, type: "comment", title: "Phản hồi bình luận", desc: "Thầy Minh đã trả lời câu hỏi của bạn", time: "1 ngày trước", read: true, icon: MessageCircle, color: "#0891b2" },
  { id: 4, type: "reminder", title: "Nhắc nhở học tập", desc: "Bạn chưa học hôm nay! Hãy duy trì chuỗi 7 ngày 🔥", time: "1 ngày trước", read: true, icon: Clock, color: "#f59e0b" },
  { id: 5, type: "cert", title: "Chúc mừng! Chứng chỉ mới", desc: "Bạn đã nhận chứng chỉ hoàn thành khóa Toán cơ bản", time: "3 ngày trước", read: true, icon: Award, color: "#ec4899" },
];

export default function NotificationsPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <Navbar />
      <div className="pt-20 pb-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-extrabold flex items-center gap-2">
              <Bell className="w-6 h-6" style={{ color: "#7c3aed" }} /> Thông báo
            </h1>
            <button className="text-sm" style={{ color: "#a78bfa" }}>Đánh dấu tất cả đã đọc</button>
          </div>
          <div className="space-y-2">
            {notifications.map((n) => {
              const Icon = n.icon;
              return (
                <div
                  key={n.id}
                  className="card-base flex items-start gap-4 cursor-pointer transition-all hover:border-[rgba(124,58,237,0.3)]"
                  style={{ borderLeft: n.read ? undefined : `3px solid ${n.color}`, background: n.read ? undefined : "rgba(124,58,237,0.05)" }}
                >
                  <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background: `${n.color}22` }}>
                    <Icon className="w-5 h-5" style={{ color: n.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold">{n.title}</h3>
                    <p className="text-xs mt-1" style={{ color: "#8892a4" }}>{n.desc}</p>
                    <p className="text-xs mt-2" style={{ color: "#8892a4" }}>{n.time}</p>
                  </div>
                  {!n.read && <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ background: n.color }} />}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
