"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ArrowLeft, Package, CheckCircle2, BookOpen, Calendar, CreditCard, FileText } from "lucide-react";

export default function OrderDetailPage() {
  const { id } = useParams();

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <Navbar />
      <div className="pt-20 pb-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/orders" className="flex items-center gap-1 text-sm mb-6" style={{ color: "#8892a4" }}>
            <ArrowLeft className="w-4 h-4" /> Quay lại đơn hàng
          </Link>

          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-extrabold flex items-center gap-2">
              <Package className="w-6 h-6" style={{ color: "#7c3aed" }} />
              Đơn hàng <span className="font-mono" style={{ color: "#a78bfa" }}>#{id}</span>
            </h1>
            <span className="badge badge-success">Hoàn thành</span>
          </div>

          {/* Order info */}
          <div className="card-base mb-6">
            <h3 className="font-bold mb-4">Thông tin đơn hàng</h3>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              {[
                { icon: Calendar, label: "Ngày đặt", value: "01/05/2026, 14:30" },
                { icon: CreditCard, label: "Phương thức", value: "Chuyển khoản" },
                { icon: CheckCircle2, label: "Trạng thái", value: "Đã thanh toán" },
                { icon: FileText, label: "Mã giao dịch", value: "TXN-20260501-001" },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3">
                  <Icon className="w-4 h-4 flex-shrink-0" style={{ color: "#7c3aed" }} />
                  <div>
                    <p className="text-xs" style={{ color: "#8892a4" }}>{label}</p>
                    <p className="font-medium">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Items */}
          <div className="card-base mb-6">
            <h3 className="font-bold mb-4">Khóa học đã mua</h3>
            <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.03)" }}>
              <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ background: "rgba(59,130,246,0.15)" }}>
                <BookOpen className="w-6 h-6" style={{ color: "#3b82f6" }} />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-sm">Vật lý nâng cao — Lớp 8</h4>
                <p className="text-xs" style={{ color: "#8892a4" }}>Cô Hương • 18 bài học</p>
              </div>
              <p className="font-bold" style={{ color: "#a78bfa" }}>199k ₫</p>
            </div>
          </div>

          {/* Summary */}
          <div className="card-base">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between" style={{ color: "#8892a4" }}><span>Tạm tính</span><span>199k ₫</span></div>
              <div className="flex justify-between" style={{ color: "#8892a4" }}><span>Giảm giá</span><span>0 ₫</span></div>
              <div className="divider" />
              <div className="flex justify-between font-bold text-base"><span>Tổng cộng</span><span className="gradient-text">199k ₫</span></div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
