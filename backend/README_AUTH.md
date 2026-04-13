# Authentication API Documentation

## Overview
Hệ thống authentication đầy đủ với JWT tokens, refresh tokens, password reset, và profile management.

## Endpoints

### 1. Register User
**POST** `/auth/register`

Đăng ký user mới.

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid",
    "username": "john_doe",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "student",
    "isActive": true,
    "emailVerified": false,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 2. Login
**POST** `/auth/login`

Đăng nhập và nhận access token + refresh token.

**Request Body:**
```json
{
  "username": "john_doe",
  "password": "password123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "username": "john_doe",
    "email": "john@example.com",
    "role": "student",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

### 3. Refresh Token
**POST** `/auth/refresh`

Làm mới access token bằng refresh token.

**Request Body:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 4. Logout
**POST** `/auth/logout`

Đăng xuất và xóa refresh token.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body (Optional):**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

### 5. Get Profile
**GET** `/auth/profile`

Lấy thông tin profile của user hiện tại.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "id": "uuid",
  "username": "john_doe",
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "student",
  "emailVerified": false,
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### 6. Update Profile
**PUT** `/auth/profile`

Cập nhật thông tin profile.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "email": "newemail@example.com"
}
```

**Response:**
```json
{
  "id": "uuid",
  "username": "john_doe",
  "email": "newemail@example.com",
  "firstName": "John",
  "lastName": "Smith",
  "role": "student",
  "emailVerified": false,
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### 7. Change Password
**PATCH** `/auth/change-password`

Đổi mật khẩu (yêu cầu mật khẩu cũ).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "oldPassword": "password123",
  "newPassword": "newpassword123"
}
```

**Response:**
```json
{
  "message": "Password changed successfully"
}
```

### 8. Forgot Password
**POST** `/auth/forgot-password`

Yêu cầu reset password (gửi email với reset token).

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Response:**
```json
{
  "message": "If the email exists, a reset link has been sent",
  "resetToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Note:** Trong production, `resetToken` sẽ được gửi qua email thay vì trả về trong response.

### 9. Reset Password
**POST** `/auth/reset-password`

Reset password bằng token từ email.

**Request Body:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "newPassword": "newpassword123"
}
```

**Response:**
```json
{
  "message": "Password reset successfully"
}
```

## Token Expiration

- **Access Token:** 1 day
- **Refresh Token:** 7 days
- **Reset Token:** 1 hour

## Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Invalid or expired reset token",
  "error": "Bad Request"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized"
}
```

### 409 Conflict
```json
{
  "statusCode": 409,
  "message": "Username or email already exists",
  "error": "Conflict"
}
```

## Security Features

1. **Password Hashing:** Sử dụng bcrypt với salt rounds = 10
2. **JWT Tokens:** Access token và refresh token riêng biệt
3. **Refresh Token Storage:** Lưu trong database với expiry time
4. **Password Reset:** Token có thời hạn 1 giờ
5. **Account Status:** Kiểm tra `isActive` khi login
6. **Token Invalidation:** Xóa tất cả refresh tokens khi đổi password

## Role-Based Access Control

Sử dụng `@Roles()` decorator và `RolesGuard` để bảo vệ endpoints:

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'instructor')
@Get('protected')
async protectedRoute() {
  // Only admin and instructor can access
}
```

## Database Schema

### User Model
- `id`: UUID
- `username`: String (unique)
- `email`: String (unique)
- `password`: String (hashed)
- `firstName`: String (optional)
- `lastName`: String (optional)
- `role`: String (default: "student")
- `isActive`: Boolean (default: true)
- `emailVerified`: Boolean (default: false)
- `resetToken`: String (optional)
- `resetTokenExpiry`: DateTime (optional)

### RefreshToken Model
- `id`: UUID
- `token`: String (unique)
- `userId`: String (foreign key)
- `expiresAt`: DateTime
- `createdAt`: DateTime

## Frontend Integration

### NextAuth Configuration
File `frontend/lib/auth.ts` đã được cấu hình để:
- Lưu access token và refresh token
- Tự động thêm token vào headers
- Xử lý token refresh khi expired

### API Client
File `frontend/lib/auth-api.ts` cung cấp các functions:
- `register()`
- `login()`
- `refreshToken()`
- `logout()`
- `getProfile()`
- `updateProfile()`
- `changePassword()`
- `forgotPassword()`
- `resetPassword()`

## Testing với Swagger

Truy cập `http://localhost:3001/api` để test các endpoints qua Swagger UI.

## Environment Variables

### Backend (.env)
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET=your-jwt-secret-here
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-here
```
