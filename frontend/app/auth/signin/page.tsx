import { Suspense } from "react";
import { UnifiedPageShell } from "@/components/layout/unified-page-shell";
import SignInFormClient from "@/components/auth/signin-form-client";

export const metadata = {
  title: "Đăng nhập | HọcLộ Trình",
};

export default function SignInPage() {
  return (
    <UnifiedPageShell contentClassName="py-12 flex items-center justify-center">
      <div className="w-full max-w-md">
        <Suspense fallback={<div className="text-center">Đang tải...</div>}>
          <SignInFormClient />
        </Suspense>
      </div>
    </UnifiedPageShell>
  );
}
