"use server";

import { hash } from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { Role, TransactionType } from "@prisma/client";

interface RegisterUserData {
  email: string;
  password: string;
  name: string;
  role: Role;
}

interface RegisterResult {
  success: boolean;
  userId?: string;
  error?: string;
}

export async function registerUser(
  data: RegisterUserData
): Promise<RegisterResult> {
  try {
    // Validate input
    if (!data.email || !data.password || !data.name || !data.role) {
      return { success: false, error: "All fields are required" };
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return { success: false, error: "User with this email already exists" };
    }

    // Validate password strength (minimum 8 characters)
    if (data.password.length < 8) {
      return {
        success: false,
        error: "Password must be at least 8 characters long",
      };
    }

    // Hash password
    const hashedPassword = await hash(data.password, 12);

    // Determine wisdom coins based on role
    let wisdomCoins: number;
    switch (data.role) {
      case "STUDENT":
        wisdomCoins = 150;
        break;
      case "TEACHER":
        wisdomCoins = 250;
        break;
      case "PARENT":
        wisdomCoins = 100;
        break;
      case "ADMIN":
        wisdomCoins = 999999; // Unlimited represented as large number
        break;
      default:
        wisdomCoins = 150;
    }

    // Create user and initial transaction in a transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          name: data.name,
          role: data.role,
          wisdomCoins,
        },
      });

      // Create initial token transaction
      await tx.tokenTransaction.create({
        data: {
          userId: newUser.id,
          amount: wisdomCoins,
          type: TransactionType.INITIAL,
          description: `Initial ${data.role.toLowerCase()} registration bonus`,
        },
      });

      return newUser;
    });

    return { success: true, userId: user.id };
  } catch (error) {
    console.error("Registration error:", error);
    return { success: false, error: "Failed to create user account" };
  }
}
