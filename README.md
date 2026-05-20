# 📚 HọcLộ Trình — Nền Tảng Quản Lý Học Tập Trực Tuyến Toàn Diện (LMS)

HọcLộ Trình là một hệ thống quản lý học tập (Learning Management System - LMS) cấp độ doanh nghiệp (Enterprise-Grade) được thiết kế hiện đại, hiệu năng cao, hỗ trợ đa nền tảng và quản trị đa vai trò. Hệ thống tích hợp toàn diện các quy trình từ biên soạn giáo trình trực quan, xử lý chuyển đổi luồng phát video HLS ngầm, thanh toán VietQR khớp tự động qua cổng SePay, hệ thống game hóa tích lũy chuỗi ngày học tập (Gamification & Streaks) đến các công cụ kiểm soát an toàn tài chính, quản trị ví và báo cáo tiến trình đặc quyền cho phụ huynh.

---

## 🏗️ 1. Kiến Trúc & Công Nghệ (Tech Stack)

Hệ thống được thiết kế theo kiến trúc module hóa hướng sự kiện (Event-Driven Architecture) giúp tăng khả năng mở rộng, độc lập nghiệp vụ và xử lý bất đồng bộ không gây nghẽn luồng chính.

```
       [ Client Browser (Next.js v15 App Router) ]
                           │  ▲  (CORS, Axios, JWT Bearer HttpOnly)
                           ▼  │
               [ NestJS API Gateway / Router ]
                           │  ▲  (Guards: JWT, Roles - RBAC)
                           ▼  │
                 [ NestJS Module Controllers ]
                           │
             ┌─────────────┴─────────────┐
             ▼ (Synchronous)             ▼ (Asynchronous Event)
    [ Services & Repos ]           [ EventEmitter2 ]
             │                           │
    [ Prisma ORM PostgreSQL ]            ▼
             │                   [ Bull Queues (Redis) ]
             ▼                           │
     [ ElephantSQL DB ]       ┌──────────┼──────────┐
                              ▼          ▼          ▼
                          [ Email ]   [ HLS ]  [ Revenue ]
```

### 💻 Frontend (Client Application)
- **Framework:** Next.js v15 (App Router, React Server Components - RSC).
- **Styling:** Tailwind CSS v4 (Hệ thống CSS Variables thích ứng cao cấp cho Dark / Light Mode).
- **State Management:** React Context API (`AuthContext`, `ThemeContext`).
- **Media Player:** Custom Video Player tích hợp API theo dõi thời lượng thực của video.
- **Client Integration:** Axios Interceptor tự động xử lý xoay vòng phiên đăng nhập JWT (Refresh Token Rotation).

### ⚙️ Backend (RESTful API & Workers)
- **Core Engine:** NestJS Framework (TypeScript).
- **Event Bus:** `@nestjs/event-emitter` (EventEmitter2) xử lý giao tiếp phi tập trung chéo module.
- **Background Jobs:** Bull Queue (tích hợp Redis) xử lý tác vụ nặng (chuyển đổi HLS, render PDF, gửi mail, chia sẻ doanh thu).
- **ORM & DB:** Prisma ORM liên kết PostgreSQL (hỗ trợ atomic transaction).
- **Security:** Passport JWT (Access Token 15m băm chữ ký, HttpOnly Refresh Token 7d), Bcrypt mã hóa mật khẩu.
- **Media Engine:** FFmpeg tích hợp chuyển đổi tự động luồng phát trực tuyến HLS.

---

## 📊 2. Thiết Kế Cơ Sở Dữ Liệu (Database Schema)

CSDL được xây dựng chặt chẽ trên PostgreSQL bằng Prisma ORM, chuẩn hóa dữ liệu tối đa và thiết lập các chỉ mục (Indexes) hợp lý để tăng tốc truy vấn.

```mermaid
erDiagram
  User ||--o{ Course : "Authored"
  User ||--o{ Enrollment : "Enrolled"
  User ||--o{ Order : "Placed"
  User ||--o{ CartItem : "Cart"
  User ||--o{ Wallet : "Owns"
  User ||--o{ UserBadge : "Earned"
  User ||--o{ Certificate : "Graduated"
  User ||--o{ ParentChild : "Parent/Child Relations"
  
  Course ||--o{ Section : "Contains"
  Section ||--o{ Lesson : "Contains"
  Lesson ||--o{ VideoProgress : "Tracks"
  Lesson ||--o{ Assignment : "Has"
  
  Order ||--o{ OrderItem : "Contains"
  Order ||--o| Payment : "Billed"
  Order ||--o{ RefundRequest : "Refunds"
  Wallet ||--o{ WalletTransaction : "Logs"
  Wallet ||--o{ PayoutRequest : "Payouts"
```

### Các Entity chính trong Prisma Schema:
- **`User`**: Chứa định danh, vai trò (`UserRole: student, teacher, parent, admin`), credentials, streaks ngày học (`currentStreak`, `lastActivityDate`), cùng cấu hình thông tin ngân hàng thụ hưởng.
- **`Course`**: Thông tin khóa học, giá (`price`), cover, trạng thái phê duyệt (`CourseStatus: draft, pending, published, rejected`).
- **`Lesson`**: Bài giảng chứa nội dung text hoặc liên kết video HLS (`mediaAssetId`), phân loại (`video, text, assignment`).
- **`VideoProgress`**: Lưu trữ đơn điệu (monotonic) phần trăm xem video thực tế của học viên và cờ đánh dấu `completed`.
- **`Enrollment`**: Trạng thái tham gia khóa học (`active, pending, cancelled`) và tổng tiến độ phần trăm khóa học (`progress`).
- **`Order` & `OrderItem`**: Đơn hàng mua khóa học, lưu trữ tổng giá gốc, giá sau giảm và liên kết Coupon sử dụng.
- **`Payment`**: Quản lý thanh toán hóa đơn: theo dõi số tiền cần trả (`amount`), thực nhận (`paidAmount`), còn thiếu (`remainingAmount`) và số dư thừa chuyển dư (`overpaidAmount`).
- **`Wallet` & `WalletTransaction`**: Ví tiền thu nhập giảng viên, theo dõi số dư khả dụng (`balance`), số tiền chờ duyệt rút (`pendingBalance`), tổng thu nhập (`totalEarned`) kèm chỉ mục `idempotencyKey` bảo mật giao dịch chia sẻ doanh thu.
- **`PayoutRequest`**: Lệnh yêu cầu rút tiền của giảng viên, chụp ảnh nhanh snapshot ngân hàng thụ hưởng tại thời điểm rút.
- **`RefundRequest`**: Lệnh hoàn trả tiền mặt cho phụ huynh khi thanh toán dư thừa.
- **`ParentChild`**: Quản lý liên kết giám sát giữa Phụ huynh và Học sinh (`status: pending, accepted`).

---

## 🎯 3. Phân Tích Ca Sử Dụng (Use Cases)

Hệ thống phân quyền dựa trên vai trò nghiêm ngặt (RBAC - Role-Based Access Control) thông qua `RolesGuard` của NestJS:

```
┌────────────────────────────────────────────────────────────────────────┐
│                              LMS PLATFORM                              │
├───────────────┬────────────────┬───────────────────┬───────────────────┤
│    STUDENT    │    TEACHER     │      PARENT       │       ADMIN       │
├───────────────┼────────────────┼───────────────────┼───────────────────┤
│ • Xem Khóa học│ • Soạn giáo án │ • Yêu cầu liên kết│ • Phê duyệt khóa  │
│ • Thêm Giỏ    │ • Xem Dashboard│   tài khoản con   │ • Phê duyệt lệnh  │
│ • Áp dụng Mã  │   thu nhập     │ • Xem Dashboard   │   rút tiền Payout │
│ • Thanh toán  │ • Chấm điểm tự │   học tập của con │ • Quản lý User &  │
│   QR VietQR   │   luận essay   │ • Yêu cầu hoàn    │   Safeguards      │
│ • Học Video & │ • Quản lý lớp  │   trả tiền chuyển │ • Giám sát sức    │
│   Làm Quiz/   │   học & Duyệt  │   dư thừa         │   khỏe hàng đợi   │
│   Assignment  │   học viên free│ • Tạo QR thanh    │   Bull Queue      │
│ • Nhận Badge  │ • Tạo lệnh rút │   toán hộ con     │ • Cấu hình phí    │
│   & Chứng chỉ │   tiền Payout  │                   │   nền tảng %      │
└───────────────┴────────────────┴───────────────────┴───────────────────┘
```

---

## 🔄 4. Quy Trình Vận Hành Cốt Lõi (Business Workflows)

### 🔑 4.1. Xác Thực Bảo Mật & Xoay Vòng Phiên (Auth & JWT Rotation Flow)
1. **Đăng ký an toàn:** Cho phép tự đăng ký tài khoản qua API công khai với vai trò `student` hoặc `parent`. Chặn escalate quyền làm `teacher` hay `admin`.
2. **Đăng nhập băm mật khẩu:** Xác thực thông tin, đối chiếu băm `bcrypt`, trả về mã token kép.
3. **JWT Rotation (Xoay vòng):** Trình duyệt lưu Access Token (15 phút) tại in-memory và Refresh Token (7 ngày) tại HttpOnly Cookie. Khi Access Token hết hạn, client tự gửi yêu cầu làm mới ngầm. Hệ thống xóa Refresh Token cũ trong DB, sinh cặp Token mới hoàn toàn.
4. **Cơ chế chống chiếm đoạt:** Nếu phát hiện một Refresh Token cũ đã dùng rồi được gửi lại -> Hệ thống tự động thu hồi toàn bộ các phiên đăng nhập (Revoke All Sessions) của User đó vì phát hiện dấu hiệu xâm nhập bất hợp pháp.

### 🎥 4.2. Chuyển Đổi Phát Trực Tuyến Video HLS (HLS Video Conversion Flow)
1. Giảng viên soạn thảo nội dung bài học, tải lên tệp tin video `.mp4`.
2. **Kiểm duyệt an toàn:** Hệ thống kiểm tra Magic Bytes (File Signature) phần đầu tệp để chặn đứng việc đổi đuôi file mã độc trà trộn.
3. Đẩy file video lên vùng lưu trữ riêng tư S3, khởi động Job ngầm gửi vào Bull Queue `video-queue`.
4. Worker Bull Queue gọi công cụ **FFmpeg** băm cắt video gốc thành các phân đoạn nhỏ `.ts` cùng file chỉ mục chứa luồng danh sách `.m3u8` theo tiêu chuẩn phát trực tuyến an toàn **HLS**.
5. Cập nhật trạng thái Lesson thành `READY`. Khi học sinh học bài, Media Controller sinh Signed URL tải luồng phân đoạn HLS về trình duyệt nếu học sinh đã thanh toán học phí thành công.

### 💳 4.3. Thanh Toán Tự Động Qua QR & Xử Lý Sai Lệch Số Tiền (VietQR & Webhook Flow)
1. **Khởi tạo:** Học sinh chọn giỏ hàng, áp dụng coupon thưởng streak (nếu có), xác nhận đặt hàng. Đơn hàng `Order` và `Payment` được khởi tạo trạng thái `pending` trong một Prisma Transaction đồng nhất.
2. **Quét mã:** Hệ thống sinh VietQR động kết hợp mã giao dịch định dạng `HP<txnRef>` (9 ký tự số ngẫu nhiên).
3. **Webhook handshake:** Khách hàng chuyển khoản. Cổng ngân hàng đẩy callback đến webhook SePay.
4. **Idempotency Guard:** Webhook payload được băm SHA256 tạo thành khóa duy nhất lưu vào DB. Mọi gói tin trùng lặp gửi sau sẽ bị chặn đứng lập tức.
5. **Phân nhánh xử lý số tiền:**
    *   **Đúng số tiền:** Kích hoạt giao dịch hoàn tất, đổi trạng thái Order và Payment thành `completed`, tự động cấp quyền vào lớp học (`Enrollment: active`), emit sự kiện `payment.completed`.
    *   **Chuyển khoản thiếu tiền:** Hệ thống ghi nhận số tiền thiếu, tự động sinh mã QR VietQR mới cho số tiền còn thiếu kèm mã giao dịch mới, gửi cảnh báo yêu cầu học sinh quét thanh toán nốt số dư.
    *   **Chuyển khoản dư tiền:** Kích hoạt khóa học bình thường, ghi nhận số dư chuyển thừa (`overpaidAmount`), đồng thời gửi thông báo khẩn cấp cho Phụ huynh yêu cầu gửi tài khoản nhận hoàn tiền thừa.

### 📈 4.4. Theo Dõi Tiến Độ Monotonic & Vinh Danh Thành Tựu (Progress & Gamification Flow)
1. Custom Video Player định kỳ báo cáo tiến trình xem video thực tế của học sinh.
2. **Server-side Monotonic Guard:** Hệ thống chỉ cập nhật tăng phần trạng xem, chặn đứng tua ngược làm giảm tiến độ.
3. **Kiểm duyệt bài học:** Server tự quyết định bài giảng hoàn thành **chỉ khi xem tối thiểu 90% thời lượng**.
4. Khi hoàn thành toàn bộ bài học (tiến độ khóa học đạt 100%):
    *   **Chứng chỉ:** Hệ thống sinh mã verification code độc nhất, kích hoạt hàng đợi ngầm render PDF chứng chỉ học tập chuyên nghiệp và lưu trữ bảo mật lên S3 Storage.
    *   **Gamification:** Kích hoạt dịch vụ thành tựu đối soát hoạt động, trao các Huy hiệu (Badge) tương ứng và sinh mã coupon đặc quyền giảm giá 10% - 30% gửi tặng học sinh.

### 💰 4.5. Phân Chia Doanh Thu Doanh Nghiệp & Rút Tiền Ví Giáo Viên (Wallet Payout Flow)
1. Sau sự kiện `payment.completed`, Bull Queue `wallet-queue` kích hoạt xử lý job chia sẻ doanh thu ngầm:
    *   Thu nhập nền tảng (Platform fee) = `Đơn giá * Config Platform Fee%` (mặc định 20%).
    *   Doanh thu giáo viên = `Đơn giá - Platform fee`.
    *   Giao dịch bốc tách ghi nhận ví chạy nguyên tử cùng khóa chống trùng lặp `revenue:{orderId}:{courseId}`.
2. **Yêu cầu rút tiền (Payout Request):** Giảng viên nhập thông tin ngân hàng, tạo yêu cầu rút tiền. Hệ thống chạy transaction nguyên tử: Khóa hàng dữ liệu ví -> Kiểm tra số dư khả dụng (`balance >= amount`) -> Trừ `balance` -> Cộng `pendingBalance` -> Tạo Payout trạng thái `PENDING`.
3. **Phê duyệt rút tiền (Payout Approval):** Admin thực hiện chuyển khoản thực tế, nhập mã giao dịch, bấm duyệt. Transaction kiểm tra Payout phải đang ở trạng thái `PENDING` (Chống double-approve), đổi trạng thái thành `APPROVED` và trừ `pendingBalance`. Nếu Admin từ chối, hệ thống hoàn trả lại tiền từ `pendingBalance` về `balance` cho giảng viên.

### 👪 4.6. Giám Sát Của Phụ Huynh (Parental Monitoring Flow)
1. Phụ huynh gửi yêu cầu liên kết tới email/username của con. Con truy cập thông báo chọn Chấp nhận kết nối.
2. Phụ huynh được cấp quyền mở khóa màn hình báo cáo đặc quyền, hiển thị tường tận tiến trình khóa học của con, các chứng chỉ con đạt được, điểm số các bài quiz và bài tập tự luận.
3. Phụ huynh có quyền tạo QR thanh toán học phí thay con, hoặc gửi yêu cầu hoàn tiền khi chuyển khoản dư.

---

## ⚙️ 5. Cấu Hình Môi Trường (.env)

Khởi tạo các tệp cấu hình môi trường tại thư mục dự án tương ứng:

### Backend (`backend/.env`):
```env
# Database liên kết PostgreSQL
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/lets_learn_lms?schema=public"

# Bảo mật JWT
JWT_SECRET="viet_mot_chuoi_bi_mat_enterprise_sieu_dai_va_bao_mat_o_day"

# Máy chủ API
PORT=3001
FRONTEND_URL="http://localhost:3000"

# Cấu hình lưu trữ File (S3 / MinIO)
STORAGE_PROVIDER="local" # hoặc "s3"
S3_ENDPOINT="http://localhost:9000"
S3_ACCESS_KEY="minio_admin"
S3_SECRET_KEY="minio_admin_secret"
S3_BUCKET_NAME="lets-learn-lms-private"

# Tích hợp Redis cho Bull Queue
REDIS_HOST="localhost"
REDIS_PORT=6379

# Webhook SePay bảo mật
WEBHOOK_SECRET="sepay_webhook_secret_key"
BANK_CODE="MB"
BANK_ACCOUNT="9999999999"
BANK_ACCOUNT_NAME="CONG TY CONG NGHE LMS"

# Thiết lập khởi tạo Admin hệ thống ban đầu
BOOTSTRAP_ADMIN_EMAIL="admin@letslearn.edu.vn"
BOOTSTRAP_ADMIN_USERNAME="admin"
BOOTSTRAP_ADMIN_PASSWORD="SuperSecurePassword2026@"
```

### Frontend (`frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL="http://localhost:3001/api/v1"
```

---

## 🐳 6. Hướng Dẫn Triển Khai & Cài Đặt (Deployment & Installation)

### 📦 Cách 1: Triển khai nhanh bằng Docker Compose (Khuyên dùng trong Production/Staging)
Dự án đã được thiết lập quy trình Dockerize tối ưu qua Multi-stage build nhằm tinh gọn kích thước image tối đa.

1. Đảm bảo máy chủ đã cài đặt Docker và Docker Compose.
2. Khởi chạy toàn bộ hệ thống (Frontend, Backend, PostgreSQL, Redis, MinIO) bằng một lệnh duy nhất:
   ```bash
   docker-compose up --build -d
   ```
3. Xem trạng thái và kiểm tra log vận hành của các container:
   ```bash
   docker-compose ps
   docker-compose logs -f lms-backend
   ```

### 💻 Cách 2: Cài đặt thủ công bằng môi trường Local (Development)

#### Bước 1: Khởi động các cơ sở hạ tầng bổ trợ (PostgreSQL, Redis)
Có thể chạy nhanh qua Docker hỗ trợ:
```bash
docker run --name lms-postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres
docker run --name lms-redis -p 6379:6379 -d redis
```

#### Bước 2: Khởi chạy ứng dụng Backend API (NestJS)
```bash
cd backend
npm install

# Đồng bộ hóa cấu trúc Database Prisma Schema vào PostgreSQL
npx prisma db push

# Chạy seed dữ liệu hệ thống ban đầu (Tài khoản Admin, cấu hình, danh sách Huy hiệu)
npx prisma db seed

# Khởi chạy máy chủ phát triển
npm run start:dev
```
*API sẽ lắng nghe cổng kết nối tại: `http://localhost:3001` (Tài liệu Swagger API sẽ khả dụng tại: `http://localhost:3001/api/docs`).*

#### Bước 3: Khởi chạy ứng dụng Frontend (Next.js)
```bash
cd ../frontend
npm install

# Khởi chạy môi trường phát triển
npm run dev
```
*Giao diện người dùng sẽ khả dụng tại địa chỉ: `http://localhost:3000`.*
