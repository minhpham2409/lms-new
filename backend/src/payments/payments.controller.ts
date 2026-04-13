import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreateQrDto, WebhookDto } from './dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('qr')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate VietQR for order' })
  @ApiResponse({ status: 201, description: 'QR generated' })
  createQr(@Body() dto: CreateQrDto, @GetUser() user: any) {
    return this.paymentsService.createQr(dto, user.id);
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Bank webhook — confirm payment' })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  webhook(@Body() dto: WebhookDto) {
    return this.paymentsService.handleWebhook(dto);
  }
}
