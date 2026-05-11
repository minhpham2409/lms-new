import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
  providers: [AppService],
})
export class AppModule {}