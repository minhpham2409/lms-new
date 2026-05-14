import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CertificateRepository, CourseRepository, EnrollmentRepository, UserRepository } from '../database/repositories';
import { StorageService } from '../storage/storage.service';
import { AppEvents } from '../shared/events';
import { CertificateGeneratedPayload } from '../shared/events';
import { randomUUID } from 'crypto';

@Injectable()
export class CertificatesService {
  constructor(
    private readonly certificateRepository: CertificateRepository,
    private readonly courseRepository: CourseRepository,
    private readonly enrollmentRepository: EnrollmentRepository,
    private readonly userRepository: UserRepository,
    private readonly storageService: StorageService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findAll(userId: string) {
    const certs = await this.certificateRepository.findByUser(userId);
    return Promise.all(
      certs.map(async (cert) => ({
        ...cert,
        pdfUrl: await this.storageService.getSignedReadUrl(`certificates/${cert.id}.pdf`),
      }))
    );
  }

  async generate(courseId: string, userId: string) {
    const course = await this.courseRepository.findById(courseId);
    if (!course) throw new NotFoundException('Course not found');
    if (course.status !== 'published') {
      throw new ForbiddenException('Certificates are only issued for published courses');
    }

    const enrollment = await this.enrollmentRepository.findByUserAndCourse(userId, courseId);
    if (!enrollment) throw new NotFoundException('Enrollment not found');
    if (enrollment.progress < 100) {
      throw new BadRequestException('You must complete 100% of the course to get a certificate');
    }

    const user = await this.userRepository.findById(userId);

    const existing = await this.certificateRepository.findByUserAndCourse(userId, courseId);
    if (existing) throw new ConflictException('Certificate already issued for this course');

    const cert = await this.certificateRepository.create({
      userId,
      courseId,
      code: randomUUID(),
    });

    // Emit event for notification + badge check
    this.eventEmitter.emit(AppEvents.CERTIFICATE_GENERATED, {
      certificateId: cert.id,
      userId,
      courseId,
      courseTitle: course.title,
      userName: user ? `${user.firstName} ${user.lastName}` : 'Student',
    } as CertificateGeneratedPayload);

    return cert;
  }

  async findByCode(code: string) {
    const certificate = await this.certificateRepository.findByCode(code);
    if (!certificate) throw new NotFoundException('Certificate not found');
    if (certificate.course.status !== 'published') {
      throw new NotFoundException('Certificate not found');
    }
    return {
      ...certificate,
      course: { id: certificate.course.id, title: certificate.course.title },
      pdfUrl: await this.storageService.getSignedReadUrl(`certificates/${certificate.id}.pdf`),
    };
  }
}
