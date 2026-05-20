import {
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { CertificatesService } from './certificates.service';

describe('CertificatesService', () => {
  let service: CertificatesService;
  let certRepo: {
    findByUser: jest.Mock;
    findByUserAndCourse: jest.Mock;
    create: jest.Mock;
    findByCode: jest.Mock;
  };
  let courseRepo: { findById: jest.Mock };
  let enrollmentRepo: { findByUserAndCourse: jest.Mock };
  let userRepo: { findById: jest.Mock };
  let storageService: { getSignedReadUrl: jest.Mock };
  let eventEmitter: { emit: jest.Mock };

  beforeEach(() => {
    certRepo = {
      findByUser: jest.fn(),
      findByUserAndCourse: jest.fn(),
      create: jest.fn(),
      findByCode: jest.fn(),
    };
    courseRepo = { findById: jest.fn() };
    enrollmentRepo = { findByUserAndCourse: jest.fn() };
    userRepo = { findById: jest.fn() };
    storageService = { getSignedReadUrl: jest.fn().mockResolvedValue('https://signed-url.com/cert.pdf') };
    eventEmitter = { emit: jest.fn() };

    service = new CertificatesService(
      certRepo as any,
      courseRepo as any,
      enrollmentRepo as any,
      userRepo as any,
      storageService as any,
      eventEmitter as any,
    );
  });

  // ─── generate ───────────────────────────────────────────────────────────────

  describe('generate', () => {
    it('should generate a certificate for 100% completed course', async () => {
      courseRepo.findById.mockResolvedValue({ id: 'course-1', title: 'Test', status: 'published' });
      enrollmentRepo.findByUserAndCourse.mockResolvedValue({ id: 'enroll-1', progress: 100 });
      userRepo.findById.mockResolvedValue({ id: 'user-1', firstName: 'John', lastName: 'Doe' });
      certRepo.findByUserAndCourse.mockResolvedValue(null);
      certRepo.create.mockResolvedValue({ id: 'cert-1', code: 'abc-def' });

      const result = await service.generate('course-1', 'user-1');

      expect(result.id).toBe('cert-1');
      expect(eventEmitter.emit).toHaveBeenCalled();
    });

    it('should throw NotFoundException when course does not exist', async () => {
      courseRepo.findById.mockResolvedValue(null);

      await expect(service.generate('bad-id', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for unpublished course', async () => {
      courseRepo.findById.mockResolvedValue({ id: 'course-1', status: 'draft' });

      await expect(service.generate('course-1', 'user-1')).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when not enrolled', async () => {
      courseRepo.findById.mockResolvedValue({ id: 'course-1', status: 'published' });
      enrollmentRepo.findByUserAndCourse.mockResolvedValue(null);

      await expect(service.generate('course-1', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when progress < 100%', async () => {
      courseRepo.findById.mockResolvedValue({ id: 'course-1', status: 'published' });
      enrollmentRepo.findByUserAndCourse.mockResolvedValue({ progress: 80 });

      await expect(service.generate('course-1', 'user-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException for duplicate certificate', async () => {
      courseRepo.findById.mockResolvedValue({ id: 'course-1', status: 'published' });
      enrollmentRepo.findByUserAndCourse.mockResolvedValue({ progress: 100 });
      userRepo.findById.mockResolvedValue({ id: 'user-1' });
      certRepo.findByUserAndCourse.mockResolvedValue({ id: 'existing-cert' });

      await expect(service.generate('course-1', 'user-1')).rejects.toThrow(ConflictException);
    });
  });

  // ─── findByCode ─────────────────────────────────────────────────────────────

  describe('findByCode', () => {
    it('should return certificate with signed PDF URL', async () => {
      certRepo.findByCode.mockResolvedValue({
        id: 'cert-1',
        code: 'abc-def',
        course: { id: 'course-1', title: 'Test', status: 'published' },
      });

      const result = await service.findByCode('abc-def');

      expect(result.pdfUrl).toBe('https://signed-url.com/cert.pdf');
    });

    it('should throw NotFoundException when certificate not found', async () => {
      certRepo.findByCode.mockResolvedValue(null);

      await expect(service.findByCode('bad-code')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when course is unpublished', async () => {
      certRepo.findByCode.mockResolvedValue({
        id: 'cert-1',
        code: 'abc-def',
        course: { id: 'course-1', title: 'Test', status: 'draft' },
      });

      await expect(service.findByCode('abc-def')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── findAll ────────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('should return certificates with signed URLs', async () => {
      certRepo.findByUser.mockResolvedValue([
        { id: 'cert-1', code: 'aaa' },
        { id: 'cert-2', code: 'bbb' },
      ]);

      const result = await service.findAll('user-1');

      expect(result).toHaveLength(2);
      expect(result[0].pdfUrl).toBe('https://signed-url.com/cert.pdf');
    });
  });
});
