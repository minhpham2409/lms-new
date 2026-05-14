import { BadRequestException } from '@nestjs/common';
import { UploadService } from './upload.service';

describe('UploadService', () => {
  let service: UploadService;

  beforeEach(() => {
    service = new UploadService();
  });

  // ── MIME validation tests ────────────────────────────────────────────

  describe('validateFile - MIME check', () => {
    it('should accept a valid image MIME type', () => {
      const file = createMockFile('test.png', 'image/png', 1024, pngBuffer());
      expect(() => service.validateFile(file, 'images')).not.toThrow();
    });

    it('should reject an invalid MIME type for images', () => {
      const file = createMockFile('malware.exe', 'application/x-executable', 1024, Buffer.alloc(100));
      expect(() => service.validateFile(file, 'images')).toThrow(BadRequestException);
    });

    it('should accept a valid video MIME type', () => {
      const file = createMockFile('vid.mp4', 'video/mp4', 1024, mp4Buffer());
      expect(() => service.validateFile(file, 'videos')).not.toThrow();
    });

    it('should reject a video MIME when uploading as image', () => {
      const file = createMockFile('vid.mp4', 'video/mp4', 1024, mp4Buffer());
      expect(() => service.validateFile(file, 'images')).toThrow(BadRequestException);
    });

    it('should accept a valid document MIME type', () => {
      const file = createMockFile('doc.pdf', 'application/pdf', 1024, pdfBuffer());
      expect(() => service.validateFile(file, 'files')).not.toThrow();
    });

    it('should accept text/plain for files', () => {
      const file = createMockFile('readme.txt', 'text/plain', 100, Buffer.from('Hello World'));
      expect(() => service.validateFile(file, 'files')).not.toThrow();
    });
  });

  // ── Size validation tests ────────────────────────────────────────────

  describe('validateFile - size check', () => {
    it('should reject an image exceeding 10MB', () => {
      const file = createMockFile('huge.png', 'image/png', 11 * 1024 * 1024, pngBuffer());
      expect(() => service.validateFile(file, 'images')).toThrow(BadRequestException);
      expect(() => service.validateFile(file, 'images')).toThrow(/exceeds limit/);
    });

    it('should reject a video exceeding 500MB', () => {
      const file = createMockFile('huge.mp4', 'video/mp4', 501 * 1024 * 1024, mp4Buffer());
      expect(() => service.validateFile(file, 'videos')).toThrow(BadRequestException);
    });

    it('should accept a file just under the limit', () => {
      const file = createMockFile('ok.pdf', 'application/pdf', 49 * 1024 * 1024, pdfBuffer());
      expect(() => service.validateFile(file, 'files')).not.toThrow();
    });
  });

  // ── Magic byte validation tests ──────────────────────────────────────

  describe('validateFile - magic bytes', () => {
    it('should accept a file with correct PNG magic bytes', () => {
      const file = createMockFile('real.png', 'image/png', 1024, pngBuffer());
      expect(() => service.validateFile(file, 'images')).not.toThrow();
    });

    it('should reject a file claiming to be PNG but with JPEG bytes', () => {
      const file = createMockFile('fake.png', 'image/png', 1024, jpegBuffer());
      expect(() => service.validateFile(file, 'images')).toThrow(BadRequestException);
      expect(() => service.validateFile(file, 'images')).toThrow(/does not match/);
    });

    it('should accept a file with correct JPEG magic bytes', () => {
      const file = createMockFile('photo.jpg', 'image/jpeg', 1024, jpegBuffer());
      expect(() => service.validateFile(file, 'images')).not.toThrow();
    });

    it('should reject a file claiming to be JPEG but with random bytes', () => {
      const file = createMockFile('fake.jpg', 'image/jpeg', 1024, Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B]));
      expect(() => service.validateFile(file, 'images')).toThrow(BadRequestException);
    });

    it('should accept a PDF with correct magic bytes', () => {
      const file = createMockFile('doc.pdf', 'application/pdf', 2048, pdfBuffer());
      expect(() => service.validateFile(file, 'files')).not.toThrow();
    });

    it('should reject a file claiming to be PDF but with PNG bytes', () => {
      const file = createMockFile('fake.pdf', 'application/pdf', 2048, pngBuffer());
      expect(() => service.validateFile(file, 'files')).toThrow(BadRequestException);
    });

    it('should accept a DOCX (ZIP-based) with PK signature', () => {
      const file = createMockFile('doc.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 2048, zipBuffer());
      expect(() => service.validateFile(file, 'files')).not.toThrow();
    });

    it('should reject a fake DOCX without PK signature', () => {
      const file = createMockFile('fake.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 2048, Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B]));
      expect(() => service.validateFile(file, 'files')).toThrow(BadRequestException);
    });

    it('should accept an MP4 with ftyp signature at offset 4', () => {
      const file = createMockFile('video.mp4', 'video/mp4', 1024, mp4Buffer());
      expect(() => service.validateFile(file, 'videos')).not.toThrow();
    });

    it('should reject a file claiming to be MP4 but with random bytes', () => {
      const file = createMockFile('fake.mp4', 'video/mp4', 1024, Buffer.alloc(100, 0x42));
      expect(() => service.validateFile(file, 'videos')).toThrow(BadRequestException);
    });

    it('should skip magic byte check for text/plain', () => {
      const file = createMockFile('readme.txt', 'text/plain', 100, Buffer.from('Just a text file'));
      expect(() => service.validateFile(file, 'files')).not.toThrow();
    });

    it('should skip magic byte check for SVG', () => {
      const file = createMockFile('icon.svg', 'image/svg+xml', 200, Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>'));
      expect(() => service.validateFile(file, 'images')).not.toThrow();
    });

    it('should reject a file that is too small to verify', () => {
      const file = createMockFile('tiny.png', 'image/png', 5, Buffer.from([0x89, 0x50]));
      expect(() => service.validateFile(file, 'images')).toThrow(BadRequestException);
      expect(() => service.validateFile(file, 'images')).toThrow(/too small/);
    });
  });

  // ── Utility tests ────────────────────────────────────────────────────

  describe('generateFilename', () => {
    it('should generate a UUID-based filename preserving extension', () => {
      const name = service.generateFilename('photo.JPG');
      expect(name).toMatch(/^[a-f0-9-]+\.jpg$/);
    });

    it('should handle files with no extension', () => {
      const name = service.generateFilename('README');
      expect(name).toMatch(/^[a-f0-9-]+$/);
    });
  });

  describe('getFileUrl', () => {
    it('should return correct URL path', () => {
      expect(service.getFileUrl('abc.mp4', 'videos')).toBe('/uploads/videos/abc.mp4');
      expect(service.getFileUrl('img.png', 'images')).toBe('/uploads/images/img.png');
    });
  });
});

// ── Helper functions ──────────────────────────────────────────────────

function createMockFile(
  originalname: string,
  mimetype: string,
  size: number,
  buffer: Buffer,
): Express.Multer.File {
  return {
    fieldname: 'file',
    originalname,
    encoding: '7bit',
    mimetype,
    size,
    buffer,
    destination: '',
    filename: '',
    path: '',
    stream: null as any,
  };
}

/** PNG header: 89 50 4E 47 0D 0A 1A 0A */
function pngBuffer(): Buffer {
  const buf = Buffer.alloc(100);
  [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A].forEach((b, i) => buf[i] = b);
  return buf;
}

/** JPEG header: FF D8 FF */
function jpegBuffer(): Buffer {
  const buf = Buffer.alloc(100);
  [0xFF, 0xD8, 0xFF, 0xE0].forEach((b, i) => buf[i] = b);
  return buf;
}

/** PDF header: %PDF-1.5 */
function pdfBuffer(): Buffer {
  const buf = Buffer.alloc(100);
  [0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x35].forEach((b, i) => buf[i] = b);
  return buf;
}

/** ZIP/OOXML header: PK\003\004 */
function zipBuffer(): Buffer {
  const buf = Buffer.alloc(100);
  [0x50, 0x4B, 0x03, 0x04].forEach((b, i) => buf[i] = b);
  return buf;
}

/** MP4 header: ....ftyp at offset 4 */
function mp4Buffer(): Buffer {
  const buf = Buffer.alloc(100);
  // First 4 bytes = box size, next 4 = 'ftyp'
  [0x00, 0x00, 0x00, 0x1C, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6F, 0x6D].forEach((b, i) => buf[i] = b);
  return buf;
}
