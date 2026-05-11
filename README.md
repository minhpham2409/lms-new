# HọcLộ Trình - Nền Tảng Học Tập Trực Tuyến Toàn Diện (LMS)

HọcLộ Trình là một hệ thống quản lý học tập (Learning Management System) hiện đại, hỗ trợ đa nền tảng và đa vai trò. Dự án được thiết kế để tự động hóa quy trình giảng dạy, thanh toán, theo dõi tiến độ và tối ưu trải nghiệm tương tác giữa **Giáo viên**, **Học sinh**, **Phụ huynh** và **Ban quản trị (Admin)**.

---

## 🌟 1. Tính Năng Nổi Bật

### 🧑‍🎓 Dành cho Học Sinh
- **Học tập đa phương tiện:** Học qua video, tài liệu văn bản, và làm bài tập nộp file trực tuyến.
- **Tiến độ học tập (Progress Tracking):** Tự động lưu `%` thời lượng xem video và hiển thị trạng thái hoàn thành bài học.
- **Gamification (Chuỗi học tập & Phần thưởng):** Nhận huy hiệu (3, 7, 10 ngày) và mã giảm giá (Coupon) từ 10% - 30% khi duy trì streak đăng nhập 14, 30, 60, 100, 180 ngày liên tục.
- **Thanh toán QR tự động:** Khi mua khóa học, hệ thống tạo mã VietQR động dựa trên giá khóa học, tự động áp dụng mã giảm giá (nếu có).

### 👨‍🏫 Dành cho Giáo Viên
- **Teacher Dashboard:** Phân tích doanh thu, số học sinh mới, và thống kê tương tác qua các biểu đồ trực quan.
- **Quản lý Khóa học (Course Builder):** Soạn thảo giáo trình theo cấu trúc: `Khóa học > Chương (Section) > Bài học (Lesson/Video/Assignment)`. 
- **Chấm bài tự luận (Grading):** Nhận bài nộp của học sinh, chấm điểm và để lại nhận xét chi tiết.
- **Duyệt học sinh & Đối soát thanh toán:** Xem danh sách chờ duyệt, kiểm tra giao dịch qua QR, và click "Duyệt" để cấp quyền truy cập.
- **Public Profile:** Xây dựng trang cá nhân chuyên nghiệp hiển thị tiểu sử, kinh nghiệm và toàn bộ khóa học đang phát hành.

### 👪 Dành cho Phụ Huynh
- **Giám sát kết quả:** Xem chi tiết tiến độ học tập (đã hoàn thành bao nhiêu %), điểm số các bài tập của con cái.
- **Hóa đơn & Biên lai:** Truy xuất lịch sử các khoản thanh toán khóa học với popup QR to rõ ràng để hỗ trợ đóng học phí nhanh chóng.

### 🛡 Dành cho Quản Trị Viên (Admin)
- Quản lý toàn bộ người dùng trên hệ thống.
- Phê duyệt các khóa học do giáo viên soạn thảo trước khi hiển thị ra trang chủ.

---

## 🛠 2. Tech Stack (Công nghệ sử dụng)

### Frontend (User Interface)
- **Framework:** Next.js 15 (App Router, Server Components).
- **Styling:** Tailwind CSS v4 (Hệ thống màu CSS Variables hỗ trợ hoàn hảo Light / Dark Mode).
- **Icons & Animation:** Lucide React, Framer Motion (nếu có), Micro-animations.
- **Video Player:** Custom Video Player với chức năng tracking tiến độ thực.
- **State Management:** React Context API (`AuthContext`, `ThemeContext`).

### Backend (API & Business Logic)
- **Framework:** NestJS (Node.js).
- **Database:** SQLite (Dễ dàng di chuyển, deploy).
- **ORM:** Prisma Client.
- **Security:** JWT (JSON Web Tokens) cho Authentication, Passport.js, Bcrypt cho băm mật khẩu.
- **File Storage:** Multer tích hợp sẵn để lưu trữ Avatar, Video, File bài nộp cục bộ (`/uploads`).

### DevOps
- **Docker:** Multi-stage builds cho cả Frontend và Backend giúp thu nhỏ kích thước Image.
- **Docker Compose:** Orchestration các services chỉ với 1 lệnh khởi chạy.

---

## 📂 3. Cấu Trúc Thư Mục Chi Tiết

```text
lms-new/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Cấu trúc CSDL (Models: User, Course, Section, Lesson...)
│   │   └── dev.db              # File cơ sở dữ liệu SQLite
│   ├── src/
│   │   ├── auth/               # [Module] Login, Register, Change/Reset Password
│   │   ├── users/              # [Module] Quản lý user, Teacher profiles, Cập nhật Bio
│   │   ├── courses/            # [Module] Khóa học, Duyệt khóa học, Course Stats
│   │   ├── sections/           # [Module] Chương học (CRUD)
│   │   ├── lessons/            # [Module] Bài giảng, Upload Video
│   │   ├── enrollments/        # [Module] Xin vào lớp, Duyệt học sinh
│   │   ├── progress/           # [Module] Tracking thời gian xem video
│   │   ├── assignments/        # [Module] Tạo bài tập, Nộp bài, Chấm điểm
│   │   ├── coupons/            # [Module] Sinh mã giảm giá (Streak milestones)
│   │   ├── common/             # Interceptors, Decorators (@GetUser), Guards (JWT, Roles)
│   │   ├── app.module.ts       # Main module
│   │   └── main.ts             # Entry point (Swagger, CORS, ValidationPipe)
│   └── Dockerfile              # Backend Multi-stage build
│
├── frontend/
│   ├── app/
│   │   ├── admin/              # Giao diện Admin
│   │   ├── teacher/            # Giao diện Giáo viên (Dashboard, Grades, Courses Builder)
│   │   ├── dashboard/          # Giao diện Học sinh (Streaks, My Courses)
│   │   ├── parent/             # Giao diện Phụ huynh (Invoices, QR Payment)
│   │   ├── courses/            # [ID] Chi tiết khóa học và màn hình học tập (Player)
│   │   ├── teachers/           # [ID] Trang Public Profile của giáo viên (Hiển thị Bio)
│   │   ├── auth/               # Login, Register
│   │   ├── layout.tsx          # Root Layout (Theme Provider, Auth Provider)
│   │   └── globals.css         # CSS Variables (Màu Dark/Light Mode)
│   ├── components/
│   │   ├── layout/             # Navbar, Footer
│   │   ├── auth/               # Quản lý State đăng nhập
│   │   ├── ui/                 # Nút bấm, Modals, Cards dùng chung
│   │   └── theme-provider.tsx  # Toggle Light/Dark mode
│   ├── public/                 # Ảnh, Icons, Assets tĩnh
│   ├── next.config.ts          # Config Next.js
│   └── Dockerfile              # Frontend Multi-stage build
│
└── docker-compose.yml          # Triển khai dự án
```

---

## 🔌 4. Tài Liệu API (Endpoints)

Toàn bộ API được bảo mật bằng chuẩn Bearer Token.

### 🔐 Authentication & Profile
| Method | Endpoint | Mô tả | Role |
|---|---|---|---|
| POST | `/api/v1/auth/login` | Đăng nhập hệ thống | All |
| POST | `/api/v1/auth/register` | Đăng ký tài khoản | All |
| GET | `/api/v1/auth/profile` | Xem thông tin cá nhân | All |
| PUT | `/api/v1/auth/profile` | Sửa thông tin cá nhân (Bao gồm giới thiệu Bio) | All |
| PATCH | `/api/v1/auth/change-password`| Đổi mật khẩu | All |

### 👨‍🏫 Public Users & Teachers
| Method | Endpoint | Mô tả | Role |
|---|---|---|---|
| GET | `/api/v1/users/public/teachers` | Lấy danh sách giáo viên có khóa học | Public |
| GET | `/api/v1/users/public/teachers/:id`| Xem chi tiết giáo viên và khóa học họ dạy | Public |

### 📚 Khóa Học (Courses & Lessons)
| Method | Endpoint | Mô tả | Role |
|---|---|---|---|
| GET | `/api/v1/courses` | Lấy các khóa học đã Public | Public |
| GET | `/api/v1/courses/:id` | Lấy chi tiết khóa học, chương, bài giảng | Public |
| POST | `/api/v1/courses` | Khởi tạo 1 khóa học mới (Bản nháp) | Teacher |
| GET | `/api/v1/courses/my` | Lấy danh sách khóa học mình làm tác giả | Teacher |
| POST | `/api/v1/courses/:id/submit-review`| Gửi yêu cầu kiểm duyệt khóa học lên Admin | Teacher |
| PATCH | `/api/v1/courses/:id/status` | Phê duyệt/Từ chối khóa học | Admin |

### 💳 Học phí & Tuyển sinh (Enrollments)
| Method | Endpoint | Mô tả | Role |
|---|---|---|---|
| POST | `/api/v1/enrollments` | Xin tham gia khóa học (Chờ duyệt) | Student |
| GET | `/api/v1/enrollments/course/:id` | Lấy danh sách học sinh đang xin vào lớp | Teacher |
| PUT | `/api/v1/enrollments/:id/approve` | Xác nhận đã nhận tiền QR và cấp quyền học | Teacher |
| DELETE| `/api/v1/enrollments/:id` | Từ chối yêu cầu vào lớp | Teacher |

### 🎯 Học tập & Bài tập (Progress & Assignments)
| Method | Endpoint | Mô tả | Role |
|---|---|---|---|
| PATCH | `/api/v1/progress/video/:lessonId`| Cập nhật % xem video thực tế | Student |
| POST | `/api/v1/assignments/:id/submit` | Nộp bài tập (Upload File/Text) | Student |
| GET | `/api/v1/assignments/teacher/all-submissions` | Lấy các bài cần chấm điểm | Teacher |
| PUT | `/api/v1/assignments/grade/:subId` | Chấm điểm (nhập điểm + nhận xét) | Teacher |

---

## 📊 5. Cấu Trúc Database (Prisma Schema Highlights)

- **`User`**: Lưu vai trò (`role`), email, mật khẩu băm, chuỗi học tập (`currentStreak`), và ngày hoạt động cuối (`lastActivityDate`) để tính coupon.
- **`Course`**: Thông tin khóa học, giá tiền (`price`), ảnh bìa (`thumbnail`), trạng thái (`draft`, `published`, `pending`). Liên kết 1-n với `Section`.
- **`Section`**: Chứa các bài giảng, có vị trí (`order`) để sắp xếp.
- **`Lesson`**: Lưu URL video (`videoUrl`), hoặc text. Loại bài học (`video`, `text`, `assignment`).
- **`VideoProgress`**: Lưu `%` thời lượng học sinh đã xem và cờ đánh dấu `isCompleted`.
- **`Enrollment`**: Quản lý ai đang học khóa nào. Trạng thái thanh toán (`pending` / `active`).
- **`Coupon`**: Sinh tự động khi streak học tập đủ điều kiện, lưu `discount` (10, 15, 20...).

---

## ⚙️ 6. Thiết Lập Môi Trường (.env)

Tạo file `.env` ở cả thư mục `backend` và `frontend`.

**Backend (`backend/.env`):**
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="mot_chuoi_bi_mat_rat_dai_va_kho_doan"
PORT=3001
FRONTEND_URL="http://localhost:3000"
```

**Frontend (`frontend/.env.local`):**
```env
NEXT_PUBLIC_API_URL="http://localhost:3001/api/v1"
```

---

## 🐳 7. Hướng Dẫn Deploy Bằng Docker (Khuyên Dùng)

Dự án đã cấu hình Multi-stage builds, cho phép chạy ngay trên bất kỳ hệ điều hành nào mà không cần cài Node.js.

```bash
# Bật Terminal tại thư mục lms-new (chứa file docker-compose.yml)
docker-compose up --build -d
```
Hệ thống sẽ chạy 2 containers:
- **`lms-frontend`**: Khởi chạy Next.js tại `http://localhost:3000`.
- **`lms-backend`**: Khởi chạy NestJS API tại `http://localhost:3001`.

Để kiểm tra logs lỗi nếu có:
```bash
docker-compose logs -f
```

---

## 💻 8. Hướng Dẫn Chạy Môi Trường Local (Development)

Trong trường hợp bạn cần sửa code và dev:

**Bước 1: Chạy Backend API**
```bash
cd backend
npm install
npx prisma db push      # Cập nhật schema vào database SQLite
npm run start:dev       # Server sẽ lắng nghe ở cổng 3001
```

**Bước 2: Chạy Frontend App**
Mở một terminal khác:
```bash
cd frontend
npm install
npm run dev             # Server sẽ lắng nghe ở cổng 3000
```
