import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { CreateCourseDto } from '../courses/dto/create-course.dto';
import { CreateLessonDto } from '../lessons/dto/create-lesson.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {
    this.createSuperAdminIfNotExists();
  }

  private async createSuperAdminIfNotExists() {
    const adminExists = await this.prisma.user.findFirst({
      where: { email: 'admin@admin.com' },
    });

    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('password', 10);
      await this.prisma.user.create({
        data: {
          email: 'admin@admin.com',
          password: hashedPassword,
          role: 'admin',
          firstName: 'Admin',
          username: 'admin',
        },
      });
    }
  }

  async getAllUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async createUser(createUserDto: CreateUserDto) {
    const { email, password, role, username } = createUserDto;

    const userExists = await this.prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });

    if (userExists) {
      throw new BadRequestException('User with this email or username already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: { email, password: hashedPassword, role: role || 'student', username },
    });

    const { password: _, ...result } = user;
    return result;
  }

  async updateUser(id: string, updateData: any) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    return this.prisma.user.update({ where: { id }, data: updateData });
  }

  async deleteUser(id: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    await this.prisma.user.delete({ where: { id } });
  }

  async getAllCourses() {
    return this.prisma.course.findMany({
      include: {
        author: {
          select: { id: true, username: true, email: true, firstName: true, lastName: true },
        },
        sections: {
          include: { lessons: true },
        },
      },
    });
  }

  async createCourse(dto: CreateCourseDto) {
    const authorId = dto.authorId;
    if (!authorId) throw new BadRequestException('authorId is required');

    const author = await this.prisma.user.findUnique({ where: { id: authorId } });
    if (!author) throw new NotFoundException('Author not found');

    return this.prisma.course.create({
      data: {
        title: dto.title,
        description: dto.description,
        price: dto.price || 0,
        thumbnail: dto.thumbnail,
        authorId,
      },
      include: {
        author: {
          select: { id: true, username: true, email: true, firstName: true, lastName: true },
        },
      },
    });
  }

  async updateCourse(id: string, updateData: any) {
    const course = await this.prisma.course.findUnique({ where: { id } });
    if (!course) throw new NotFoundException('Course not found');

    if (updateData.authorId) {
      const author = await this.prisma.user.findUnique({ where: { id: updateData.authorId } });
      if (!author) throw new NotFoundException('Author not found');
    }

    return this.prisma.course.update({
      where: { id },
      data: updateData,
      include: {
        author: {
          select: { id: true, username: true, email: true, firstName: true, lastName: true },
        },
      },
    });
  }

  async deleteCourse(id: string): Promise<void> {
    const course = await this.prisma.course.findUnique({ where: { id } });
    if (!course) throw new NotFoundException('Course not found');
    await this.prisma.course.delete({ where: { id } });
  }

  async getAllLessons() {
    return this.prisma.lesson.findMany({
      include: {
        section: {
          include: {
            course: { select: { id: true, title: true } },
          },
        },
      },
    });
  }

  async createLesson(dto: CreateLessonDto) {
    const section = await this.prisma.section.findUnique({ where: { id: dto.sectionId } });
    if (!section) throw new NotFoundException('Section not found');

    const maxOrder = await this.prisma.lesson.findFirst({
      where: { sectionId: dto.sectionId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    return this.prisma.lesson.create({
      data: {
        title: dto.title,
        content: dto.content,
        videoUrl: dto.videoUrl,
        duration: dto.duration,
        order: maxOrder ? maxOrder.order + 1 : 1,
        sectionId: dto.sectionId,
      },
      include: {
        section: {
          include: { course: { select: { id: true, title: true } } },
        },
      },
    });
  }

  async updateLesson(id: string, updateData: any) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id } });
    if (!lesson) throw new NotFoundException('Lesson not found');

    return this.prisma.lesson.update({
      where: { id },
      data: updateData,
      include: {
        section: {
          include: { course: { select: { id: true, title: true } } },
        },
      },
    });
  }

  async deleteLesson(id: string): Promise<void> {
    const lesson = await this.prisma.lesson.findUnique({ where: { id } });
    if (!lesson) throw new NotFoundException('Lesson not found');
    await this.prisma.lesson.delete({ where: { id } });
  }

  async getDashboardStats() {
    const [users, courses, lessons, enrollments] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.course.count(),
      this.prisma.lesson.count(),
      this.prisma.enrollment.count(),
    ]);
    return { users, courses, lessons, enrollments };
  }
}
