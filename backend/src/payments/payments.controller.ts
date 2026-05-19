import {
  Controller,
  Post,
  Body,
  UseGuards,
  Logger,
  Headers,
  UnauthorizedException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreateQrDto, CreateRefundRequestDto, WebhookDto, SepayWebhookDto } from './dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('qr')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate VietQR for order' })
  @ApiResponse({ status: 201, description: 'QR generated' })
  createQr(@Body() dto: CreateQrDto, @GetUser() user: any) {
    return this.paymentsService.createQr(dto, user.id);
  }

  @Post('refund-requests')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create refund request for overpaid parent payment' })
  @ApiResponse({ status: 201, description: 'Refund request created' })
  createRefundRequest(@Body() dto: CreateRefundRequestDto, @GetUser() user: any) {
    return this.paymentsService.createRefundRequest(dto, user.id);
  }

  /**
   * Generic webhook endpoint — accepts the internal WebhookDto format.
   * Used for direct integration or testing via Postman / manual calls.
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @SkipThrottle()
  @ApiOperation({ summary: 'Bank webhook — confirm payment (generic format)' })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  async webhook(@Body() dto: WebhookDto) {
    const result = await this.paymentsService.handleWebhook(dto);
    return { success: true, ...result };
  }

  /**
   * SePay webhook adapter endpoint.
   *
   * SePay (https://my.sepay.vn) sends POST to this URL when it detects an
   * incoming bank transfer matching the monitored bank account.
   *
   * Payload format from SePay:
   * {
   *   "id": 123,
   *   "gateway": "MBBank",
   *   "transactionDate": "2024-12-01 10:30:00",
   *   "accountNumber": "0389999999",
   *   "content": "HP123456789",   ← contains our txnRef
   *   "transferAmount": 500000,
   *   "transferType": "in",
   *   "referenceCode": "FT24335...",
   *   "description": "..."
   * }
   *
   * The controller extracts txnRef from the `content` field (looks for "<prefix><number>")
   * and converts to our internal WebhookDto format.
   */
  @Post('webhook/sepay')
  @HttpCode(HttpStatus.OK)
  @SkipThrottle()
  @ApiOperation({ summary: 'SePay bank webhook — auto-confirm payment' })
  @ApiResponse({ status: 200, description: 'SePay webhook processed' })
  async sepayWebhook(
    @Body() dto: SepayWebhookDto,
    @Headers('Authorization') authHeader?: string,
  ) {
    // ── API Key verification ───────────────────────────────────────────
    const sepayApiKey = process.env.SEPAY_API_KEY;
    if (sepayApiKey) {
      const providedKey = authHeader?.replace('Apikey ', '').replace('Bearer ', '').trim();
      if (providedKey !== sepayApiKey) {
        this.logger.warn(`[SePay] Invalid API key received`);
        throw new UnauthorizedException('Invalid API key');
      }
    }

    // ── Only process incoming transfers ─────────────────────────────────
    if (dto.transferType !== 'in') {
      this.logger.debug(`[SePay] Ignoring outgoing transfer`);
      return { success: true, message: 'Ignored outgoing transfer' };
    }

    // ── Extract txnRef from content ────────────────────────────────────
    // Our QR addInfo format matches SePay's configured payment code pattern:
    // "<prefix><3-10 digit number>", e.g. "HP123456789".
    const paymentCodePrefix = this.paymentsService.getPaymentCodePrefix();
    const escapedPrefix = paymentCodePrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = dto.content?.match(new RegExp(`${escapedPrefix}\\s*(\\d{3,10})`, 'i'));

    if (!match || !match[1]) {
      this.logger.warn(`[SePay] Cannot extract txnRef from content: "${dto.content}"`);
      const result = await this.paymentsService.recordIgnoredWebhook(
        dto,
        'No matching txnRef found in content',
      );
      return { success: true, ...result };
    }

    const txnRef = match[1];

    this.logger.log(
      `[SePay] Incoming transfer: ${dto.transferAmount} VND, txnRef=${txnRef}, gateway=${dto.gateway}`,
    );

    // ── Convert to internal WebhookDto and process ─────────────────────
    const webhookDto: WebhookDto = {
      txnRef,
      amount: dto.transferAmount,
      status: 'success', // SePay only sends confirmed transfers
      // No HMAC signature from SePay — verified via API key above
    };

    const result = await this.paymentsService.handleWebhook(webhookDto, {
      skipSignatureVerification: true, // Already verified via SEPAY_API_KEY
    });
    return { success: true, ...result };
  }
}
