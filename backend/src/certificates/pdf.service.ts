import { Injectable } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';

@Injectable()
export class PdfService {
  async generateCertificate(
    data: { userName: string; courseTitle: string; date: string }
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ layout: 'landscape', size: 'A4' });
        const buffers: Buffer[] = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        // Draw a border
        doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).stroke();

        // Add some styling and content
        doc
          .fontSize(40)
          .fillColor('#1e3a8a')
          .text('Certificate of Completion', { align: 'center' });

        doc.moveDown(2);

        doc
          .fontSize(20)
          .fillColor('#1e40af')
          .text('This certifies that', { align: 'center' });

        doc.moveDown();

        doc
          .fontSize(30)
          .fillColor('#1e3a8a')
          .text(data.userName, { align: 'center', underline: true });

        doc.moveDown();

        doc
          .fontSize(20)
          .fillColor('#1e40af')
          .text('has successfully completed the course', { align: 'center' });

        doc.moveDown();

        doc
          .fontSize(30)
          .fillColor('#1e3a8a')
          .text(data.courseTitle, { align: 'center' });

        doc.moveDown(3);

        doc
          .fontSize(15)
          .fillColor('#2563eb')
          .text(`Date of Completion: ${data.date}`, { align: 'center' });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}
