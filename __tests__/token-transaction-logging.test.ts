/**
 * @jest-environment node
 */

import fc from "fast-check";
import { prisma } from "@/lib/db/prisma";
import { Role, TransactionType } from "@prisma/client";
import bcrypt from "bcryptjs";

// Feature: ailesson-platform, Property 22: Token transaction logging
// Feature: ailesson-platform, Property 23: Transaction type validation
describe("Token Transaction System - Logging and Validation", () => {
  let testUserIds: string[] = [];

  afterEach(async () => {
    try {
      if (testUserIds.length > 0) {
        // Delete related data first
        await prisma.quizAttempt.deleteMany({
          where: { 
            quiz: {
              lesson: {
                creatorId: { in: testUserIds }
              }
            }
          },
        });
        
        await prisma.quiz.deleteMany({
          where: { 
            lesson: {
              creatorId: { in: testUserIds }
            }
          },
        });
        
        await prisma.lesson.deleteMany({
          where: { creatorId: { in: testUserIds } },
        });
        
        // Delete token transactions
        await prisma.tokenTransaction.deleteMany({
          where: { userId: { in: testUserIds } },
        });
        
        // Delete leaderboard entries
        await prisma.leaderboardEntry.deleteMany({
          where: { userId: { in: testUserIds } },
        });

        // Delete users
        await prisma.user.deleteMany({
          where: { id: { in: testUserIds } },
        });

        testUserIds = [];
      }
    } catch (error) {
      console.error("Cleanup error:", error);
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("Property 22: Token transaction logging - all coin operations create transaction records", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          email: fc
            .emailAddress()
            .map((email) => `test-${Date.now()}-${Math.random()}@test-${email}`),
          name: fc.string({ minLength: 1, maxLength: 50 }),
          role: fc.constantFrom(Role.STUDENT, Role.TEACHER),
          transactionAmount: fc.integer({ min: -100, max: 100 }).filter(n => n !== 0),
          transactionType: fc.constantFrom(
            TransactionType.DAILY,
            TransactionType.LESSON_COST,
            TransactionType.ANSWER_REWARD,
            TransactionType.CHAT_COST,
            TransactionType.ADMIN_GRANT,
            TransactionType.LEADERBOARD_REWARD
          ),
        }),
        async (testData) => {
          // Create test user
          const hashedPassword = await bcrypt.hash("testpassword123", 12);
          const initialCoins = testData.role === Role.STUDENT ? 150 : 250;

          const user = await prisma.user.create({
            data: {
              email: testData.email,
              password: hashedPassword,
              name: testData.name,
              role: testData.role,
              wisdomCoins: initialCoins,
            },
          });

          testUserIds.push(user.id);

          // Create initial transaction
          await prisma.tokenTransaction.create({
            data: {
              userId: user.id,
              amount: initialCoins,
              type: TransactionType.INITIAL,
              description: "Initial registration",
            },
          });

          // Get initial transaction count
          const initialTransactionCount = await prisma.tokenTransaction.count({
            where: { userId: user.id },
          });

          // Perform a coin operation (update balance and create transaction)
          const newBalance = Math.max(0, user.wisdomCoins + testData.transactionAmount);
          
          await prisma.$transaction(async (tx) => {
            await tx.user.update({
              where: { id: user.id },
              data: { wisdomCoins: newBalance },
            });

            await tx.tokenTransaction.create({
              data: {
                userId: user.id,
                amount: testData.transactionAmount,
                type: testData.transactionType,
                description: `Test transaction: ${testData.transactionType}`,
              },
            });
          });

          // Verify transaction was created
          const finalTransactionCount = await prisma.tokenTransaction.count({
            where: { userId: user.id },
          });

          expect(finalTransactionCount).toBe(initialTransactionCount + 1);

          // Verify the transaction has correct data
          const transaction = await prisma.tokenTransaction.findFirst({
            where: {
              userId: user.id,
              type: testData.transactionType,
            },
            orderBy: { createdAt: "desc" },
          });

          expect(transaction).not.toBeNull();
          expect(transaction?.amount).toBe(testData.transactionAmount);
          expect(transaction?.type).toBe(testData.transactionType);
          expect(transaction?.userId).toBe(user.id);
        }
      ),
      { numRuns: 10 }
    );
  }, 120000); // 120 second timeout

  test("Property 23: Transaction type validation - all transactions have valid types", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          email: fc
            .emailAddress()
            .map((email) => `test-${Date.now()}-${Math.random()}@test-${email}`),
          name: fc.string({ minLength: 1, maxLength: 50 }),
          transactionType: fc.constantFrom(
            TransactionType.INITIAL,
            TransactionType.DAILY,
            TransactionType.LESSON_COST,
            TransactionType.ANSWER_REWARD,
            TransactionType.CHAT_COST,
            TransactionType.ADMIN_GRANT,
            TransactionType.LEADERBOARD_REWARD
          ),
          amount: fc.integer({ min: -100, max: 1000 }),
        }),
        async (testData) => {
          // Create test user
          const hashedPassword = await bcrypt.hash("testpassword123", 12);

          const user = await prisma.user.create({
            data: {
              email: testData.email,
              password: hashedPassword,
              name: testData.name,
              role: Role.STUDENT,
              wisdomCoins: 150,
            },
          });

          testUserIds.push(user.id);

          // Create transaction with the specified type
          const transaction = await prisma.tokenTransaction.create({
            data: {
              userId: user.id,
              amount: testData.amount,
              type: testData.transactionType,
              description: `Test transaction`,
            },
          });

          // Verify the transaction type is one of the valid enum values
          const validTypes = [
            TransactionType.INITIAL,
            TransactionType.DAILY,
            TransactionType.LESSON_COST,
            TransactionType.ANSWER_REWARD,
            TransactionType.CHAT_COST,
            TransactionType.ADMIN_GRANT,
            TransactionType.LEADERBOARD_REWARD,
          ];

          expect(validTypes).toContain(transaction.type);
          expect(transaction.type).toBe(testData.transactionType);

          // Verify we can query by type
          const foundTransaction = await prisma.tokenTransaction.findFirst({
            where: {
              userId: user.id,
              type: testData.transactionType,
            },
          });

          expect(foundTransaction).not.toBeNull();
          expect(foundTransaction?.id).toBe(transaction.id);
        }
      ),
      { numRuns: 10 }
    );
  }, 120000); // 120 second timeout
});
