import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { ParentChildRepository } from '../database/repositories';
import { PrismaService } from '../prisma/prisma.service';
import { LinkChildDto } from './dto';

@Injectable()
export class ParentsService {
  constructor(
    private readonly parentChildRepository: ParentChildRepository,
    private readonly prisma: PrismaService,
  ) {}

  async linkChild(dto: LinkChildDto, parentId: string) {
    const child = await this.prisma.user.findUnique({ where: { id: dto.childId } });
    if (!child) throw new NotFoundException('Student not found');
    if (child.role !== 'student') throw new ForbiddenException('Target user is not a student');
    if (dto.childId === parentId) throw new ForbiddenException('Cannot link to yourself');

    const existing = await this.parentChildRepository.findLink(parentId, dto.childId);
    if (existing) throw new ConflictException('Link request already exists');

    return this.parentChildRepository.create({ parentId, childId: dto.childId, status: 'pending' });
  }

  async acceptLink(linkId: string, childId: string) {
    const link = await this.parentChildRepository.findById(linkId);
    if (!link) throw new NotFoundException('Link request not found');
    if (link.childId !== childId) throw new ForbiddenException('This request is not for you');
    if (link.status !== 'pending') throw new ConflictException('Request already processed');
    return this.parentChildRepository.update(linkId, { status: 'accepted' });
  }

  async getChildren(parentId: string) {
    return this.parentChildRepository.findChildren(parentId);
  }

  async getChildProgress(parentId: string, childId: string) {
    const link = await this.parentChildRepository.findLink(parentId, childId);
    if (!link || link.status !== 'accepted') throw new ForbiddenException('Not linked to this student');

    return this.prisma.enrollment.findMany({
      where: { userId: childId },
      include: {
        course: { select: { id: true, title: true, thumbnail: true } },
      },
    });
  }

  async getChildCourses(parentId: string, childId: string) {
    const link = await this.parentChildRepository.findLink(parentId, childId);
    if (!link || link.status !== 'accepted') throw new ForbiddenException('Not linked to this student');

    return this.prisma.enrollment.findMany({
      where: { userId: childId },
      include: {
        course: {
          include: {
            author: { select: { id: true, username: true } },
            _count: { select: { sections: true } },
          },
        },
      },
    });
  }
}
