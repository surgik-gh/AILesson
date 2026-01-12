/**
 * Property-Based Test: Chat History Persistence
 * Feature: ailesson-platform, Property 32: Chat history persistence
 * Validates: Requirements 15.3
 * 
 * Property: For any message sent in a Student-Expert chat, a ChatMessage record should be created
 * with the correct userId, expertId, content, and isFromUser flag, and all messages should be
 * retrievable in chronological order.
 */

import { Role } from "@prisma/client";
import fc from "fast-check";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";

describe("Property 32: Chat history persistence", () => {
  beforeAll(async () => {
    // Clean up test data in correct order
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
    "chat messages are persisted with correct data and retrievable in chronological order",
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: fc.emailAddress(),
            name: fc.string({ minLength: 1, maxLength: 50 }),
            expertName: fc.string({ minLength: 1, maxLength: 50 }),
            messages: fc.array(
              fc.record({
                content: fc.string({ minLength: 1, maxLength: 200 }),
                isFromUser: fc.boolean(),
              }),
              { minLength: 1, maxLength: 5 }
            ),
          }),
          async (data) => {
            // Create a student user
            const hashedPassword = await bcrypt.hash("password123", 4);
            const user = await prisma.user.create({
              data: {
                email: data.email,
                password: hashedPassword,
                name: data.name,
                role: Role.STUDENT,
                wisdomCoins: 100,
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

            // Create chat messages in sequence
            const createdMessages = [];
            for (const msg of data.messages) {
              const chatMessage = await prisma.chatMessage.create({
                data: {
                  userId: user.id,
                  expertId: expert.id,
                  content: msg.content,
                  isFromUser: msg.isFromUser,
                },
              });
              createdMessages.push(chatMessage);
              
              // Small delay to ensure different timestamps
              await new Promise(resolve => setTimeout(resolve, 10));
            }

            // Retrieve all messages for this user-expert conversation
            const retrievedMessages = await prisma.chatMessage.findMany({
              where: {
                userId: user.id,
                expertId: expert.id,
              },
              orderBy: {
                createdAt: "asc",
              },
            });

            // Verify correct number of messages
            expect(retrievedMessages.length).toBe(data.messages.length);

            // Verify each message has correct data
            for (let i = 0; i < data.messages.length; i++) {
              const original = data.messages[i];
              const retrieved = retrievedMessages[i];

              expect(retrieved.userId).toBe(user.id);
              expect(retrieved.expertId).toBe(expert.id);
              expect(retrieved.content).toBe(original.content);
              expect(retrieved.isFromUser).toBe(original.isFromUser);
            }

            // Verify chronological order (each message should have a later or equal timestamp)
            for (let i = 1; i < retrievedMessages.length; i++) {
              expect(retrievedMessages[i].createdAt.getTime()).toBeGreaterThanOrEqual(
                retrievedMessages[i - 1].createdAt.getTime()
              );
            }
          }
        ),
        { numRuns: 10 }
      );
    },
    60000
  );
});
