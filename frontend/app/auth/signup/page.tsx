import { Suspense } from "react";
import { DashboardLayout } from "@/components/layout/unified-page-shell";
import { SignUpForm } from "@/components/auth/sign-up-form";

export const metadata = {
  title: "Đăng ký | HọcLộ Trình",
  description: "Tạo tài khoản mới trên HọcLộ Trình.",
};

export default function SignUpPage() {
  return (
    <DashboardLayout contentClassName="py-12 flex items-center justify-center">
      <div className="w-full max-w-md">
        <Suspense fallback={<div className="text-center">Đang tải...</div>}>
          <SignUpForm />
        </Suspense>
      </div>
    </DashboardLayout>
  );
}
