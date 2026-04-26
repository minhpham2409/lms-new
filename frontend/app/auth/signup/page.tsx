import { Suspense } from "react";
import { SignUpForm } from "@/components/auth/sign-up-form";

export const metadata = {
  title: "Đăng ký | HọcLộ Trình",
  description: "Tạo tài khoản mới trên HọcLộ Trình.",
};

export default function SignUpPage() {
  return (
    <div className="py-12 flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md">
        <Suspense fallback={<div className="text-center">Đang tải...</div>}>
          <SignUpForm />
        </Suspense>
      </div>
    </div>
  );
}
