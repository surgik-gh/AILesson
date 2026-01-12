/**
 * @jest-environment node
 */

// CRITICAL: Set DATABASE_URL before ANY imports
// This must be the very first thing that happens
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "postgresql://neondb_owner:npg_DRn9hraXufc3@ep-super-river-ahyyeoly-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require";
}

import fc from "fast-check";
import { registerUser } from "@/app/actions/auth";
import { prisma } from "@/lib/db/prisma";
import { Role } from "@prisma/client";
import { compare } from "bcryptjs";

// Feature: ailesson-platform, Property 2: Authentication grants role-appropriate access
describe("Authentication - Login", () => {
  // Clean up test users after each test
  afterEach(async () => {
    await prisma.tokenTransaction.deleteMany({
      where: {
        user: {
          email: {
            contains: "@test-auth-",
          },
        },
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: "@test-auth-",
        },
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("Property 2: authentication grants role-appropriate access", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          email: fc
            .emailAddress()
            .map(
              (email) =>
                `test-auth-${Date.now()}-${Math.random()}@test-auth-${email}`
            ),
          password: fc.string({ minLength: 8, maxLength: 20 }),
          name: fc.string({ minLength: 1, maxLength: 50 }),
          role: fc.constantFrom(Role.STUDENT, Role.TEACHER, Role.ADMIN),
        }),
        async (userData) => {
          // First, register the user
          const registerResult = await registerUser(userData);
          expect(registerResult.success).toBe(true);

          if (registerResult.userId) {
            // Fetch the user to verify authentication
            const user = await prisma.user.findUnique({
              where: { id: registerResult.userId },
            });

            expect(user).not.toBeNull();

            if (user) {
              // Verify password is hashed correctly
              const isPasswordValid = await compare(
                userData.password,
                user.password
              );
              expect(isPasswordValid).toBe(true);

              // Verify user has correct role
              expect(user.role).toBe(userData.role);

              // Verify role-specific properties
              switch (userData.role) {
                case Role.STUDENT:
                  expect(user.wisdomCoins).toBe(150);
                  break;
                case Role.TEACHER:
                  expect(user.wisdomCoins).toBe(250);
                  break;
                case Role.ADMIN:
                  expect(user.wisdomCoins).toBe(999999);
                  break;
              }
            }
          }
        }
      ),
      { numRuns: 10 } // Reduced for faster execution with cloud database
    );
  }, 120000); // 120 second timeout for property test
});
