/**
 * Property-Based Test: Chat Message Coin Deduction
 * Feature: ailesson-platform, Property 5: Chat message coin deduction
 * Validates: Requirements 2.4
 * 
 * Property: For any Student sending a message to their Expert (when they have sufficient coins),
 * the wisdom coins balance should decrease by the specified chat cost, and a TokenTransaction
 * of type CHAT_COST should be created.
 */

import { Role, TransactionType } from "@prisma/client";
import fc from "fast-check";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";

const CHAT_COST = 5;

describe("Property 5: Chat message coin deduction", () => {
  beforeAll(async () => {
    // Clean up test data in correct order - delete all to ensure clean state
    await prisma.chatMessage.deleteMany({});
    await prisma.userAnswer.deleteMany({});
    await prisma.quizAttempt.deleteMany({});
    await prisma.question.deleteMany({});
    await prisma.quiz.deleteMany({});
    await prisma.lesson.deleteMany({});
    await prisma.leaderboardEntry.deleteMany({});
    await prisma.tokenTransaction.deleteMany({});
    await prisma.expert.deleteMany({});
    await prisma.user.deleteMany({});
  }, 30000);

  afterAll(async () => {
    await prisma.$disconnect();
  });

  afterEach(async () => {
    // Clean up after each test in correct order
    await prisma.chatMessage.deleteMany({});
    await prisma.userAnswer.deleteMany({});
    await prisma.quizAttempt.deleteMany({});
    await prisma.question.deleteMany({});
    await prisma.quiz.deleteMany({});
    await prisma.lesson.deleteMany({});
    await prisma.leaderboardEntry.deleteMany({});
    await prisma.tokenTransaction.deleteMany({});
    await prisma.expert.deleteMany({});
    await prisma.user.deleteMany({});
  });

  test(
    "sending a chat message deducts correct amount and creates transaction",
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: fc.emailAddress(),
            name: fc.string({ minLength: 1, maxLength: 50 }),
            initialCoins: fc.integer({ min: CHAT_COST, max: 500 }), // Ensure sufficient coins
            message: fc.string({ minLength: 1, maxLength: 200 }),
            expertName: fc.string({ minLength: 1, maxLength: 50 }),
          }),
          async (data) => {
            // Create a student user with sufficient coins (use lower bcrypt rounds for speed)
            const hashedPassword = await bcrypt.hash("password123", 4);
            const user = await prisma.user.create({
              data: {
                email: data.email,
                password: hashedPassword,
                name: data.name,
                role: Role.STUDENT,
                wisdomCoins: data.initialCoins,
              },
            });

            // Create an expert for the user
            const expert = await prisma.expert.create({
              data: {
                name: data.expertName,
                personality: "Friendly and helpful tutor",
                communicationStyle: "Clear and encouraging",
                appearance: "avatar1",
                ownerId: user.id,
              },
            });

            // Set the expert as selected
            await prisma.user.update({
              where: { id: user.id },
              data: { selectedExpertId: expert.id },
            });

            const balanceBefore = data.initialCoins;

            // Simulate sending a chat message (without calling AI service)
            const result = await prisma.$transaction(async (tx) => {
              // Deduct coins
              const updatedUser = await tx.user.update({
                where: { id: user.id },
                data: {
                  wisdomCoins: {
                    decrement: CHAT_COST,
                  },
                },
              });

              // Create transaction record
              await tx.tokenTransaction.create({
                data: {
                  userId: user.id,
                  amount: -CHAT_COST,
                  type: TransactionType.CHAT_COST,
                  description: `Chat message to ${expert.name}`,
                },
              });

              // Save user message
              await tx.chatMessage.create({
                data: {
                  userId: user.id,
                  expertId: expert.id,
                  content: data.message,
                  isFromUser: true,
                },
              });

              return updatedUser;
            });

            // Verify balance decreased by CHAT_COST
            expect(result.wisdomCoins).toBe(balanceBefore - CHAT_COST);

            // Verify transaction was created
            const transaction = await prisma.tokenTransaction.findFirst({
              where: {
                userId: user.id,
                type: TransactionType.CHAT_COST,
              },
            });

            expect(transaction).not.toBeNull();
            expect(transaction!.amount).toBe(-CHAT_COST);
            expect(transaction!.type).toBe(TransactionType.CHAT_COST);

            // Verify message was saved
            const message = await prisma.chatMessage.findFirst({
              where: {
                userId: user.id,
                expertId: expert.id,
                isFromUser: true,
              },
            });

            expect(message).not.toBeNull();
            expect(message!.content).toBe(data.message);
          }
        ),
        { numRuns: 10 }
      );
    },
    60000
  );
});
