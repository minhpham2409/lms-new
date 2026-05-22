import { Module } from '@nestjs/common';
import { TaxReportsController } from './tax-reports.controller';
import { TaxReportsService } from './tax-reports.service';
import { TaxReportsExcelService } from './tax-reports.excel.service';

@Module({
  controllers: [TaxReportsController],
  providers: [TaxReportsService, TaxReportsExcelService],
})
export class TaxReportsModule {}
