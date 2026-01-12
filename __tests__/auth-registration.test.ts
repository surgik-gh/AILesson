/**
 * @jest-environment node
 */

import fc from "fast-check";
import { registerUser } from "@/app/actions/auth";
import { prisma } from "@/lib/db/prisma";
import { Role } from "@prisma/client";

// Feature: ailesson-platform, Property 1: Role-based initial wisdom coin allocation
describe("Authentication - Registration", () => {
  // Clean up test users after each test
  afterEach(async () => {
    try {
      // First, get all test user IDs
      const testUsers = await prisma.user.findMany({
        where: {
          email: {
            contains: "@test-",
          },
        },
        select: { id: true },
      });

      const userIds = testUsers.map((u) => u.id);

      if (userIds.length > 0) {
        // Delete token transactions first
        await prisma.tokenTransaction.deleteMany({
          where: {
            userId: { in: userIds },
          },
        });

        // Then delete users
        await prisma.user.deleteMany({
          where: {
            id: { in: userIds },
          },
        });
      }
    } catch (error) {
      console.error("Cleanup error:", error);
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("Property 1: new user registration allocates correct wisdom coins based on role", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          email: fc
            .emailAddress()
            .map((email) => `test-${Date.now()}-${Math.random()}@test-${email}`),
          password: fc.string({ minLength: 8, maxLength: 20 }),
          name: fc.string({ minLength: 1, maxLength: 50 }),
          role: fc.constantFrom(Role.STUDENT, Role.TEACHER, Role.ADMIN),
        }),
        async (userData) => {
          const result = await registerUser(userData);

          // Registration should succeed
          expect(result.success).toBe(true);
          expect(result.userId).toBeDefined();

          if (result.userId) {
            // Fetch the created user
            const user = await prisma.user.findUnique({
              where: { id: result.userId },
              include: {
                transactions: true,
              },
            });

            expect(user).not.toBeNull();

            if (user) {
              // Verify wisdom coins based on role
              const expectedCoins =
                userData.role === Role.STUDENT
                  ? 150
                  : userData.role === Role.TEACHER
                  ? 250
                  : 999999; // Admin unlimited

              expect(user.wisdomCoins).toBe(expectedCoins);

              // Verify initial transaction was created
              expect(user.transactions.length).toBe(1);
              expect(user.transactions[0].amount).toBe(expectedCoins);
              expect(user.transactions[0].type).toBe("INITIAL");
            }
          }
        }
      ),
      { numRuns: 10 } // Reduced for faster execution with cloud database
    );
  }, 120000); // 120 second timeout for property test
});
