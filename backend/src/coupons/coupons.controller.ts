import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CouponsService } from './coupons.service';
import { CreateCouponDto } from './dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Coupons')
@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create coupon (admin)' })
  @ApiResponse({ status: 201, description: 'Coupon created' })
  create(@Body() dto: CreateCouponDto) {
    return this.couponsService.create(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all coupons (admin)' })
  @ApiResponse({ status: 200, description: 'Coupons retrieved' })
  findAll() {
    return this.couponsService.findAll();
  }

  @Get(':code')
  @ApiOperation({ summary: 'Check coupon validity (public)' })
  @ApiResponse({ status: 200, description: 'Coupon is valid' })
  findByCode(@Param('code') code: string) {
    return this.couponsService.findByCode(code);
  }
}
