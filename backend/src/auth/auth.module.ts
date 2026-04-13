import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constants';
import { PrismaModule } from '../prisma/prisma.module';
import { UserRepository, RefreshTokenRepository } from '../database/repositories';
import { JwtTokenService, PasswordService, TokenManagerService } from './services';

@Module({
  imports: [
    UsersModule,
    PrismaModule,
    PassportModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: jwtConstants.expiresIn },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    UserRepository,
    RefreshTokenRepository,
    JwtTokenService,
    PasswordService,
    TokenManagerService,
  ],
  exports: [AuthService, JwtTokenService, PasswordService],
})
export class AuthModule {}
