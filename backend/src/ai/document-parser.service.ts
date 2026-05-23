import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { PDFParse } from 'pdf-parse';
import JSZip = require('jszip');
import * as path from 'path';

type UploadedDocument = Pick<Express.Multer.File, 'buffer' | 'mimetype' | 'originalname'>;

const MAX_EXTRACTED_CHARS = 80_000;

@Injectable()
export class DocumentParserService {
  async parse(file: UploadedDocument): Promise<string> {
    const extension = path.extname(file.originalname || '').toLowerCase();
    const mime = (file.mimetype || '').toLowerCase();

    let text: string;

    if (this.isTextFile(extension, mime)) {
      text = this.parsePlainText(file.buffer);
    } else if (this.isPdf(extension, mime)) {
      text = await this.parsePdf(file.buffer);
    } else if (extension === '.docx' || mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      text = await this.parseDocx(file.buffer);
    } else if (extension === '.pptx' || mime === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
      text = await this.parsePptx(file.buffer);
    } else if (extension === '.xlsx' || mime === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      text = await this.parseXlsx(file.buffer);
    } else if (['.doc', '.ppt', '.xls'].includes(extension)) {
      throw new BadRequestException('Legacy Office files (.doc, .ppt, .xls) are not supported. Please convert to .docx, .pptx, .xlsx, .pdf, or .txt.');
    } else {
      throw new BadRequestException('Unsupported file type. Please upload PDF, DOCX, PPTX, XLSX, TXT, or CSV files.');
    }

    const normalized = this.normalizeText(text);
    if (!normalized) {
      throw new BadRequestException('Could not extract readable text from this file.');
    }

    return normalized.length > MAX_EXTRACTED_CHARS
      ? `${normalized.slice(0, MAX_EXTRACTED_CHARS)}\n\n[Content truncated to ${MAX_EXTRACTED_CHARS} characters for AI processing.]`
      : normalized;
  }

  private isTextFile(extension: string, mime: string) {
    return ['.txt', '.md', '.csv'].includes(extension) || mime.startsWith('text/') || mime === 'application/csv';
  }

  private isPdf(extension: string, mime: string) {
    return extension === '.pdf' || mime === 'application/pdf';
  }

  private parsePlainText(buffer: Buffer) {
    return buffer.toString('utf-8');
  }

  private async parsePdf(buffer: Buffer) {
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      return result.text;
    } catch (error: any) {
      throw new BadRequestException(`Could not parse PDF file: ${error.message || 'invalid PDF'}`);
    } finally {
      await parser.destroy();
    }
  }

  private async parseDocx(buffer: Buffer) {
    const zip = await this.loadZip(buffer);
    const documentParts = [
      'word/document.xml',
      ...this.sortedFileNames(zip, /^word\/(header|footer)\d+\.xml$/),
      ...this.sortedFileNames(zip, /^word\/(footnotes|endnotes)\.xml$/),
    ];

    return this.extractTextFromXmlParts(zip, documentParts);
  }

  private async parsePptx(buffer: Buffer) {
    const zip = await this.loadZip(buffer);
    const slideParts = this.sortedFileNames(zip, /^ppt\/slides\/slide\d+\.xml$/);
    return this.extractTextFromXmlParts(zip, slideParts);
  }

  private async parseXlsx(buffer: Buffer) {
    const zip = await this.loadZip(buffer);
    const parts = [
      'xl/sharedStrings.xml',
      ...this.sortedFileNames(zip, /^xl\/worksheets\/sheet\d+\.xml$/),
    ];

    return this.extractTextFromXmlParts(zip, parts);
  }

  private async loadZip(buffer: Buffer) {
    try {
      return await JSZip.loadAsync(buffer);
    } catch {
      throw new BadRequestException('Could not read Office document. The file may be corrupted or not a valid OOXML file.');
    }
  }

  private sortedFileNames(zip: JSZip, pattern: RegExp) {
    return Object.keys(zip.files)
      .filter((name) => pattern.test(name))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }

  private async extractTextFromXmlParts(zip: JSZip, partNames: string[]) {
    const chunks: string[] = [];

    for (const partName of partNames) {
      const entry = zip.file(partName);
      if (!entry) continue;

      const xml = await entry.async('text');
      const partText = this.extractXmlText(xml);
      if (partText) chunks.push(partText);
    }

    return chunks.join('\n\n');
  }

  private extractXmlText(xml: string) {
    const textNodes = xml.match(/<[^:>]*(?::)?t(?:\s[^>]*)?>[\s\S]*?<\/[^:>]*(?::)?t>/g) || [];

    if (textNodes.length === 0) {
      return this.stripXmlTags(xml);
    }

    return textNodes
      .map((node) => this.stripXmlTags(node))
      .filter(Boolean)
      .join(' ');
  }

  private stripXmlTags(xml: string) {
    return this.decodeXmlEntities(xml.replace(/<[^>]+>/g, ' '));
  }

  private decodeXmlEntities(text: string) {
    return text
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
      .replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCodePoint(parseInt(code, 16)));
  }

  private normalizeText(text: string) {
    try {
      return text
        .replace(/\u0000/g, '')
        .replace(/[ \t]+/g, ' ')
        .replace(/\s*\n\s*/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    } catch (error: any) {
      throw new InternalServerErrorException(`Could not normalize extracted text: ${error.message}`);
    }
  }
}
