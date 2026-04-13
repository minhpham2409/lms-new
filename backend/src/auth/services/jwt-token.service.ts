import { Injectable } from '@nestjs/common';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import { JwtPayload, TokenPair } from '../../shared/interfaces';
import { AUTH_CONSTANTS } from '../../shared/constants';

@Injectable()
export class JwtTokenService {
  constructor(private readonly jwtService: NestJwtService) {}

  /**
   * Generate access token
   */
  generateAccessToken(payload: JwtPayload): string {
    return this.jwtService.sign(payload, {
      expiresIn: AUTH_CONSTANTS.JWT_ACCESS_TOKEN_EXPIRY,
    });
  }

  /**
   * Generate refresh token
   */
  generateRefreshToken(payload: JwtPayload): string {
    return this.jwtService.sign(payload, {
      expiresIn: AUTH_CONSTANTS.JWT_REFRESH_TOKEN_EXPIRY,
    });
  }

  /**
   * Generate both access and refresh tokens
   */
  generateTokenPair(payload: JwtPayload): TokenPair {
    return {
      access_token: this.generateAccessToken(payload),
      refresh_token: this.generateRefreshToken(payload),
    };
  }

  /**
   * Generate password reset token
   */
  generateResetToken(payload: { sub: string; email: string }): string {
    return this.jwtService.sign(payload, {
      expiresIn: AUTH_CONSTANTS.PASSWORD_RESET_TOKEN_EXPIRY,
    });
  }

  /**
   * Verify token and return payload
   */
  verifyToken(token: string): JwtPayload {
    return this.jwtService.verify<JwtPayload>(token);
  }

  /**
   * Decode token without verification
   */
  decodeToken(token: string): JwtPayload | null {
    return this.jwtService.decode(token) as JwtPayload | null;
  }

  /**
   * Create JWT payload from user data
   */
  createPayload(user: {
    id: string;
    username: string;
    email: string;
    role: string;
  }): JwtPayload {
    return {
      sub: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };
  }
}
