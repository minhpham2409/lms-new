import { Injectable } from '@nestjs/common';
import { RefreshToken } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { BaseRepository } from './base.repository';

@Injectable()
export class RefreshTokenRepository extends BaseRepository<RefreshToken> {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  get model() {
    return this.prisma.refreshToken;
  }

  async findByToken(token: string): Promise<RefreshToken | null> {
    return this.model.findUnique({ where: { token } });
  }

  async createToken(
    userId: string,
    token: string,
    expiresAt: Date,
  ): Promise<RefreshToken> {
    return this.model.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });
  }

  async deleteByToken(token: string): Promise<void> {
    await this.model.delete({ where: { token } });
  }

  async deleteAllByUserId(userId: string): Promise<void> {
    await this.model.deleteMany({ where: { userId } });
  }

  async isTokenValid(token: string): Promise<boolean> {
    const tokenRecord = await this.findByToken(token);
    if (!tokenRecord) return false;
    return tokenRecord.expiresAt > new Date();
  }

  async cleanExpiredTokens(): Promise<number> {
    const result = await this.model.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
    return result.count;
  }
}
