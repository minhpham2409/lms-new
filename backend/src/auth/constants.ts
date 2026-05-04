export const jwtConstants = {
  secret: process.env.JWT_SECRET || 'STRONGER_SECRET_KEY_HERE_CHANGE_IN_PRODUCTION',
  expiresIn: '1d',
};
