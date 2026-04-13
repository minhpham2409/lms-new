import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CertificatesService } from './certificates.service';
import { CreateCertificateDto } from './dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { GetUser } from '../common/decorators/get-user.decorator';

@ApiTags('Certificates')
@Controller('certificates')
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('student')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my certificates' })
  @ApiResponse({ status: 200, description: 'Certificates retrieved' })
  findAll(@GetUser() user: any) {
    return this.certificatesService.findAll(user.id);
  }

  @Post('generate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('student')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate certificate (100% completion required)' })
  @ApiResponse({ status: 201, description: 'Certificate generated' })
  generate(@Body() dto: CreateCertificateDto, @GetUser() user: any) {
    return this.certificatesService.generate(dto.courseId, user.id);
  }

  @Get(':code')
  @ApiOperation({ summary: 'Verify certificate by code (public)' })
  @ApiResponse({ status: 200, description: 'Certificate verified' })
  findByCode(@Param('code') code: string) {
    return this.certificatesService.findByCode(code);
  }
}
