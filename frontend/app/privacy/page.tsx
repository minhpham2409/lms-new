import { UnifiedPageShell } from "@/components/layout/unified-page-shell";

export const metadata = {
  title: "Chính sách bảo mật | HọcLộ Trình",
};

export default function Privacy() {
  return (
    <UnifiedPageShell contentClassName="py-16">
      <div className="landing-page max-w-4xl mx-auto px-4 md:px-6">
        <h1 className="section-title mb-8">Chính sách bảo mật</h1>

        <div className="space-y-8 section-content">
          <section>
            <h2 className="text-2xl font-bold mb-3">1. Thông tin chúng tôi thu thập</h2>
            <p>
              Chúng tôi thu thập các thông tin cần thiết để cung cấp dịch vụ:
              tên, email, mật khẩu (được mã hóa), vai trò, thông tin tiến độ học tập.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">2. Cách chúng tôi sử dụng thông tin</h2>
            <p>
              Thông tin của bạn được sử dụng để: xác thực tài khoản, cá nhân hóa
              trải nghiệm học tập, gửi thông báo quan trọng, cải thiện dịch vụ.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">3. Bảo vệ dữ liệu</h2>
            <p>
              Chúng tôi sử dụng mã hóa SSL/TLS, mật khẩu được hash an toàn,
              và tuân thủ các tiêu chuẩn bảo mật quốc tế.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">4. Chia sẻ thông tin</h2>
            <p>
              Chúng tôi không chia sẻ dữ liệu cá nhân của bạn với bên thứ ba
              mà không có sự đồng ý từ bạn, ngoại trừ khi yêu cầu pháp lý.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">5. Quyền của bạn</h2>
            <p>
              Bạn có quyền truy cập, sửa đổi hoặc xóa dữ liệu cá nhân của
              mình. Liên hệ chúng tôi qua email để thực hiện.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">6. Thay đổi chính sách</h2>
            <p>
              Chúng tôi có thể cập nhật chính sách này. Mọi thay đổi sẽ được
              thông báo qua email hoặc trang web.
            </p>
          </section>
        </div>
      </div>
    </UnifiedPageShell>
  );
}
