import { Injectable } from '@nestjs/common';
import { PasswordUtil } from '../../shared/utils';

@Injectable()
export class PasswordService {
  /**
   * Hash password
   */
  async hashPassword(password: string): Promise<string> {
    return PasswordUtil.hash(password);
  }

  /**
   * Compare password
   */
  async comparePassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return PasswordUtil.compare(plainPassword, hashedPassword);
  }

  /**
   * Validate password strength
   */
  validatePassword(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    return PasswordUtil.validate(password);
  }
}
