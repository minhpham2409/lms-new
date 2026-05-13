import { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import axios from 'axios';

/**
 * NEXTAUTH_SECRET: mandatory in production.
 * Falls back to dev-only placeholder in development.
 */
const secret = process.env.NEXTAUTH_SECRET;
if (process.env.NODE_ENV === 'production' && !secret) {
  throw new Error(
    '[FATAL] NEXTAUTH_SECRET is required in production. ' +
      'Generate one with: openssl rand -base64 32',
  );
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        try {
          // Backend login accepts both `email` and `username` via the same field
          const response = await axios.post(`${API_URL}/auth/login`, {
            email: credentials.email,
            password: credentials.password,
          });

          const data = response.data;

          if (data && data.access_token) {
            return {
              id: data.user.id.toString(),
              email: data.user.email,
              name: data.user.username,
              role: data.user.role,
              accessToken: data.access_token,
              refreshToken: data.refresh_token,
              firstName: data.user.firstName,
              lastName: data.user.lastName,
            };
          }

          return null;
        } catch (error: unknown) {
          if (axios.isAxiosError(error) && error.response) {
            const message =
              error.response.data?.message || error.response.statusText;
            throw new Error(message);
          } else if (axios.isAxiosError(error) && error.request) {
            throw new Error('No response received from authentication server');
          } else {
            throw new Error(error instanceof Error ? error.message : 'Authentication failed');
          }
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.role = token.role as string;
        session.user.firstName = token.firstName as string;
        session.user.lastName = token.lastName as string;
        session.accessToken = token.accessToken as string;
        session.refreshToken = token.refreshToken as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 1 day
  },
  secret: secret || 'dev-only-fallback-DO-NOT-USE-IN-PRODUCTION',
  debug: process.env.NODE_ENV === 'development',
};
