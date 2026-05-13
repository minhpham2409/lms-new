/**
 * JWT configuration.
 * In production: JWT_SECRET is REQUIRED — app will refuse to start without it.
 */
const secret = process.env.JWT_SECRET;

if (process.env.NODE_ENV === 'production' && !secret) {
  throw new Error(
    '[FATAL] JWT_SECRET environment variable is required in production. ' +
      'Generate one with: openssl rand -base64 32',
  );
}

export const jwtConstants = {
  secret: secret || 'dev-only-fallback-secret-DO-NOT-USE-IN-PRODUCTION',
  expiresIn: '1d',
};
