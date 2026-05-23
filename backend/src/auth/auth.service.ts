import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { UserRepository, RefreshTokenRepository } from '../database/repositories';
import { JwtTokenService, PasswordService, TokenManagerService } from './services';
import { DateUtil } from '../shared/utils';
import { createHash, randomBytes } from 'crypto';

/** Roles allowed for public self-registration. */
const ALLOWED_REGISTER_ROLES = ['student', 'parent'];

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly jwtTokenService: JwtTokenService,
    private readonly passwordService: PasswordService,
    private readonly tokenManagerService: TokenManagerService,
  ) {}

  /**
   * Validate user credentials for login
   */
  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.userRepository.findByUsernameOrEmail(username, username);
    if (!user) return null;

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const isPasswordValid = await this.passwordService.comparePassword(
      password,
      user.password,
    );

    if (isPasswordValid) {
      const { password: _, ...result } = user;
      return result;
    }

    return null;
  }

  /**
   * Login user and generate tokens
   */
  async login(user: any) {
    const payload = this.jwtTokenService.createPayload(user);
    const tokens = this.jwtTokenService.generateTokenPair(payload);

    await this.tokenManagerService.saveRefreshToken(
      user.id,
      tokens.refresh_token,
    );

    return {
      ...tokens,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  /**
   * Register new user.
   * Public registration only allows 'student' or 'parent' roles.
   * Defaults to 'student' if role is invalid or not provided.
   */
  async register(userData: {
    username: string;
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    role?: string;
  }) {
    // ── Security: Block self-registration as teacher/admin ─────────────────
    const safeRole = userData.role && ALLOWED_REGISTER_ROLES.includes(userData.role)
      ? userData.role
      : 'student';

    const existingUser = await this.userRepository.findByUsernameOrEmail(
      userData.username,
      userData.email,
    );

    if (existingUser) {
      throw new ConflictException('Username or email already exists');
    }

    const hashedPassword = await this.passwordService.hashPassword(
      userData.password,
    );

    const newUser = await this.userRepository.createUser({
      ...userData,
      role: safeRole,
      password: hashedPassword,
    });

    const { password: _, ...result } = newUser;
    return result;
  }

  /**
   * Refresh access token with rotation.
   * Old refresh token is revoked, new pair is issued.
   */
  async refreshToken(refreshToken: string) {
    // 1. Validate the refresh token exists in DB
    try {
      await this.tokenManagerService.getRefreshToken(refreshToken);
    } catch (error) {
      // If a cryptographically valid refresh token is no longer in storage,
      // treat it as possible reuse after rotation and revoke the user's sessions.
      try {
        const decoded = this.jwtTokenService.verifyToken(refreshToken);
        if (decoded?.sub) {
          await this.tokenManagerService.revokeAllUserTokens(decoded.sub);
        }
      } catch {
        // Invalid/expired JWT: nothing reliable to revoke.
      }
      throw error;
    }

    // 2. Verify JWT integrity
    const payload = this.jwtTokenService.verifyToken(refreshToken);

    // 3. Revoke old refresh token (rotation)
    await this.tokenManagerService.revokeRefreshToken(refreshToken);

    // 4. Generate new token pair
    const newPayload = {
      sub: payload.sub,
      username: payload.username,
      email: payload.email,
      role: payload.role,
    };

    const newAccessToken = this.jwtTokenService.generateAccessToken(newPayload);
    const newRefreshToken = this.jwtTokenService.generateRefreshToken
      ? this.jwtTokenService.generateRefreshToken(newPayload)
      : this.jwtTokenService.generateTokenPair(newPayload).refresh_token;

    // 5. Save new refresh token
    await this.tokenManagerService.saveRefreshToken(
      payload.sub,
      newRefreshToken,
    );

    return {
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
    };
  }

  /**
   * Logout user
   */
  async logout(userId?: string, refreshToken?: string) {
    if (refreshToken) {
      await this.tokenManagerService.revokeRefreshToken(refreshToken);
    } else if (userId) {
      await this.tokenManagerService.revokeAllUserTokens(userId);
    }

    return { message: 'Logged out successfully' };
  }

  /**
   * Change user password
   */
  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
  ) {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isPasswordValid = await this.passwordService.comparePassword(
      oldPassword,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const hashedPassword = await this.passwordService.hashPassword(newPassword);

    await this.userRepository.updatePassword(userId, hashedPassword);

    // Invalidate all refresh tokens
    await this.tokenManagerService.revokeAllUserTokens(userId);

    return { message: 'Password changed successfully' };
  }

  /**
   * Request password reset.
   * NEVER returns the reset token in the response.
   * In production, the token should be sent via email.
   */
  async forgotPassword(email: string) {
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      // Don't reveal if email exists — constant response
      return { message: 'If the email exists, a reset link has been sent' };
    }

    // Generate a random reset token and hash it before storing
    const rawToken = randomBytes(32).toString('hex');
    const hashedToken = createHash('sha256').update(rawToken).digest('hex');

    const resetTokenExpiry = DateUtil.addHours(new Date(), 1);

    await this.userRepository.setResetToken(user.id, hashedToken, resetTokenExpiry);

    // TODO: Send email with reset link containing rawToken
    // e.g. `${FRONTEND_URL}/auth/reset-password?token=${rawToken}`
    // In dev mode, log it for debugging:
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEV] Reset token for ${email}: ${rawToken}`);
    }

    return {
      message: 'If the email exists, a reset link has been sent',
      // Token is NOT returned in the response
    };
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string) {
    try {
      // Hash the incoming raw token to compare with stored hash
      const hashedToken = createHash('sha256').update(token).digest('hex');

      const user = await this.userRepository.findByResetToken(hashedToken);

      if (!user) {
        throw new BadRequestException('Invalid or expired reset token');
      }

      const hashedPassword = await this.passwordService.hashPassword(newPassword);

      await this.userRepository.updatePassword(user.id, hashedPassword);
      await this.userRepository.clearResetToken(user.id);

      // Invalidate all refresh tokens
      await this.tokenManagerService.revokeAllUserTokens(user.id);

      return { message: 'Password reset successfully' };
    } catch (error) {
      throw new BadRequestException('Invalid or expired reset token');
    }
  }

  /**
   * Get user profile
   */
  async getProfile(userId: string) {
    const user = await this.userRepository.getUserProfile(userId);
    if (!user) throw new UnauthorizedException('User not found');
    return user;
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    updateData: {
      firstName?: string;
      lastName?: string;
      email?: string;
    },
  ) {
    if (updateData.email) {
      const existingUser = await this.userRepository.findByEmail(updateData.email);
      if (existingUser && existingUser.id !== userId) {
        throw new BadRequestException('Email already in use');
      }
    }

    const updatedUser = await this.userRepository.update(userId, updateData);
    return await this.userRepository.getUserProfile(updatedUser.id);
  }

  /**
   * Get active sessions (refresh tokens) for a user
   */
  async getSessions(userId: string) {
    const tokens = await this.refreshTokenRepository.findByUserId(userId);
    return tokens.map(t => ({
      id: t.id,
      createdAt: t.createdAt,
      expiresAt: t.expiresAt,
    }));
  }

  /**
   * Revoke a specific session
   */
  async revokeSession(userId: string, sessionId: string) {
    const token = await this.refreshTokenRepository.findById(sessionId);
    if (!token || token.userId !== userId) {
      throw new BadRequestException('Session not found');
    }
    await this.refreshTokenRepository.deleteById(sessionId);
    return { message: 'Session revoked successfully' };
  }
}
