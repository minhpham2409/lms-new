"use client";

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ShoppingCart, Trash2, Tag, BookOpen, ArrowRight, ShieldCheck } from "lucide-react";

const initialItems = [
  { id: "2", title: "Vật lý nâng cao — Lớp 8", author: "Cô Hương", price: 199000, color: "#3b82f6" },
  { id: "4", title: "Hóa học vui — Lớp 9", author: "Cô Lan", price: 149000, color: "#f59e0b" },
];

export default function CartPage() {
  const [items, setItems] = useState(initialItems);
  const [coupon, setCoupon] = useState("");

  const total = items.reduce((s, i) => s + i.price, 0);

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <Navbar />
      <div className="pt-20 pb-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-extrabold mb-6 flex items-center gap-2">
            <ShoppingCart className="w-6 h-6" style={{ color: "#7c3aed" }} /> Giỏ hàng
            <span className="text-sm font-normal" style={{ color: "#8892a4" }}>({items.length} khóa học)</span>
          </h1>

          {items.length === 0 ? (
            <div className="card-base text-center py-16">
              <ShoppingCart className="w-14 h-14 mx-auto mb-4" style={{ color: "#8892a4" }} />
              <h2 className="text-lg font-bold mb-2">Giỏ hàng trống</h2>
              <p className="text-sm mb-6" style={{ color: "#8892a4" }}>Hãy khám phá và thêm khóa học bạn yêu thích</p>
              <Link href="/courses" className="btn-primary">Xem khóa học</Link>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="card-base flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background: `${item.color}22` }}>
                      <BookOpen className="w-7 h-7" style={{ color: item.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm truncate">{item.title}</h3>
                      <p className="text-xs" style={{ color: "#8892a4" }}>{item.author}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold" style={{ color: "#a78bfa" }}>
                        {(item.price / 1000).toFixed(0)}k ₫
                      </p>
                      <button
                        onClick={() => setItems(items.filter((i) => i.id !== item.id))}
                        className="text-xs flex items-center gap-1 mt-1" style={{ color: "#ef4444" }}
                      >
                        <Trash2 className="w-3 h-3" /> Xóa
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="glass-card rounded-2xl p-6 h-fit sticky top-24" style={{ boxShadow: "0 24px 64px rgba(0,0,0,0.3)" }}>
                <h3 className="font-bold mb-4">Tóm tắt đơn hàng</h3>
                <div className="space-y-3 text-sm mb-4">
                  <div className="flex justify-between" style={{ color: "#8892a4" }}>
                    <span>Tạm tính</span>
                    <span>{(total / 1000).toFixed(0)}k ₫</span>
                  </div>
                  <div className="flex justify-between" style={{ color: "#8892a4" }}>
                    <span>Giảm giá</span>
                    <span>0 ₫</span>
                  </div>
                  <div className="divider" />
                  <div className="flex justify-between font-bold text-base">
                    <span>Tổng cộng</span>
                    <span className="gradient-text">{(total / 1000).toFixed(0)}k ₫</span>
                  </div>
                </div>

                {/* Coupon */}
                <div className="flex gap-2 mb-4">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#8892a4" }} />
                    <input value={coupon} onChange={(e) => setCoupon(e.target.value)} placeholder="Mã giảm giá" className="input-base pl-9 py-2.5 text-sm" />
                  </div>
                  <button className="btn-secondary px-4 py-2.5 text-sm">Áp dụng</button>
                </div>

                <button className="btn-primary w-full justify-center py-3.5 text-base">
                  Thanh toán <ArrowRight className="w-4 h-4" />
                </button>

                <div className="flex items-center justify-center gap-1.5 mt-4 text-xs" style={{ color: "#8892a4" }}>
                  <ShieldCheck className="w-3.5 h-3.5" style={{ color: "#10b981" }} />
                  Thanh toán an toàn & bảo mật
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
