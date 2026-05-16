import { Module, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { BullModule } from '@nestjs/bull';
import { CacheModule } from '@nestjs/cache-manager';
import { APP_GUARD } from '@nestjs/core';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { CoursesModule } from './courses/courses.module';
import { AuthModule } from './auth/auth.module';
import { LessonsModule } from './lessons/lessons.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { ProgressModule } from './progress/progress.module';
import { AdminModule } from './admin/admin.module';
import { PrismaModule } from './prisma/prisma.module';
import { SectionsModule } from './sections/sections.module';
import { MaterialsModule } from './materials/materials.module';
import { AssignmentsModule } from './assignments/assignments.module';
import { QuizzesModule } from './quizzes/quizzes.module';
import { CartModule } from './cart/cart.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { CouponsModule } from './coupons/coupons.module';
import { ReviewsModule } from './reviews/reviews.module';
import { CommentsModule } from './comments/comments.module';
import { NotificationsModule } from './notifications/notifications.module';
import { CertificatesModule } from './certificates/certificates.module';
import { ParentsModule } from './parents/parents.module';
import { UploadModule } from './upload/upload.module';
import { AchievementsModule } from './achievements/achievements.module';
import { MonthlyRaceModule } from './monthly-race/monthly-race.module';
import { StorageModule } from './storage/storage.module';
import { QueueNames, QueueEventBridge } from './shared/queues';
import { EmailProcessor } from './shared/queues/processors/email.processor';
import { CertificateProcessor } from './shared/queues/processors/certificate.processor';
import { MediaModule } from './media/media.module';
import { WalletsModule } from './wallets/wallets.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),

    // ─── Event-Driven Architecture ─────────────────────────────────────────
    // In-process events for lightweight cross-module communication.
    // Replaces direct service injection to eliminate circular dependencies.
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: '.',
      maxListeners: 20,
      verboseMemoryLeak: true,
    }),

    // ─── Background Job Queues (Bull + Redis) ──────────────────────────────
    // Heavy async tasks (emails, PDFs) go through Redis queues.
    // Falls back gracefully if Redis is not available (queues won't process).
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        redis: {
          host: config.get('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
          password: config.get('REDIS_PASSWORD', undefined),
          maxRetriesPerRequest: 3,
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      { name: QueueNames.EMAIL },
      { name: QueueNames.CERTIFICATE },
      { name: QueueNames.NOTIFICATION },
      { name: QueueNames.VIDEO },
      { name: QueueNames.WALLET },
    ),

    // ─── Redis Cache ────────────────────────────────────────────────────────
    // Global cache backed by Redis for hot data (public course lists, etc.).
    // Falls back to in-memory if Redis is not available.
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => {
        const redisHost = config.get('REDIS_HOST', 'localhost');
        const redisPort = config.get<number>('REDIS_PORT', 6379);
        const redisPassword = config.get('REDIS_PASSWORD', undefined);
        try {
          const { redisStore } = await import('cache-manager-redis-yet');
          return {
            store: redisStore,
            socket: { host: redisHost, port: redisPort },
            password: redisPassword,
            ttl: 60_000, // 60s in ms
          };
        } catch {
          // Fallback to in-memory if redis module unavailable
          return { ttl: 60, max: 500 };
        }
      },
      inject: [ConfigService],
    }),

    // ─── Security: Rate Limiting ───────────────────────────────────────────
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 5,
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 30,
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 100,
      },
    ]),

    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads', 'images'),
      serveRoot: '/uploads/images',
      serveStaticOptions: { index: false },
    }),
    StorageModule,
    PrismaModule,
    UsersModule,
    CoursesModule,
    AuthModule,
    SectionsModule,
    LessonsModule,
    MaterialsModule,
    EnrollmentsModule,
    ProgressModule,
    AdminModule,
    AssignmentsModule,
    QuizzesModule,
    CartModule,
    OrdersModule,
    PaymentsModule,
    CouponsModule,
    ReviewsModule,
    CommentsModule,
    NotificationsModule,
    CertificatesModule,
    ParentsModule,
    UploadModule,
    AchievementsModule,
    MonthlyRaceModule,
    MediaModule,
    WalletsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // ─── Bull Queue Processors ─────────────────────────────────────────────
    // Registered globally so they process jobs from any module.
    EmailProcessor,
    CertificateProcessor,
    // ─── Event → Queue Bridge ──────────────────────────────────────────────
    // Listens to domain events and dispatches heavy jobs into Bull queues.
    QueueEventBridge,
  ],
})
export class AppModule {}
