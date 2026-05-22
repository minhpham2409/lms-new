import {
  Controller, Get, Query, Res, UseGuards, ForbiddenException,
} from '@nestjs/common';
import { Response } from 'express';
import { TaxReportsService } from './tax-reports.service';
import { TaxReportsExcelService } from './tax-reports.excel.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { GetUser } from '../common/decorators/get-user.decorator';
import { MonthlyReportDto, QuarterlyReportDto, CourseStudentsDto, ExportReportDto } from './dto';

@Controller('tax-reports')
@UseGuards(JwtAuthGuard)
export class TaxReportsController {
  constructor(
    private readonly taxReportsService: TaxReportsService,
    private readonly excelService: TaxReportsExcelService,
  ) {}

  /** GET /api/v1/tax-reports/monthly?year=2026&month=1 */
  @Get('monthly')
  @UseGuards(RolesGuard)
  @Roles('teacher', 'admin')
  async getMonthlyReport(
    @Query() query: MonthlyReportDto,
    @GetUser() user: { id: string; role: string },
  ) {
    return this.taxReportsService.getMonthlyReport(user.id, query.year, query.month);
  }

  /** GET /api/v1/tax-reports/quarterly?year=2026&quarter=1 */
  @Get('quarterly')
  @UseGuards(RolesGuard)
  @Roles('teacher', 'admin')
  async getQuarterlyReport(
    @Query() query: QuarterlyReportDto,
    @GetUser() user: { id: string; role: string },
  ) {
    return this.taxReportsService.getQuarterlyReport(user.id, query.year, query.quarter);
  }

  /** GET /api/v1/tax-reports/course-students?courseId=xxx&year=2026&month=1 */
  @Get('course-students')
  @UseGuards(RolesGuard)
  @Roles('teacher', 'admin')
  async getCourseStudents(
    @Query() query: CourseStudentsDto,
    @GetUser() user: { id: string; role: string },
  ) {
    if (!query.courseId) return { courseName: '', coursePrice: 0, students: [] };
    return this.taxReportsService.getCourseStudents(user.id, query.courseId, query.year, query.month);
  }

  /** GET /api/v1/tax-reports/export?year=2026&quarter=1 or &month=5 */
  @Get('export')
  @UseGuards(RolesGuard)
  @Roles('teacher', 'admin')
  async exportExcel(
    @Query() query: ExportReportDto,
    @GetUser() user: { id: string; role: string },
    @Res() res: Response,
  ) {
    let teacherId = user.id;
    if (query.teacherId && user.role === 'admin') {
      teacherId = query.teacherId;
    } else if (query.teacherId && user.role !== 'admin') {
      throw new ForbiddenException('Only admins can export other teacher reports');
    }

    let buffer: Buffer;
    let filename: string;

    if (query.month) {
      buffer = await this.excelService.generateMonthlyExcel(teacherId, query.year, query.month);
      filename = `bao_cao_thue_thang${query.month}_${query.year}.xlsx`;
    } else {
      const q = query.quarter || Math.ceil((new Date().getMonth() + 1) / 3);
      buffer = await this.excelService.generateQuarterlyExcel(teacherId, query.year, q);
      filename = `bao_cao_thue_quy${q}_${query.year}.xlsx`;
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }
}
