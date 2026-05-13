import { Injectable } from '@nestjs/common';
import { User, UserRole } from '@prisma/client';
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
    role?: UserRole | string;
  }): Promise<User> {
    return this.model.create({ data: { ...data, role: (data.role as UserRole) ?? UserRole.student } });
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
        childLinks: {
          where: { status: 'accepted' },
          select: { id: true, parentId: true, status: true },
        },
        parentLinks: {
          where: { status: 'accepted' },
          select: { id: true, childId: true, status: true },
        },
      },
    });
  }

  async findPublicTeachers() {
    return this.model.findMany({
      where: { role: 'teacher' },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        email: true,
        _count: { select: { courses: true } },
      },
    });
  }

  async findPublicTeacherById(id: string) {
    return this.model.findUnique({
      where: { id, role: 'teacher' },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        email: true,
        bio: true,
        createdAt: true,
        courses: {
          where: { status: 'published' },
          select: {
            id: true,
            title: true,
            description: true,
            price: true,
            thumbnail: true,
            _count: { select: { enrollments: true } },
            sections: {
              select: { _count: { select: { lessons: true } } },
            },
          },
        },
      },
    });
  }
}
