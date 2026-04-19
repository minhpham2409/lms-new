import Link from "next/link";

export function LandingFooter() {
  return (
    <footer className="footer-root">
      <div className="footer-container">
        <div className="footer-grid">
          <div className="footer-brand-info footer-column">
            <div>
              <span className="footer-logo-text">HọcLộ Trình</span>
            </div>
            <p className="section-content footer-description">
              Hệ thống Quản lý Học tập (LMS) dành cho học sinh cấp 2. Kết nối
              giáo viên, học sinh và phụ huynh trên một nền tảng hiện đại.
            </p>
            <div className="footer-social-links">
              <a href="#" aria-label="Facebook" className="footer-social-icon">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <path
                    d="M7 10v4h3v7h4v-7h3l1-4h-4V8a1 1 0 0 1 1-1h3V3h-3a5 5 0 0 0-5 5v2z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
              <a href="#" aria-label="YouTube" className="footer-social-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden>
                  <path
                    d="M18 3a5 5 0 0 1 5 5v8a5 5 0 0 1-5 5H6a5 5 0 0 1-5-5V8a5 5 0 0 1 5-5zM9 9v6a1 1 0 0 0 1.514.857l5-3a1 1 0 0 0 0-1.714l-5-3A1 1 0 0 0 9 9"
                    fill="currentColor"
                  />
                </svg>
              </a>
            </div>
          </div>
          <div className="footer-column">
            <h2 className="footer-heading section-subtitle">Về chúng tôi</h2>
            <nav aria-label="Về chúng tôi">
              <ul className="footer-list">
                <li>
                  <Link href="/" className="footer-link">
                    Trang chủ
                  </Link>
                </li>
                <li>
                  <Link href="/courses" className="footer-link">
                    Khóa học
                  </Link>
                </li>
                <li>
                  <Link href="/teacher" className="footer-link">
                    Dành cho giáo viên
                  </Link>
                </li>
                <li>
                  <Link href="/parent" className="footer-link">
                    Dành cho phụ huynh
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
          <div className="footer-column">
            <h2 className="footer-heading section-subtitle">Tài nguyên</h2>
            <nav aria-label="Tài nguyên">
              <ul className="footer-list">
                <li>
                  <a href="#about" className="footer-link">
                    Giới thiệu nền tảng
                  </a>
                </li>
                <li>
                  <Link href="/courses" className="footer-link">
                    Danh mục khóa học
                  </Link>
                </li>
                <li>
                  <a href="mailto:lienhe@hoclotrinh.edu.vn" className="footer-link">
                    Hỗ trợ
                  </a>
                </li>
              </ul>
            </nav>
          </div>
          <div className="footer-column">
            <h2 className="footer-heading section-subtitle">Liên hệ</h2>
            <ul className="footer-contact-list">
              <li className="footer-contact-item">
                <div className="footer-contact-icon-box">
                  <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden>
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
                </div>
                <span className="section-content">
                  123 Đường Giáo Dục, Quận 1, TP. Hồ Chí Minh
                </span>
              </li>
              <li className="footer-contact-item">
                <div className="footer-contact-icon-box">
                  <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden>
                    <path
                      d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233a14 14 0 0 0 6.392 6.384"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <a href="tel:19001234" className="footer-link section-content">
                  1900 1234
                </a>
              </li>
              <li className="footer-contact-item">
                <div className="footer-contact-icon-box">
                  <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden>
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
                </div>
                <a
                  href="mailto:lienhe@hoclotrinh.edu.vn"
                  className="footer-link section-content"
                >
                  lienhe@hoclotrinh.edu.vn
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="footer-divider" />
          <div className="footer-bottom-content">
            <p className="section-content footer-copyright">
              © {new Date().getFullYear()} HọcLộ Trình. Tất cả quyền được bảo
              lưu.
            </p>
            <div className="footer-badges">
              <span className="footer-badge">Next.js</span>
              <span className="footer-badge">NestJS</span>
              <span className="footer-badge">PostgreSQL</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
