
export const metadata = {
  title: "Giới thiệu | HọcLộ Trình",
  description: "Tìm hiểu về nền tảng LMS HọcLộ Trình dành cho học sinh cấp 2.",
};

export default function About() {
  return (
    <div className="py-16">
      <div className="landing-page max-w-4xl mx-auto px-4 md:px-6">
        <div className="mb-12 text-center">
          <h1 className="section-title mb-4">Về HọcLộ Trình</h1>
          <p className="section-subtitle">
            Nền tảng LMS hiện đại kết nối giáo viên, học sinh và phụ huynh
          </p>
        </div>

        <div className="space-y-8">
          <section>
            <h2 className="section-title text-2xl mb-3">Sứ mệnh</h2>
            <p className="section-content text-lg leading-relaxed">
              HọcLộ Trình được tạo ra với mục tiêu cách mạng hóa nền giáo dục
              cho học sinh cấp 2. Chúng tôi tin rằng học tập hiệu quả cần sự
              kết hợp giữa công nghệ, nội dung chất lượng và sự hỗ trợ từ giáo
              viên cũng như phụ huynh.
            </p>
          </section>

          <section>
            <h2 className="section-title text-2xl mb-3">Tầm nhìn</h2>
            <p className="section-content text-lg leading-relaxed">
              Chúng tôi hướng đến một tương lai nơi mọi học sinh cấp 2 có thể
              học tập theo cách riêng của mình, với sự hướng dẫn cá nhân từ các
              giáo viên giỏi và sự giám sát minh bạch từ phụ huynh.
            </p>
          </section>

          <section>
            <h2 className="section-title text-2xl mb-3">Giá trị cốt lõi</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  title: "Chất lượng",
                  desc: "Nội dung được thiết kế bởi các giáo viên giàu kinh nghiệm.",
                },
                {
                  title: "Minh bạch",
                  desc: "Phụ huynh luôn biết con mình đang học gì và tiến bộ thế nào.",
                },
                {
                  title: "Linh hoạt",
                  desc: "Học sinh học theo lộ trình riêng, mở khóa bài học dựa trên tiến độ.",
                },
              ].map((v) => (
                <div
                  key={v.title}
                  className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700"
                >
                  <h3 className="font-semibold text-lg mb-2 text-blue-700">
                    {v.title}
                  </h3>
                  <p className="section-content">{v.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="section-title text-2xl mb-3">Công nghệ</h2>
            <p className="section-content text-lg leading-relaxed mb-4">
              HọcLộ Trình được xây dựng trên nền tảng công nghệ hiện đại:
            </p>
            <ul className="space-y-2 section-content">
              <li>• <strong>Next.js</strong> — Giao diện nhanh và thân thiện</li>
              <li>• <strong>NestJS</strong> — API backend ổn định và mạnh mẽ</li>
              <li>• <strong>PostgreSQL</strong> — Cơ sở dữ liệu đáng tin cậy</li>
              <li>• <strong>Prisma ORM</strong> — Quản lý dữ liệu hiệu quả</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
