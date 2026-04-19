"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { FeaturedCourses } from "@/components/home/featured-courses";

const HERO_IMG =
  "https://images.pexels.com/photos/5539293/pexels-photo-5539293.jpeg?auto=compress&cs=tinysrgb&w=1500";

export function LandingHomeContent() {
  const railRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [playIcon, setPlayIcon] = useState<"play" | "pause">("play");

  const onRailMouseDown = useCallback((e: React.MouseEvent) => {
    const el = railRef.current;
    if (!el) return;
    e.preventDefault();
    const startX = e.pageX - el.offsetLeft;
    const scrollLeft = el.scrollLeft;

    const onMove = (ev: MouseEvent) => {
      ev.preventDefault();
      const x = ev.pageX - el.offsetLeft;
      const walk = (x - startX) * 2;
      el.scrollLeft = scrollLeft - walk;
    };
    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, []);

  const toggleVideo = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.muted) {
      v.muted = false;
      v.currentTime = 0;
      setMuted(false);
      setPlayIcon("pause");
    } else {
      v.muted = true;
      setMuted(true);
      setPlayIcon("play");
    }
  }, []);

  useEffect(() => {
    const opts = { threshold: 0.1 };
    const els = document.querySelectorAll<HTMLElement>(
      ".landing-page .features-overview__card, .landing-page .how-it-works__step, .landing-page .impact-stats__item",
    );
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          (entry.target as HTMLElement).style.opacity = "1";
          (entry.target as HTMLElement).style.transform = "translateY(0)";
        }
      });
    }, opts);
    els.forEach((el) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(20px)";
      el.style.transition = "all 0.6s ease-out";
      obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  return (
    <>
      <section className="hero-intro">
        <div className="hero-intro__media">
          <img
            alt="Học sinh cấp 2 học tập trực tuyến"
            src={HERO_IMG}
            className="hero-intro__img"
          />
          <div className="hero-intro__overlay" aria-hidden />
        </div>
        <div className="hero-intro__container">
          <div className="hero-intro__content">
            <h1 className="hero-title">
              Nâng tầm tri thức với lộ trình học tập thông minh
            </h1>
            <p className="hero-subtitle">
              HọcLộ Trình — nền tảng LMS dành cho học sinh cấp 2: giáo viên giảng
              dạy hiệu quả, học sinh học chủ động, phụ huynh đồng hành minh
              bạch.
            </p>
            <div className="hero-intro__actions">
              <a href="#courses">
                <div className="btn-lg btn-primary btn">
                  <span>Khám phá khóa học</span>
                </div>
              </a>
              <a href="#about">
                <div className="btn-lg btn btn-outline">
                  <span>Tìm hiểu thêm</span>
                </div>
              </a>
            </div>
            <div className="hero-intro__roles">
              <span className="hero-intro__roles-label">
                Truy cập nhanh theo vai trò:
              </span>
              <div className="hero-intro__roles-grid">
                <Link href="/teacher">
                  <div className="hero-intro__role-card">
                    <div className="hero-intro__role-icon">
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        aria-hidden
                      >
                        <g
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M8 19H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v11a1 1 0 0 1-1 1" />
                          <path d="M12 14a2 2 0 1 0 4.001-.001A2 2 0 0 0 12 14m5 5a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2" />
                        </g>
                      </svg>
                    </div>
                    <span>Giáo viên</span>
                  </div>
                </Link>
                <Link href="/dashboard">
                  <div className="hero-intro__role-card">
                    <div className="hero-intro__role-icon">
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        aria-hidden
                      >
                        <g
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle r="10" cx="12" cy="12" />
                          <circle r="3" cx="12" cy="10" />
                          <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662" />
                        </g>
                      </svg>
                    </div>
                    <span>Học sinh</span>
                  </div>
                </Link>
                <Link href="/parent">
                  <div className="hero-intro__role-card">
                    <div className="hero-intro__role-icon">
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        aria-hidden
                      >
                        <circle r="2" cx="12" cy="19" fill="currentColor" />
                        <circle r="2" cx="12" cy="5" fill="currentColor" />
                        <circle r="2" cx="16" cy="12" fill="currentColor" />
                        <circle r="2" cx="20" cy="19" fill="currentColor" />
                        <circle r="2" cx="4" cy="19" fill="currentColor" />
                        <circle r="2" cx="8" cy="12" fill="currentColor" />
                      </svg>
                    </div>
                    <span>Phụ huynh</span>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="features-overview">
        <div className="features-overview__container">
          <div className="features-overview__header">
            <h2 className="section-title">
              Giải pháp toàn diện cho mọi vai trò
            </h2>
            <p className="section-subtitle">
              Công cụ chuyên biệt để tối ưu trải nghiệm dạy và học.
            </p>
          </div>
          <div className="features-overview__grid">
            <div className="features-overview__card">
              <div className="features-overview__icon-wrapper">
                <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden>
                  <g
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M8 19H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v11a1 1 0 0 1-1 1" />
                    <path d="M12 14a2 2 0 1 0 4.001-.001A2 2 0 0 0 12 14m5 5a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2" />
                  </g>
                </svg>
              </div>
              <h3 className="features-overview__card-title">Dành cho giáo viên</h3>
              <p className="section-content">
                Tạo và quản lý khóa học, video bài giảng, tài liệu và bài tập
                trong một không gian tập trung.
              </p>
            </div>
            <div className="features-overview__card">
              <div className="features-overview__icon-wrapper">
                <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden>
                  <g
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m6 14l1.45-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.55 6a2 2 0 0 1-1.94 1.5H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82-1.2a2 2 0 0 0 1.66.9H18a2 2 0 0 1 2 2v2" />
                    <circle r="1" cx="14" cy="15" />
                  </g>
                </svg>
              </div>
              <h3 className="features-overview__card-title">Dành cho học sinh</h3>
              <p className="section-content">
                Học theo lộ trình, mở khóa bài học theo tiến độ, làm quiz và bài
                tập để củng cố kiến thức.
              </p>
            </div>
            <div className="features-overview__card">
              <div className="features-overview__icon-wrapper">
                <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden>
                  <circle r="2" cx="12" cy="19" fill="currentColor" />
                  <circle r="2" cx="12" cy="5" fill="currentColor" />
                  <circle r="2" cx="16" cy="12" fill="currentColor" />
                  <circle r="2" cx="20" cy="19" fill="currentColor" />
                  <circle r="2" cx="4" cy="19" fill="currentColor" />
                  <circle r="2" cx="8" cy="12" fill="currentColor" />
                </svg>
              </div>
              <h3 className="features-overview__card-title">Dành cho phụ huynh</h3>
              <p className="section-content">
                Theo dõi tiến độ và kết quả học tập của con minh bạch, không
                can thiệp trực tiếp nội dung bài học.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div id="courses" className="landing-courses-wrap">
        <FeaturedCourses
          className="py-20"
          heading="Khóa học nổi bật"
          subheading="Chọn khóa phù hợp và bắt đầu học ngay hôm nay."
        />
      </div>

      <section className="how-it-works">
        <div className="how-it-works__container">
          <div className="how-it-works__header">
            <h2 className="section-title">Quy trình học tập hiệu quả</h2>
            <p className="section-subtitle">
              Ba bước đơn giản để bắt đầu hành trình.
            </p>
          </div>
          <div className="how-it-works__steps">
            <div className="how-it-works__step">
              <div className="how-it-works__step-num">
                <span>1</span>
              </div>
              <div>
                <h3 className="how-it-works__step-title">Thiết lập khóa học</h3>
                <p className="section-content">
                  Giáo viên xây dựng nội dung, tải video và thiết kế bài kiểm
                  tra theo lộ trình.
                </p>
              </div>
            </div>
            <div className="how-it-works__step">
              <div className="how-it-works__step-num">
                <span>2</span>
              </div>
              <div>
                <h3 className="how-it-works__step-title">Đăng ký &amp; học tập</h3>
                <p className="section-content">
                  Học sinh chọn khóa học, xem bài giảng và hoàn thành bài tập để
                  mở khóa bài tiếp theo.
                </p>
              </div>
            </div>
            <div className="how-it-works__step">
              <div className="how-it-works__step-num">
                <span>3</span>
              </div>
              <div>
                <h3 className="how-it-works__step-title">
                  Giám sát &amp; tiến bộ
                </h3>
                <p className="section-content">
                  Phụ huynh nhận thông tin tiến độ, hỗ trợ con duy trì động lực.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="impact-stats" aria-label="Thống kê">
        <div className="impact-stats__container">
          <div className="impact-stats__grid">
            <div className="impact-stats__item">
              <div className="impact-stats__icon">
                <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden>
                  <g
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" />
                    <path d="M14 2v5a1 1 0 0 0 1 1h5m-4.967 5.44a.647.647 0 0 1 0 1.12l-4.065 2.352a.645.645 0 0 1-.968-.56v-4.704a.645.645 0 0 1 .967-.56z" />
                  </g>
                </svg>
              </div>
              <div className="impact-stats__number">
                <span>500+</span>
              </div>
              <div className="impact-stats__label">
                <span>Khóa học</span>
              </div>
            </div>
            <div className="impact-stats__item">
              <div className="impact-stats__icon">
                <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden>
                  <g
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle r="10" cx="12" cy="12" />
                    <circle r="3" cx="12" cy="10" />
                    <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662" />
                  </g>
                </svg>
              </div>
              <div className="impact-stats__number">
                <span>10.000+</span>
              </div>
              <div className="impact-stats__label">
                <span>Học sinh</span>
              </div>
            </div>
            <div className="impact-stats__item">
              <div className="impact-stats__icon">
                <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden>
                  <g
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 3v16a2 2 0 0 0 2 2h16" />
                    <path d="m19 9l-5 5l-4-4l-3 3" />
                  </g>
                </svg>
              </div>
              <div className="impact-stats__number">
                <span>85%</span>
              </div>
              <div className="impact-stats__label">
                <span>Tiến bộ trung bình</span>
              </div>
            </div>
            <div className="impact-stats__item">
              <div className="impact-stats__icon">
                <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden>
                  <g
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle r="10" cx="12" cy="12" />
                    <path d="M11.051 7.616a1 1 0 0 1 1.909.024l.737 1.452a1 1 0 0 0 .737.535l1.634.256a1 1 0 0 1 .588 1.806l-1.172 1.168a1 1 0 0 0-.282.866l.259 1.613a1 1 0 0 1-1.541 1.134l-1.465-.75a1 1 0 0 0-.912 0l-1.465.75a1 1 0 0 1-1.539-1.133l.258-1.613a1 1 0 0 0-.282-.867l-1.156-1.152a1 1 0 0 1 .572-1.822l1.633-.256a1 1 0 0 0 .737-.535z" />
                  </g>
                </svg>
              </div>
              <div className="impact-stats__number">
                <span>4.9/5</span>
              </div>
              <div className="impact-stats__label">
                <span>Đánh giá hài lòng</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="testimonials" aria-label="Đánh giá">
        <div className="testimonials__header">
          <h2 className="section-title">Người dùng nói gì về chúng tôi</h2>
        </div>
        <div
          ref={railRef}
          className="testimonials__rail"
          onMouseDown={onRailMouseDown}
          role="list"
        >
          {[
            {
              q: "Công cụ tạo khóa học rất trực quan. Tôi quản lý được nhiều lớp mà vẫn đảm bảo chất lượng.",
              n: "Thầy Nguyễn Văn A",
              r: "Giáo viên Toán",
            },
            {
              q: "Em thích các bài học mở khóa dần — như chinh phục kiến thức từng bước.",
              n: "Lê Thị B",
              r: "Học sinh lớp 8",
            },
            {
              q: "Tôi yên tâm khi biết con học gì và tiến bộ ra sao qua báo cáo minh bạch.",
              n: "Chị Trần Thị C",
              r: "Phụ huynh",
            },
            {
              q: "Bài tập chấm tự động giúp tôi tiết kiệm thời gian và tập trung vào giảng dạy.",
              n: "Cô Phạm Thu D",
              r: "Giáo viên Tiếng Anh",
            },
          ].map((t) => (
            <div key={t.n} className="testimonials__card" role="listitem">
              <p className="testimonials__quote">&ldquo;{t.q}&rdquo;</p>
              <div>
                <span className="testimonials__name">{t.n}</span>
                <span className="testimonials__role">{t.r}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="intro-video" aria-label="Video giới thiệu">
        <div className="intro-video__media">
          <video
            ref={videoRef}
            src="https://videos.pexels.com/video-files/6985423/6985423-hd_1280_720_50fps.mp4"
            loop
            muted={muted}
            poster="https://images.pexels.com/videos/6985423/pictures/preview-0.jpg"
            autoPlay
            playsInline
            className="intro-video__bg"
          />
          <div className="intro-video__overlay" aria-hidden />
        </div>
        <div className="intro-video__content">
          <h2 className="hero-title">Trải nghiệm trực quan</h2>
          <p className="hero-subtitle">
            Xem cách HọcLộ Trình hỗ trợ dạy và học — bật âm thanh để nghe thử.
          </p>
          <button
            type="button"
            aria-label={muted ? "Bật âm thanh video" : "Tắt âm thanh video"}
            className="intro-video__play-btn"
            onClick={toggleVideo}
          >
            {playIcon === "play" ? (
              <svg width="64" height="64" viewBox="0 0 24 24" aria-hidden>
                <path
                  d="M8 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z"
                  fill="currentColor"
                />
              </svg>
            ) : (
              <svg width="64" height="64" viewBox="0 0 24 24" aria-hidden>
                <path fill="currentColor" d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            )}
          </button>
          <div>
            <Link href="/auth/signup">
              <div className="btn-lg btn-primary btn">
                <span>Bắt đầu ngay</span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      <section className="get-started-cta">
        <div className="get-started-cta__container">
          <div className="get-started-cta__card">
            <h2 className="section-title">Sẵn sàng chinh phục tri thức?</h2>
            <p className="section-content">
              Tham gia HọcLộ Trình để trải nghiệm môi trường học tập hiện đại
              cho học sinh cấp 2.
            </p>
            <div className="get-started-cta__group">
              <span className="get-started-cta__label">Dành cho người mới:</span>
              <div className="get-started-cta__flex">
                <Link href="/auth/signup?role=student">
                  <div className="btn-lg btn btn-accent">
                    <span>Đăng ký học sinh</span>
                  </div>
                </Link>
                <Link href="/auth/signup?role=teacher">
                  <div className="btn-lg btn btn-secondary">
                    <span>Trở thành giáo viên</span>
                  </div>
                </Link>
              </div>
            </div>
            <div className="get-started-cta__footer">
              <Link href="/courses">
                <div className="btn-link btn">
                  <span>Xem khóa học &amp; học phí</span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
