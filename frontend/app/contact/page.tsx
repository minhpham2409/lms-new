
export const metadata = {
  title: "Liên hệ | HọcLộ Trình",
  description: "Liên hệ với HọcLộ Trình để được hỗ trợ.",
};

export default function Contact() {
  return (
    <div className="py-16">
      <div className="landing-page max-w-4xl mx-auto px-4 md:px-6">
        <div className="mb-12 text-center">
          <h1 className="section-title mb-4">Liên hệ với chúng tôi</h1>
          <p className="section-subtitle">
            Chúng tôi sẵn sàng lắng nghe và hỗ trợ bạn
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="section-title text-2xl mb-6">Thông tin liên hệ</h2>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  className="text-blue-700 flex-shrink-0 mt-1"
                  aria-hidden
                >
                  <g
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
                    <circle r="3" cx="12" cy="10" />
                  </g>
                </svg>
                <div>
                  <h3 className="font-semibold mb-1">Địa chỉ</h3>
                  <p className="section-content">
                    123 Đường Giáo Dục<br />
                    Quận 1, TP. Hồ Chí Minh
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  className="text-blue-700 flex-shrink-0 mt-1"
                  aria-hidden
                >
                  <path
                    d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233a14 14 0 0 0 6.392 6.384"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div>
                  <h3 className="font-semibold mb-1">Điện thoại</h3>
                  <a href="tel:19001234" className="section-content hover:text-blue-700">
                    1900 1234
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  className="text-blue-700 flex-shrink-0 mt-1"
                  aria-hidden
                >
                  <g
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m22 7l-8.991 5.727a2 2 0 0 1-2.009 0L2 7" />
                    <rect x="2" y="4" rx="2" width="20" height="16" />
                  </g>
                </svg>
                <div>
                  <h3 className="font-semibold mb-1">Email</h3>
                  <a
                    href="mailto:lienhe@hoclotrinh.edu.vn"
                    className="section-content hover:text-blue-700"
                  >
                    lienhe@hoclotrinh.edu.vn
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="section-title text-2xl mb-6">Gửi tin nhắn</h2>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Tên</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
                  placeholder="Tên của bạn"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
                  placeholder="Email của bạn"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Tin nhắn
                </label>
                <textarea
                  rows={4}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
                  placeholder="Nội dung tin nhắn..."
                />
              </div>
              <button
                type="submit"
                className="w-full btn btn-primary btn-lg"
              >
                Gửi tin nhắn
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
