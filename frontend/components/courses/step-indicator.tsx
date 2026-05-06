"use client";
import { CheckCircle2 } from "lucide-react";

interface Step { label: string; icon: any; }

export function StepIndicator({ steps, current }: { steps: Step[]; current: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        const Icon = done ? CheckCircle2 : s.icon;
        return (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5 min-w-[90px]">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300"
                style={{
                  background: done ? "#10b981" : active ? "linear-gradient(135deg, #7c3aed, #0891b2)" : "var(--muted)",
                  color: done || active ? "#fff" : "var(--foreground-muted)",
                  border: `2px solid ${done ? "#10b981" : active ? "#7c3aed" : "var(--border)"}`,
                  boxShadow: active ? "0 0 20px rgba(124,58,237,0.3)" : "none",
                }}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span
                className="text-[11px] font-semibold text-center leading-tight"
                style={{ color: done ? "#10b981" : active ? "#a78bfa" : "var(--foreground-muted)" }}
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className="h-[2px] w-12 mx-1 rounded-full transition-all duration-300"
                style={{ background: done ? "#10b981" : "var(--border)", marginBottom: 20 }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
