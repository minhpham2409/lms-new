import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { SepayWebhookDto } from './dto';

describe('PaymentsController', () => {
  let controller: PaymentsController;
  let paymentsService: {
    handleWebhook: jest.Mock;
    createQr: jest.Mock;
    getPaymentCodePrefix: jest.Mock;
  };
  const originalSepayApiKey = process.env.SEPAY_API_KEY;

  beforeEach(async () => {
    paymentsService = {
      createQr: jest.fn(),
      getPaymentCodePrefix: jest.fn().mockReturnValue('HP'),
      handleWebhook: jest.fn().mockResolvedValue({ message: 'ok' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [
        {
          provide: PaymentsService,
          useValue: paymentsService,
        },
      ],
    }).compile();

    controller = module.get<PaymentsController>(PaymentsController);
    process.env.SEPAY_API_KEY = 'test-sepay-key';
  });

  afterEach(() => {
    process.env.SEPAY_API_KEY = originalSepayApiKey;
  });

  it('maps a SePay incoming transfer to the internal webhook format', async () => {
    await controller.sepayWebhook(
      {
        id: 92704,
        gateway: 'Vietcombank',
        transactionDate: '2026-05-18 10:30:00',
        accountNumber: '0123499999',
        code: null as unknown as string,
        content: 'HP123456789',
        transferType: 'in',
        transferAmount: 500000,
        accumulated: 19077000,
        referenceCode: 'MBVCB.3278907687',
        description: '',
      },
      'Apikey test-sepay-key',
    );

    expect(paymentsService.handleWebhook).toHaveBeenCalledWith(
      {
        txnRef: '123456789',
        amount: 500000,
        status: 'success',
      },
      { skipSignatureVerification: true },
    );
  });

  it('rejects SePay requests with an invalid API key', async () => {
    await expect(
      controller.sepayWebhook(
        {
          transactionDate: '2026-05-18 10:30:00',
          content: 'HP123456789',
          transferType: 'in',
          transferAmount: 500000,
        },
        'Apikey wrong-key',
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('validates the current SePay payload shape including accumulated balance', async () => {
    const dto = plainToInstance(SepayWebhookDto, {
      id: '92704',
      gateway: 'Vietcombank',
      transactionDate: '2026-05-18 10:30:00',
      accountNumber: '0123499999',
      code: null,
      content: 'HP123456789',
      transferType: 'in',
      transferAmount: '500000',
      accumulated: '19077000',
      referenceCode: 'MBVCB.3278907687',
      description: '',
    });

    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    expect(errors).toHaveLength(0);
    expect(dto.transferAmount).toBe(500000);
    expect(dto.accumulated).toBe(19077000);
  });
});
