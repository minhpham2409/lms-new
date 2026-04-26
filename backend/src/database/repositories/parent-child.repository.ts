import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BaseRepository } from './base.repository';
import { ParentChild } from '@prisma/client';

@Injectable()
export class ParentChildRepository extends BaseRepository<ParentChild> {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  get model() {
    return this.prisma.parentChild;
  }

  findLink(parentId: string, childId: string) {
    return this.prisma.parentChild.findUnique({
      where: { parentId_childId: { parentId, childId } },
    });
  }

  findChildren(parentId: string) {
    return this.prisma.parentChild.findMany({
      where: { parentId, status: 'accepted' },
      include: { child: { select: { id: true, username: true, firstName: true, lastName: true, email: true } } },
    });
  }

  findPendingRequest(childId: string) {
    return this.prisma.parentChild.findMany({
      where: { childId, status: 'pending' },
      include: { parent: { select: { id: true, username: true, firstName: true, lastName: true } } },
    });
  }

  findOutgoingPending(parentId: string) {
    return this.prisma.parentChild.findMany({
      where: { parentId, status: 'pending' },
      include: {
        child: { select: { id: true, username: true, firstName: true, lastName: true, email: true } },
      },
    });
  }
}
