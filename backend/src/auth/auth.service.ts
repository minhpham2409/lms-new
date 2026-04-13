import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { UserRepository, RefreshTokenRepository } from '../database/repositories';
import { JwtTokenService, PasswordService, TokenManagerService } from './services';
import { DateUtil } from '../shared/utils';

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
    const user = await this.userRepository.findByUsername(username);

    if (!user) {
      return null;
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const isPasswordValid = await this.passwordService.comparePassword(
      password,
      user.password,
    );

    if (isPasswordValid) {
      const { password, ...result } = user;
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

    // Save refresh token to database
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
   * Register new user
   */
  async register(userData: {
    username: string;
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }) {
    // Check if user already exists
    const existingUser = await this.userRepository.findByUsernameOrEmail(
      userData.username,
      userData.email,
    );

    if (existingUser) {
      throw new UnauthorizedException('Username or email already exists');
    }

    // Hash password
    const hashedPassword = await this.passwordService.hashPassword(
      userData.password,
    );

    // Create new user
    const newUser = await this.userRepository.createUser({
      ...userData,
      password: hashedPassword,
    });

    const { password, ...result } = newUser;
    return result;
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string) {
    // Validate refresh token
    await this.tokenManagerService.getRefreshToken(refreshToken);

    // Verify JWT token
    const payload = this.jwtTokenService.verifyToken(refreshToken);

    // Generate new access token
    const newAccessToken = this.jwtTokenService.generateAccessToken({
      sub: payload.sub,
      username: payload.username,
      email: payload.email,
      role: payload.role,
    });

    return {
      access_token: newAccessToken,
    };
  }

  /**
   * Logout user
   */
  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      await this.tokenManagerService.revokeRefreshToken(refreshToken);
    } else {
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
   * Request password reset
   */
  async forgotPassword(email: string) {
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      // Don't reveal if email exists
      return { message: 'If the email exists, a reset link has been sent' };
    }

    // Generate reset token
    const resetToken = this.jwtTokenService.generateResetToken({
      sub: user.id,
      email: user.email,
    });

    const resetTokenExpiry = DateUtil.addHours(new Date(), 1);

    await this.userRepository.setResetToken(user.id, resetToken, resetTokenExpiry);

    // TODO: Send email with reset link
    // For now, return the token (in production, send via email)
    return {
      message: 'If the email exists, a reset link has been sent',
      resetToken, // Remove this in production
    };
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string) {
    try {
      const payload = this.jwtTokenService.verifyToken(token);

      const user = await this.userRepository.findByResetToken(token);

      if (!user) {
        throw new BadRequestException('Invalid or expired reset token');
      }

      const hashedPassword = await this.passwordService.hashPassword(
        newPassword,
      );

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

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

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
    // Check if email is already taken
    if (updateData.email) {
      const existingUser = await this.userRepository.findByEmail(
        updateData.email,
      );

      if (existingUser && existingUser.id !== userId) {
        throw new BadRequestException('Email already in use');
      }
    }

    const updatedUser = await this.userRepository.update(userId, updateData);

    return await this.userRepository.getUserProfile(updatedUser.id);
  }
}
