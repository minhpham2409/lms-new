# Auth Module Refactoring - Clean Architecture

## Cấu trúc mới

```
backend/src/
├── auth/
│   ├── auth.controller.ts
│   ├── auth.service.ts          # Refactored - sử dụng repositories & services
│   ├── auth.module.ts
│   ├── constants.ts
│   ├── dto/                     # 7 DTOs với validation
│   ├── services/                # NEW
│   │   ├── jwt-token.service.ts
│   │   ├── password.service.ts
│   │   └── token-manager.service.ts
│   └── strategies/
│       ├── jwt.strategy.ts
│       └── local.strategy.ts
│
├── common/                      # NEW - Shared components
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   ├── local-auth.guard.ts
│   │   └── roles.guard.ts
│   ├── decorators/
│   │   ├── get-user.decorator.ts
│   │   └── roles.decorator.ts
│   ├── interceptors/
│   │   └── response.interceptor.ts
│   ├── filters/
│   │   └── http-exception.filter.ts
│   └── pipes/
│       └── validation.pipe.ts
│
├── database/                    # NEW - Repository pattern
│   └── repositories/
│       ├── base.repository.ts
│       ├── user.repository.ts
│       └── refresh-token.repository.ts
│
└── shared/                      # NEW - Utilities & constants
    ├── constants/
    │   └── index.ts
    ├── enums/
    │   └── index.ts
    ├── interfaces/
    │   └── index.ts
    └── utils/
        ├── password.util.ts
        ├── date.util.ts
        └── response.util.ts
```

## Improvements

### 1. Repository Pattern
- `BaseRepository<T>` - Generic CRUD operations
- `UserRepository` - User-specific queries
- `RefreshTokenRepository` - Token management
- Tách biệt data access khỏi business logic

### 2. Service Layer
- `JwtTokenService` - JWT generation/verification
- `PasswordService` - Password hashing/validation
- `TokenManagerService` - Refresh token lifecycle
- Single Responsibility Principle

### 3. Shared Utilities
- `PasswordUtil` - Bcrypt operations + validation
- `DateUtil` - Date manipulation
- `ResponseUtil` - Standardized API responses
- Constants & Enums - Centralized configuration

### 4. Common Components
- Guards, Decorators, Interceptors, Filters, Pipes
- Reusable across all modules
- Consistent error handling & response format

## Benefits

✅ **Separation of Concerns** - Mỗi class có 1 trách nhiệm rõ ràng
✅ **Testability** - Dễ mock repositories & services
✅ **Maintainability** - Code dễ đọc, dễ sửa
✅ **Reusability** - Utilities & repositories dùng chung
✅ **Scalability** - Dễ thêm features mới
✅ **Type Safety** - Interfaces & types đầy đủ

## Usage Examples

### AuthService (Before)
```typescript
// Direct Prisma calls, mixed concerns
const user = await this.prisma.user.findUnique({ where: { username } });
const hashedPassword = await bcrypt.hash(password, 10);
```

### AuthService (After)
```typescript
// Clean, focused on business logic
const user = await this.userRepository.findByUsername(username);
const hashedPassword = await this.passwordService.hashPassword(password);
```

### Repository Pattern
```typescript
// Reusable across modules
const user = await this.userRepository.findByEmail(email);
const profile = await this.userRepository.getUserProfile(userId);
```

### Service Composition
```typescript
const payload = this.jwtTokenService.createPayload(user);
const tokens = this.jwtTokenService.generateTokenPair(payload);
await this.tokenManagerService.saveRefreshToken(userId, tokens.refresh_token);
```
