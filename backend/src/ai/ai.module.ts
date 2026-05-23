import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { ConfigModule } from '@nestjs/config';
import { DocumentParserService } from './document-parser.service';

@Module({
  imports: [ConfigModule],
  controllers: [AiController],
  providers: [AiService, DocumentParserService],
  exports: [AiService],
})
export class AiModule {}
