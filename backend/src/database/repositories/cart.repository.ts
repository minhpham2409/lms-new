import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BaseRepository } from './base.repository';
import { CartItem } from '@prisma/client';

@Injectable()
export class CartRepository extends BaseRepository<CartItem> {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  get model() {
    return this.prisma.cartItem;
  }

  findByUser(userId: string) {
    return this.prisma.cartItem.findMany({
      where: { userId },
      include: {
        course: {
          include: {
            author: { select: { id: true, username: true } },
          },
        },
      },
    });
  }

  findByUserAndCourse(userId: string, courseId: string) {
    return this.prisma.cartItem.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
  }

  clearCart(userId: string) {
    return this.prisma.cartItem.deleteMany({ where: { userId } });
  }
}
