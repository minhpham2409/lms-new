import { UnifiedPageShell } from "@/components/layout/unified-page-shell";

export const metadata = {
  title: "Điều khoản dịch vụ | HọcLộ Trình",
};

export default function Terms() {
  return (
    <UnifiedPageShell contentClassName="py-16">
      <div className="landing-page max-w-4xl mx-auto px-4 md:px-6">
        <h1 className="section-title mb-8">Điều khoản dịch vụ</h1>

        <div className="space-y-8 section-content">
          <section>
            <h2 className="text-2xl font-bold mb-3">1. Chấp nhận điều khoản</h2>
            <p>
              Bằng cách sử dụng HọcLộ Trình, bạn đồng ý tuân thủ các điều khoản này.
              Nếu không đồng ý, vui lòng không sử dụng dịch vụ.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">2. Tài khoản người dùng</h2>
            <p>
              Bạn chịu trách nhiệm duy trì tính bảo mật mật khẩu của mình.
              HọcLộ Trình không chịu trách nhiệm cho bất kỳ hoạt động nào
              diễn ra dưới tài khoản của bạn.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">3. Nội dung khóa học</h2>
            <p>
              Tất cả nội dung, bài giảng, và tài liệu trên platform được bảo vệ
              bản quyền. Bạn chỉ có quyền sử dụng cho mục đích học tập cá nhân.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">4. Thanh toán</h2>
            <p>
              Giá khóa học được liệt kê rõ ràng. Thanh toán phải được thực hiện
              trước khi ghi danh. Các hoàn tiền tuân theo chính sách hoàn tiền của chúng tôi.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">5. Hành vi của người dùng</h2>
            <p>
              Bạn đồng ý không: spam, qu騷 nhạo, tấn công khác hoặc vi phạm luật pháp.
              Chúng tôi có quyền tắt tài khoản vi phạm.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">6. Từ chối trách nhiệm</h2>
            <p>
              Dịch vụ được cung cấp &quot;như là&quot;. HọcLộ Trình không đảm bảo
              không gián đoạn hoặc không lỗi.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">7. Giới hạn trách nhiệm</h2>
            <p>
              HọcLộ Trình không chịu trách nhiệm cho bất kỳ thiệt hại gián tiếp
              hoặc đặc biệt.
            </p>
          </section>
        </div>
      </div>
    </UnifiedPageShell>
  );
}
