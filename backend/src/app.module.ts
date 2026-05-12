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
import { QueueNames, QueueEventBridge } from './shared/queues';
import { EmailProcessor } from './shared/queues/processors/email.processor';
import { CertificateProcessor } from './shared/queues/processors/certificate.processor';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

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
    ),

    // ─── In-Memory Cache ───────────────────────────────────────────────────
    // Global cache for hot data (public course lists, teacher profiles).
    // Can be upgraded to Redis cache by adding store config.
    CacheModule.register({
      isGlobal: true,
      ttl: 60,     // Default TTL: 60 seconds
      max: 500,    // Max items in cache
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
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
      serveStaticOptions: { index: false },
    }),
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