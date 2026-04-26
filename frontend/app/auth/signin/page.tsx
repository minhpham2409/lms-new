import { Suspense } from "react";
import SignInFormClient from "@/components/auth/signin-form-client";

export const metadata = {
  title: "Đăng nhập | HọcLộ Trình",
};

export default function SignInPage() {
  return (
    <div className="py-12 flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md">
        <Suspense fallback={<div className="text-center">Đang tải...</div>}>
          <SignInFormClient />
        </Suspense>
      </div>
    </div>
  );
}
