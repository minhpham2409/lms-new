import { Injectable, UnauthorizedException } from '@nestjs/common';
import { RefreshTokenRepository } from '../../database/repositories';
import { DateUtil } from '../../shared/utils';

@Injectable()
export class TokenManagerService {
  constructor(
    private readonly refreshTokenRepository: RefreshTokenRepository,
  ) {}

  /**
   * Save refresh token to database
   */
  async saveRefreshToken(
    userId: string,
    token: string,
    expiresInDays: number = 7,
  ): Promise<void> {
    const expiresAt = DateUtil.addDays(new Date(), expiresInDays);
    await this.refreshTokenRepository.createToken(userId, token, expiresAt);
  }

  /**
   * Validate refresh token
   */
  async validateRefreshToken(token: string): Promise<boolean> {
    return this.refreshTokenRepository.isTokenValid(token);
  }

  /**
   * Revoke refresh token
   */
  async revokeRefreshToken(token: string): Promise<void> {
    await this.refreshTokenRepository.deleteByToken(token);
  }

  /**
   * Revoke all user tokens
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.refreshTokenRepository.deleteAllByUserId(userId);
  }

  /**
   * Get refresh token from database
   */
  async getRefreshToken(token: string) {
    const tokenRecord = await this.refreshTokenRepository.findByToken(token);
    if (!tokenRecord) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    if (DateUtil.isExpired(tokenRecord.expiresAt)) {
      throw new UnauthorizedException('Refresh token expired');
    }
    return tokenRecord;
  }

  /**
   * Clean expired tokens (can be run as cron job)
   */
  async cleanExpiredTokens(): Promise<number> {
    return this.refreshTokenRepository.cleanExpiredTokens();
  }
}
