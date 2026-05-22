import { Injectable, Logger } from '@nestjs/common';
import { Workbook } from 'exceljs';
import { TaxReportsService } from './tax-reports.service';

@Injectable()
export class TaxReportsExcelService {
  private readonly logger = new Logger(TaxReportsExcelService.name);
  constructor(private readonly taxReportsService: TaxReportsService) {}

  async generateQuarterlyExcel(teacherId: string, year: number, quarter: number): Promise<Buffer> {
    const report = await this.taxReportsService.getQuarterlyReport(teacherId, year, quarter);
    const workbook = new Workbook();
    workbook.creator = 'LMS Platform';
    workbook.created = new Date();
    const ws = workbook.addWorksheet('Báo cáo thuế');
    const months = report.period.months as number[];
    const colCount = 4 + months.length * 2;
    ws.mergeCells('A1', this.colLetter(colCount) + '1');
    const tc = ws.getCell('A1');
    tc.value = `BÁO CÁO DOANH THU QUÝ ${quarter} NĂM ${year} — ${(report.teacher.fullName || '').toUpperCase()}`;
    tc.font = { bold: true, size: 13 };
    tc.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(1).height = 32;
    const headers = ['STT', 'Khóa học', 'Đơn giá',
      ...months.flatMap(m => [`Số HS T${m}`, `Doanh thu T${m}`]),
      'Tổng HS', 'Tổng doanh thu'];
    const hr = ws.addRow(headers);
    hr.font = { bold: true, size: 10 };
    hr.alignment = { horizontal: 'center', wrapText: true };
    hr.eachCell(c => { c.border = this.borders(); c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E2F3' } }; });
    ws.getColumn(1).width = 5; ws.getColumn(2).width = 30; ws.getColumn(3).width = 14;
    for (let i = 0; i < months.length; i++) { ws.getColumn(4+i*2).width = 10; ws.getColumn(5+i*2).width = 16; }
    ws.getColumn(4+months.length*2).width = 10; ws.getColumn(5+months.length*2).width = 18;
    report.courses.forEach((c: any, i: number) => {
      const r = ws.addRow([i+1, c.courseName, c.coursePrice,
        ...months.flatMap((m: number) => [c.monthlyStudents[String(m)]??0, c.monthlyRevenue[String(m)]??0]),
        c.totalStudents, c.total]);
      r.eachCell((cell, col) => { cell.border = this.borders(); if(col>=3){cell.numFmt='#,##0';cell.alignment={horizontal:'right'};} });
    });
    const tr = ws.addRow(['', 'TỔNG CỘNG', '',
      ...months.flatMap((m: number) => [report.monthlyStudentTotals[String(m)]??0, report.monthlyTotals[String(m)]??0]),
      report.grandTotalStudents, report.grandTotal]);
    tr.font = { bold: true };
    tr.eachCell((cell, col) => { cell.border = this.borders(); cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFFFF2CC'}}; if(col>=3){cell.numFmt='#,##0';cell.alignment={horizontal:'right'};} });
    // Student sheets
    for (const course of report.courses) {
      for (const month of months) {
        if ((course.monthlyRevenue[String(month)]??0) <= 0) continue;
        const sd = await this.taxReportsService.getCourseStudents(teacherId, course.courseId, year, month);
        if (sd.students.length > 0) this.addStudentSheet(workbook, this.sanitize(`${course.courseName} T${month}`), sd, month, year);
      }
    }
    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  async generateMonthlyExcel(teacherId: string, year: number, month: number): Promise<Buffer> {
    const report = await this.taxReportsService.getMonthlyReport(teacherId, year, month);
    const workbook = new Workbook();
    workbook.creator = 'LMS Platform';
    const ws = workbook.addWorksheet('Báo cáo tháng');
    ws.mergeCells('A1', 'E1');
    const tc = ws.getCell('A1');
    tc.value = `BÁO CÁO DOANH THU THÁNG ${month}/${year} — ${(report.teacher.fullName||'').toUpperCase()}`;
    tc.font = { bold: true, size: 13 }; tc.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(1).height = 32;
    const hr = ws.addRow(['STT', 'Khóa học', 'Đơn giá', 'Số học sinh', 'Doanh thu']);
    hr.font = { bold: true }; hr.alignment = { horizontal: 'center' };
    hr.eachCell(c => { c.border = this.borders(); c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFD9E2F3'}}; });
    ws.getColumn(1).width = 5; ws.getColumn(2).width = 35; ws.getColumn(3).width = 16; ws.getColumn(4).width = 14; ws.getColumn(5).width = 20;
    report.courses.forEach((c: any, i: number) => {
      const r = ws.addRow([i+1, c.courseName, c.coursePrice, c.studentCount, c.revenue]);
      r.eachCell((cell, col) => { cell.border = this.borders(); if(col>=3){cell.numFmt='#,##0';cell.alignment={horizontal:'right'};} });
    });
    const tr = ws.addRow(['', 'TỔNG CỘNG', '', report.totalStudents, report.totalRevenue]);
    tr.font = { bold: true };
    tr.eachCell((cell, col) => { cell.border = this.borders(); cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFFFF2CC'}}; if(col>=3){cell.numFmt='#,##0';cell.alignment={horizontal:'right'};} });
    for (const course of report.courses) {
      if (course.revenue <= 0) continue;
      const sd = await this.taxReportsService.getCourseStudents(teacherId, course.courseId, year, month);
      if (sd.students.length > 0) this.addStudentSheet(workbook, this.sanitize(course.courseName), sd, month, year);
    }
    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  private addStudentSheet(wb: Workbook, name: string, data: any, month: number, year: number) {
    const ws = wb.addWorksheet(name);
    ws.mergeCells('A1', 'E1');
    const tc = ws.getCell('A1');
    tc.value = `DANH SÁCH HỌC SINH — ${(data.courseName||'').toUpperCase()} (T${month}/${year})`;
    tc.font = { bold: true, size: 12 }; tc.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(1).height = 28;
    const hr = ws.addRow(['STT', 'Họ và tên', 'Email', 'Ngày mua', 'Số tiền']);
    hr.font = { bold: true }; hr.alignment = { horizontal: 'center' };
    hr.eachCell(c => { c.border = this.borders(); c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFD9E2F3'}}; });
    ws.getColumn(1).width = 5; ws.getColumn(2).width = 28; ws.getColumn(3).width = 28; ws.getColumn(4).width = 16; ws.getColumn(5).width = 18;
    data.students.forEach((s: any) => {
      const r = ws.addRow([s.stt, s.fullName, s.email, new Date(s.purchaseDate).toLocaleDateString('vi-VN'), s.amountPaid]);
      r.eachCell((cell, col) => { cell.border = this.borders(); if(col===5){cell.numFmt='#,##0';cell.alignment={horizontal:'right'};} });
    });
    const total = data.students.reduce((sum: number, s: any) => sum + s.amountPaid, 0);
    const tr = ws.addRow(['', `Tổng: ${data.students.length} HS`, '', '', total]);
    tr.font = { bold: true };
    tr.eachCell((cell, col) => { cell.border = this.borders(); cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFFFF2CC'}}; if(col===5){cell.numFmt='#,##0';cell.alignment={horizontal:'right'};} });
  }

  private borders(): any {
    const t = { style: 'thin' as const, color: { argb: 'FF000000' } };
    return { top: t, left: t, bottom: t, right: t };
  }
  private colLetter(n: number): string { let r=''; while(n>0){n--;r=String.fromCharCode(65+(n%26))+r;n=Math.floor(n/26);} return r; }
  private sanitize(name: string): string { return name.replace(/[\\/*?[\]]/g, '').substring(0, 31); }
}
