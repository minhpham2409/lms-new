import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserRepository, RefreshTokenRepository } from '../database/repositories';
import { JwtTokenService } from './services/jwt-token.service';
import { PasswordService } from './services/password.service';
import { TokenManagerService } from './services/token-manager.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserRepository, useValue: { findByUsernameOrEmail: jest.fn(), findById: jest.fn(), findByEmail: jest.fn() } },
        { provide: RefreshTokenRepository, useValue: { findByUserId: jest.fn() } },
        { provide: JwtTokenService, useValue: { createPayload: jest.fn(), generateTokenPair: jest.fn(), generateAccessToken: jest.fn() } },
        { provide: PasswordService, useValue: { hashPassword: jest.fn(), comparePassword: jest.fn() } },
        { provide: TokenManagerService, useValue: { saveRefreshToken: jest.fn(), revokeRefreshToken: jest.fn(), revokeAllUserTokens: jest.fn() } },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
