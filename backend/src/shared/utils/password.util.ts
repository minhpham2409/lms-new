import * as bcrypt from 'bcrypt';
import { AUTH_CONSTANTS } from '../constants';

export class PasswordUtil {
  /**
   * Hash password using bcrypt
   */
  static async hash(password: string): Promise<string> {
    return bcrypt.hash(password, AUTH_CONSTANTS.BCRYPT_SALT_ROUNDS);
  }

  /**
   * Compare plain password with hashed password
   */
  static async compare(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Validate password strength
   */
  static validate(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (password.length < AUTH_CONSTANTS.MIN_PASSWORD_LENGTH) {
      errors.push(
        `Password must be at least ${AUTH_CONSTANTS.MIN_PASSWORD_LENGTH} characters`,
      );
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
