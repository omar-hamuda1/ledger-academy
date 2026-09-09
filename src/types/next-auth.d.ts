import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "STUDENT";
      superAdmin: boolean;
      restrictedScopes: string[];
    } & DefaultSession["user"];
  }

  interface User {
    role: "ADMIN" | "STUDENT";
    superAdmin?: boolean;
    restrictedScopes?: string[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "ADMIN" | "STUDENT";
    superAdmin?: boolean;
    restrictedScopes?: string[];
  }
}
