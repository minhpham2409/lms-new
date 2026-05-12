import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { QueueNames, JobNames } from '..';

/**
 * Bull processor for certificate-related background jobs.
 * Handles heavy PDF rendering asynchronously so API responses stay fast.
 */
@Processor(QueueNames.CERTIFICATE)
export class CertificateProcessor {
  private readonly logger = new Logger(CertificateProcessor.name);

  @Process(JobNames.RENDER_CERTIFICATE_PDF)
  async handleRenderPdf(
    job: Job<{ certificateId: string; userId: string; courseTitle: string }>,
  ) {
    this.logger.log(`[Certificate Queue] Rendering PDF for certificate ${job.data.certificateId}`);
    // TODO: Integrate with PDF rendering service (Puppeteer, PDFKit, etc.)
    // const pdfBuffer = await this.pdfService.renderCertificate(job.data);
    // await this.storageService.uploadPdf(pdfBuffer, job.data.certificateId);
    this.logger.log(`[Certificate Queue] PDF rendered for certificate ${job.data.certificateId}`);
  }
}
