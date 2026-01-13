import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "STUDENT" | "TEACHER" | "PARENT" | "ADMIN";
      wisdomCoins: number;
      selectedExpertId?: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: "STUDENT" | "TEACHER" | "PARENT" | "ADMIN";
    wisdomCoins: number;
    selectedExpertId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "STUDENT" | "TEACHER" | "PARENT" | "ADMIN";
    wisdomCoins: number;
    selectedExpertId?: string;
  }
}
