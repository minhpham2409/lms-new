import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { BaseRepository } from './base.repository';

@Injectable()
export class UserRepository extends BaseRepository<User> {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  get model() {
    return this.prisma.user;
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.model.findUnique({ where: { username } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.model.findUnique({ where: { email } });
  }

  async findByUsernameOrEmail(
    username: string,
    email: string,
  ): Promise<User | null> {
    return this.model.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    });
  }

  async findByResetToken(token: string): Promise<User | null> {
    return this.model.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gte: new Date(),
        },
      },
    });
  }

  async createUser(data: {
    username: string;
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    role?: string;
  }): Promise<User> {
    return this.model.create({ data });
  }

  async updatePassword(userId: string, hashedPassword: string): Promise<User> {
    return this.model.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }

  async setResetToken(
    userId: string,
    token: string,
    expiry: Date,
  ): Promise<User> {
    return this.model.update({
      where: { id: userId },
      data: {
        resetToken: token,
        resetTokenExpiry: expiry,
      },
    });
  }

  async clearResetToken(userId: string): Promise<User> {
    return this.model.update({
      where: { id: userId },
      data: {
        resetToken: null,
        resetTokenExpiry: null,
      },
    });
  }

  async getUserProfile(userId: string) {
    return this.model.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        emailVerified: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}
