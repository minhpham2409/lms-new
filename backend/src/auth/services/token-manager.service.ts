import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { createHash } from 'crypto';
import { RefreshTokenRepository } from '../../database/repositories';
import { DateUtil } from '../../shared/utils';

@Injectable()
export class TokenManagerService {
  constructor(
    private readonly refreshTokenRepository: RefreshTokenRepository,
  ) {}

  /** Hash a plain token with SHA-256 before DB storage. */
  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  /**
   * Save refresh token (hashed) to database
   */
  async saveRefreshToken(
    userId: string,
    token: string,
    expiresInDays: number = 7,
  ): Promise<void> {
    const expiresAt = DateUtil.addDays(new Date(), expiresInDays);
    const hashedToken = this.hashToken(token);
    await this.refreshTokenRepository.createToken(userId, hashedToken, expiresAt);
  }

  /**
   * Validate refresh token (compare hash)
   */
  async validateRefreshToken(token: string): Promise<boolean> {
    const hashedToken = this.hashToken(token);
    return this.refreshTokenRepository.isTokenValid(hashedToken);
  }

  /**
   * Revoke refresh token
   */
  async revokeRefreshToken(token: string): Promise<void> {
    const hashedToken = this.hashToken(token);
    await this.refreshTokenRepository.deleteByToken(hashedToken);
  }

  /**
   * Revoke all user tokens
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.refreshTokenRepository.deleteAllByUserId(userId);
  }

  /**
   * Get refresh token from database (using hash)
   */
  async getRefreshToken(token: string) {
    const hashedToken = this.hashToken(token);
    const tokenRecord = await this.refreshTokenRepository.findByToken(hashedToken);
    if (!tokenRecord) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    if (DateUtil.isExpired(tokenRecord.expiresAt)) {
      // Clean up expired token
      await this.refreshTokenRepository.deleteByToken(hashedToken);
      throw new UnauthorizedException('Refresh token expired');
    }
    return tokenRecord;
  }

  private readonly logger = new Logger(TokenManagerService.name);

  /**
   * Clean expired tokens (can be run as cron job)
   */
  async cleanExpiredTokens(): Promise<number> {
    return this.refreshTokenRepository.cleanExpiredTokens();
  }

  /** Run every day at 2:00 AM to prevent DB bloat */
  @Cron('0 2 * * *')
  async handleExpiredTokenCleanup() {
    const count = await this.cleanExpiredTokens();
    this.logger.log(`[Cron] Cleaned ${count} expired refresh tokens`);
  }
}
