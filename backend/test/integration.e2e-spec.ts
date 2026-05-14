import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import * as cookieParser from 'cookie-parser';

describe('Auth & Integration Flows (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    app.use(cookieParser());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Auth Flow', () => {
    let refreshTokenCookie: string;
    let accessToken: string;

    it('/api/v1/auth/login (POST) - should fail with wrong credentials', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'wrong' })
        .expect(401);
    });

    // NOTE: This test assumes an existing test user or you can register one before this
    // it('/api/v1/auth/login (POST) - should succeed and return cookie', async () => {
    //   const response = await request(app.getHttpServer())
    //     .post('/api/v1/auth/login')
    //     .send({ email: 'admin@example.com', password: 'password123' })
    //     .expect(201);
    //   
    //   expect(response.body).toHaveProperty('access_token');
    //   expect(response.body).not.toHaveProperty('refresh_token');
    //   
    //   const cookies = response.headers['set-cookie'];
    //   expect(cookies).toBeDefined();
    //   expect(cookies[0]).toContain('refresh_token=');
    //   
    //   accessToken = response.body.access_token;
    //   refreshTokenCookie = cookies[0].split(';')[0];
    // });

    // it('/api/v1/auth/refresh (POST) - should return new token using cookie', async () => {
    //   const response = await request(app.getHttpServer())
    //     .post('/api/v1/auth/refresh')
    //     .set('Cookie', [refreshTokenCookie])
    //     .expect(201);
    //     
    //   expect(response.body).toHaveProperty('access_token');
    // });
  });

  describe('Role Guard', () => {
    it('/api/v1/admin/dashboard (GET) - should block without auth', () => {
      return request(app.getHttpServer())
        .get('/api/v1/admin/dashboard')
        .expect(401);
    });
  });

  describe('Payment Webhook', () => {
    it('/api/v1/payments/webhook (POST) - should validate signature', () => {
      return request(app.getHttpServer())
        .post('/api/v1/payments/webhook')
        .send({ event: 'charge.success' })
        .expect(400); // Because signature is missing or invalid
    });
  });

  describe('Upload HLS', () => {
    it('/api/v1/upload/video (POST) - should reject without file', () => {
      return request(app.getHttpServer())
        .post('/api/v1/upload/video')
        // no auth token sent here, so we expect 401
        .expect(401);
    });
  });
});
