import { DefaultSession, DefaultUser } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      accessToken: string;
      role: string;
      firstName?: string;
      lastName?: string;
    } & DefaultSession["user"]
    accessToken: string;
    refreshToken: string;
  }

  interface User extends DefaultUser {
    accessToken: string;
    refreshToken: string;
    role: string;
    firstName?: string;
    lastName?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken: string;
    refreshToken: string;
    id: string;
    role: string;
    firstName?: string;
    lastName?: string;
  }
}
