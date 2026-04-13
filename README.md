# 🎓 LMS - E-Learning Platform

> Hệ thống quản lý học tập trực tuyến dành cho học sinh cấp 2  
> Đồ án tốt nghiệp - Phiên bản 1.0

## Tech Stack

| Layer        | Technology                    |
| ------------ | ----------------------------- |
| Frontend     | Next.js 14 (App Router)       |
| Backend      | NestJS (Node.js + TypeScript) |
| Database     | PostgreSQL + TypeORM          |
| Auth         | JWT + Refresh Token           |
| File Storage | AWS S3 / MinIO (local)        |
| Video Stream | HLS + ffmpeg                  |
| Cache        | Redis                         |
| Container    | Docker + Docker Compose       |
| Payment      | VietQR + Webhook              |

---

## Tổng quan hệ thống

Nền tảng LMS hỗ trợ 4 vai trò người dùng:

| Vai trò     | Mô tả         | Quyền chính                                      |
| ----------- | ------------- | ------------------------------------------------ |
| **ADMIN**   | Quản trị viên | Quản lý user, duyệt khóa học, thống kê           |
| **TEACHER** | Giáo viên     | Tạo course, upload video, tạo bài tập, chấm điểm |
| **STUDENT** | Học sinh      | Đăng ký khóa học, học bài, nộp bài tập           |
| **PARENT**  | Phụ huynh     | Xem tiến độ học của con                          |

---

## Cài đặt & Chạy dự án

### Yêu cầu

- Node.js >= 18
- Docker & Docker Compose
- Git

### Khởi chạy với Docker

```bash
# Clone repo
git clone <repo-url>
cd lms-platform

# Copy file env
cp .env.example .env

# Khởi chạy toàn bộ services
docker compose up -d
```

Các services sẽ chạy tại:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000/api/v1
- **Swagger Docs**: http://localhost:4000/api/docs
- **MinIO Console**: http://localhost:9001

### Chạy dev (không Docker)

```bash
# Backend
cd backend
npm install
npm run migration:run
npm run seed
npm run start:dev

# Frontend
cd frontend
npm install
npm run dev
```

---

## Cấu trúc dự án

```
lms-platform/
├── backend/                    # NestJS Backend
│   └── src/
│       ├── main.ts
│       ├── app.module.ts
│       ├── config/             # ENV config, DB config
│       ├── common/
│       │   ├── guards/         # JwtAuthGuard, RolesGuard
│       │   ├── decorators/     # @Roles(), @CurrentUser()
│       │   ├── interceptors/   # Transform response, logging
│       │   └── filters/        # Exception filters
│       ├── modules/
│       │   ├── auth/
│       │   ├── users/
│       │   ├── courses/
│       │   ├── sections/
│       │   ├── lessons/
│       │   ├── materials/
│       │   ├── enrollments/
│       │   ├── progress/
│       │   ├── assignments/
│       │   ├── quizzes/
│       │   ├── cart/
│       │   ├── orders/
│       │   ├── payments/
│       │   ├── coupons/
│       │   ├── reviews/
│       │   ├── comments/
│       │   ├── notifications/
│       │   ├── parents/
│       │   ├── certificates/
│       │   └── admin/
│       └── database/
│           ├── migrations/
│           └── seeds/
│
├── frontend/                   # Next.js Frontend
│   └── src/
│       ├── app/
│       │   ├── (public)/       # Landing, khóa học, tìm kiếm
│       │   ├── (auth)/         # Login, Register
│       │   ├── student/        # Dashboard học sinh
│       │   ├── teacher/        # Dashboard giáo viên
│       │   ├── parent/         # Dashboard phụ huynh
│       │   └── admin/          # Admin panel
│       ├── components/
│       │   ├── ui/
│       │   ├── course/
│       │   ├── lesson/
│       │   └── layout/
│       ├── lib/
│       │   ├── api/
│       │   ├── auth/
│       │   └── store/          # Zustand
│       └── types/
│
└── docker-compose.yml
```

---

## API Overview

**Base URL:** `/api/v1`  
**Auth:** `Bearer <JWT Token>`

### Tổng số endpoints: 81

| Module                               | Số Endpoints |
| ------------------------------------ | ------------ |
| Auth                                 | 9            |
| Admin                                | 10           |
| Course + Section + Lesson + Material | 17           |
| Enrollment + Progress                | 6            |
| Assignment + Quiz                    | 10           |
| Cart + Order + Payment + Coupon      | 13           |
| Reviews + Comments                   | 6            |
| Parent                               | 4            |
| Notification + Certificate           | 6            |

---

### 5.1 Auth APIs

| Method | Endpoint                | Auth         | Mô tả                                    |
| ------ | ----------------------- | ------------ | ---------------------------------------- |
| POST   | `/auth/register`        | Public       | Đăng ký tài khoản (role trong body)      |
| POST   | `/auth/login`           | Public       | Đăng nhập, trả về access + refresh token |
| POST   | `/auth/logout`          | Bearer       | Đăng xuất, xóa refresh token             |
| POST   | `/auth/refresh-token`   | RefreshToken | Cấp access token mới                     |
| GET    | `/auth/me`              | Bearer       | Lấy thông tin profile hiện tại           |
| PUT    | `/auth/me`              | Bearer       | Cập nhật profile                         |
| PUT    | `/auth/change-password` | Bearer       | Đổi mật khẩu                             |
| GET    | `/auth/sessions`        | Bearer       | Danh sách phiên đăng nhập                |
| DELETE | `/auth/sessions/:id`    | Bearer       | Đăng xuất phiên cụ thể                   |

---

### 5.2 Admin APIs

| Method | Endpoint                     | Mô tả                                              |
| ------ | ---------------------------- | -------------------------------------------------- |
| GET    | `/admin/users`               | Danh sách user, filter by role, search, pagination |
| POST   | `/admin/users`               | Tạo user mới (thường dùng tạo TEACHER)             |
| PUT    | `/admin/users/:id/status`    | Kích hoạt / vô hiệu hóa tài khoản                  |
| DELETE | `/admin/users/:id`           | Xóa user                                           |
| GET    | `/admin/courses/pending`     | Danh sách khóa học chờ duyệt                       |
| POST   | `/admin/courses/:id/approve` | Duyệt khóa học                                     |
| POST   | `/admin/courses/:id/reject`  | Từ chối, kèm lý do reject                          |
| GET    | `/admin/stats`               | Thống kê tổng: user, course, doanh thu             |
| GET    | `/admin/stats/revenue`       | Doanh thu theo tháng/quý/năm                       |
| GET    | `/admin/stats/courses`       | Thống kê khóa học: enrollment, rating              |

---

### 5.3 Course, Section, Lesson, Material APIs

| Method | Endpoint                     | Auth            | Mô tả                                                               |
| ------ | ---------------------------- | --------------- | ------------------------------------------------------------------- |
| GET    | `/courses`                   | Public          | Danh sách khóa học public (APPROVED), filter: subject, grade, price |
| GET    | `/courses/:id`               | Public          | Chi tiết khóa học (curriculum, reviews, teacher info)               |
| GET    | `/courses/search?q=`         | Public          | Tìm kiếm full-text                                                  |
| POST   | `/courses`                   | TEACHER         | Tạo khóa học mới (status: DRAFT)                                    |
| PUT    | `/courses/:id`               | TEACHER (owner) | Cập nhật thông tin khóa học                                         |
| DELETE | `/courses/:id`               | TEACHER (owner) | Xóa khóa học (chỉ khi DRAFT)                                        |
| POST   | `/courses/:id/submit-review` | TEACHER (owner) | Gửi khóa học lên duyệt                                              |
| GET    | `/teachers/me/courses`       | TEACHER         | Quản lý khóa học của mình                                           |
| POST   | `/sections`                  | TEACHER         | Tạo chương cho khóa học                                             |
| PUT    | `/sections/:id`              | TEACHER (owner) | Cập nhật / reorder chương                                           |
| DELETE | `/sections/:id`              | TEACHER (owner) | Xóa chương                                                          |
| POST   | `/lessons`                   | TEACHER         | Tạo bài học trong chương                                            |
| PUT    | `/lessons/:id`               | TEACHER (owner) | Cập nhật bài học                                                    |
| DELETE | `/lessons/:id`               | TEACHER (owner) | Xóa bài học                                                         |
| POST   | `/lessons/:id/upload-video`  | TEACHER (owner) | Upload video lên S3, lưu URL + duration                             |
| POST   | `/materials`                 | TEACHER         | Đính kèm tài liệu vào bài học                                       |
| DELETE | `/materials/:id`             | TEACHER (owner) | Xóa tài liệu                                                        |

---

### 5.4 Enrollment & Progress APIs

| Method | Endpoint                     | Auth               | Mô tả                                            |
| ------ | ---------------------------- | ------------------ | ------------------------------------------------ |
| GET    | `/students/me/courses`       | STUDENT            | Danh sách khóa học đã đăng ký                    |
| GET    | `/students/me/courses/:id`   | STUDENT            | Chi tiết tiến độ học 1 khóa                      |
| GET    | `/lessons/:id`               | STUDENT (enrolled) | Nội dung bài học (kiểm tra unlock)               |
| POST   | `/progress/video`            | STUDENT            | Cập nhật tiến độ xem video `{lessonId, percent}` |
| GET    | `/progress/lesson/:lessonId` | STUDENT            | Tiến độ bài học cụ thể                           |
| GET    | `/progress/course/:courseId` | STUDENT            | Tổng tiến độ khóa học (%)                        |

---

### 5.5 Assignment & Quiz APIs

| Method | Endpoint                       | Auth            | Mô tả                          |
| ------ | ------------------------------ | --------------- | ------------------------------ |
| POST   | `/assignments`                 | TEACHER         | Tạo bài tập cho lesson         |
| PUT    | `/assignments/:id`             | TEACHER (owner) | Cập nhật bài tập               |
| DELETE | `/assignments/:id`             | TEACHER (owner) | Xóa bài tập                    |
| POST   | `/assignments/:id/submit`      | STUDENT         | Nộp bài tập                    |
| GET    | `/assignments/:id/submissions` | TEACHER         | Xem danh sách bài nộp          |
| PUT    | `/submissions/:id/grade`       | TEACHER         | Chấm điểm: `{score, feedback}` |
| POST   | `/quizzes`                     | TEACHER         | Tạo quiz (gắn với assignment)  |
| POST   | `/questions`                   | TEACHER         | Thêm câu hỏi vào quiz          |
| POST   | `/quizzes/:id/submit`          | STUDENT         | Nộp bài quiz (auto-grade)      |
| GET    | `/quizzes/:id/result`          | STUDENT         | Kết quả quiz                   |

---

### 5.6 Cart, Order & Payment APIs

| Method | Endpoint             | Auth    | Mô tả                              |
| ------ | -------------------- | ------- | ---------------------------------- |
| GET    | `/cart`              | STUDENT | Xem giỏ hàng + tổng tiền           |
| POST   | `/cart/add`          | STUDENT | Thêm khóa học `{courseId}`         |
| DELETE | `/cart/item/:id`     | STUDENT | Xóa item khỏi giỏ                  |
| POST   | `/cart/apply-coupon` | STUDENT | Áp dụng coupon `{code}`            |
| DELETE | `/cart/clear`        | STUDENT | Xóa toàn bộ giỏ                    |
| POST   | `/orders`            | STUDENT | Tạo đơn hàng từ giỏ (snapshot giá) |
| GET    | `/orders/me`         | STUDENT | Lịch sử đơn hàng                   |
| GET    | `/orders/:id`        | STUDENT | Chi tiết đơn hàng                  |
| POST   | `/payments/qr`       | STUDENT | Tạo QR VietQR cho order            |
| POST   | `/payments/webhook`  | System  | Bank gọi về xác nhận thanh toán    |
| POST   | `/coupons`           | ADMIN   | Tạo mã giảm giá                    |
| GET    | `/coupons`           | ADMIN   | Danh sách coupon                   |
| GET    | `/coupons/:code`     | Public  | Kiểm tra coupon hợp lệ             |

---

### 5.7 Review & Comment APIs

| Method | Endpoint                                 | Auth               | Mô tả                                 |
| ------ | ---------------------------------------- | ------------------ | ------------------------------------- |
| POST   | `/reviews`                               | STUDENT (enrolled) | Đánh giá khóa học (1-5 sao + comment) |
| GET    | `/courses/:id/reviews`                   | Public             | Danh sách đánh giá của khóa học       |
| PUT    | `/reviews/:id`                           | STUDENT (owner)    | Sửa đánh giá                          |
| POST   | `/lessons/:id/comments`                  | STUDENT/TEACHER    | Đăng câu hỏi/thảo luận bài học        |
| GET    | `/lessons/:id/comments`                  | STUDENT (enrolled) | Xem thảo luận bài học                 |
| POST   | `/lessons/:id/comments/:commentId/reply` | STUDENT/TEACHER    | Reply comment                         |

---

### 5.8 Parent APIs

| Method | Endpoint                           | Auth    | Mô tả                                            |
| ------ | ---------------------------------- | ------- | ------------------------------------------------ |
| POST   | `/parents/link-child`              | PARENT  | Gửi yêu cầu liên kết với con qua email/studentId |
| POST   | `/parents/link-request/:id/accept` | STUDENT | Học sinh xác nhận liên kết                       |
| GET    | `/parents/me/children`             | PARENT  | Danh sách con đã liên kết                        |
| GET    | `/parents/children/:id/progress`   | PARENT  | Tiến độ học của con                              |
| GET    | `/parents/children/:id/courses`    | PARENT  | Danh sách khóa học của con                       |

---

### 5.9 Notification & Certificate APIs

| Method | Endpoint                  | Auth    | Mô tả                             |
| ------ | ------------------------- | ------- | --------------------------------- |
| GET    | `/notifications`          | Bearer  | Danh sách thông báo               |
| PUT    | `/notifications/:id/read` | Bearer  | Đánh dấu đã đọc                   |
| PUT    | `/notifications/read-all` | Bearer  | Đọc tất cả                        |
| GET    | `/certificates`           | STUDENT | Danh sách chứng chỉ               |
| POST   | `/certificates/generate`  | STUDENT | Tạo chứng chỉ khi hoàn thành 100% |
| GET    | `/certificates/:courseId` | Public  | Xem / verify chứng chỉ            |

---

## Business Logic chính

### Hệ thống Unlock Bài học

Giáo viên cấu hình chế độ unlock khi tạo khóa học:

| Chế độ             | Điều kiện                     |
| ------------------ | ----------------------------- |
| `VIDEO_COMPLETION` | Xem >= 80% video              |
| `ASSIGNMENT_SCORE` | Nộp bài và đạt điểm tối thiểu |
| `BOTH`             | Thỏa cả 2 điều kiện           |
| `NONE`             | Không khóa, học tự do         |

### Flow Mua Khóa học

```
Thêm vào giỏ → Tạo đơn hàng → Generate QR VietQR
→ Học sinh chuyển khoản → Bank webhook → Tạo Enrollment → Vào học
```

### Cấu trúc Khóa học

```
Course
└── Section (Chương)
    └── Lesson (Bài học)
        ├── Video (HLS)
        ├── Material (Tài liệu PDF/DOCX)
        └── Assignment (Bài tập ESSAY/QUIZ)
```

---

## Database Schema

Sử dụng PostgreSQL với UUID làm primary key. Các bảng chính:

- **users** - Tài khoản người dùng (ADMIN/TEACHER/STUDENT/PARENT)
- **courses** - Khóa học (DRAFT → PENDING_REVIEW → APPROVED)
- **sections** / **lessons** - Cấu trúc khóa học
- **enrollments** - Đăng ký khóa học
- **lesson_progress** - Tiến độ học từng bài
- **assignments** / **submissions** - Bài tập & nộp bài
- **orders** / **payments** - Đơn hàng & thanh toán
- **quizzes** / **quiz_questions** - Trắc nghiệm
- **certificates** - Chứng chỉ hoàn thành

---

## Lộ trình phát triển

| Giai đoạn            | Thời gian  | Nội dung                                             |
| -------------------- | ---------- | ---------------------------------------------------- |
| Phase 1 - Core       | Tuần 1-3   | Auth, User, Course CRUD, Upload video                |
| Phase 2 - Learning   | Tuần 4-5   | Enrollment, Video Progress, Unlock Logic, Assignment |
| Phase 3 - Commerce   | Tuần 6-7   | Cart, Order, VietQR Payment, Coupon                  |
| Phase 4 - Engagement | Tuần 8-9   | Quiz, Review, Comment, Notification, Certificate     |
| Phase 5 - Monitoring | Tuần 10    | Parent Dashboard, Admin Analytics                    |
| Phase 6 - Polish     | Tuần 11-12 | UI/UX, Testing, Deploy, Báo cáo                      |

---

## Lưu ý kỹ thuật

- **Video upload:** Dùng presigned URL (S3/MinIO) để upload trực tiếp từ client, không qua server
- **Video streaming:** Xử lý HLS với ffmpeg sau khi upload (background job với Bull Queue)
- **Unlock logic:** Trigger sau mỗi lần chấm điểm và cập nhật video progress
- **Payment webhook:** Validate HMAC signature từ bank, xử lý idempotent
- **JWT:** Lưu refreshToken hash trong DB (không lưu plain), hỗ trợ revoke
- **Pagination:** Tất cả list API phải có pagination (`page`, `limit`, `total`)
- **Soft delete:** Dùng `deleted_at` thay vì xóa cứng cho course/lesson
- **Rate limiting:** Áp dụng NestJS Throttler cho auth endpoints

---

## Liên hệ

Đồ án tốt nghiệp - LMS E-Learning Platform dành cho học sinh cấp 2.
