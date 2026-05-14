import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { QueueNames, JobNames } from '..';
import { PdfService } from '../../../certificates/pdf.service';
import { StorageService } from '../../../storage/storage.service';

/**
 * Bull processor for certificate-related background jobs.
 * Handles heavy PDF rendering asynchronously so API responses stay fast.
 */
@Processor(QueueNames.CERTIFICATE)
export class CertificateProcessor {
  private readonly logger = new Logger(CertificateProcessor.name);

  constructor(
    private readonly pdfService: PdfService,
    private readonly storageService: StorageService,
  ) {}

  @Process(JobNames.RENDER_CERTIFICATE_PDF)
  async handleRenderPdf(
    job: Job<{ certificateId: string; userId: string; courseTitle: string; userName: string }>,
  ) {
    this.logger.log(`[Certificate Queue] Rendering PDF for certificate ${job.data.certificateId}`);
    
    try {
      const pdfBuffer = await this.pdfService.generateCertificate({
        userName: job.data.userName || 'Student',
        courseTitle: job.data.courseTitle,
        date: new Date().toLocaleDateString(),
      });

      const key = `certificates/${job.data.certificateId}.pdf`;
      await this.storageService.putObject({
        key,
        body: pdfBuffer,
        contentType: 'application/pdf',
      });

      this.logger.log(`[Certificate Queue] PDF rendered and uploaded for certificate ${job.data.certificateId}`);
    } catch (error) {
      this.logger.error(`[Certificate Queue] Failed to render PDF: ${(error as Error).message}`);
    }
  }
}
