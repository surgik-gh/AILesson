/**
 * @jest-environment node
 */

import { prisma } from "@/lib/db/prisma";
import { Role, TransactionType } from "@prisma/client";
import bcrypt from "bcryptjs";

// Unit tests for daily reward functionality
describe("Token Transaction System - Daily Reward", () => {
  let testUserId: string;

  beforeEach(async () => {
    // Create a test student user
    const hashedPassword = await bcrypt.hash("testpassword123", 12);

    const user = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@test.com`,
        password: hashedPassword,
        name: "Test Student",
        role: Role.STUDENT,
        wisdomCoins: 150,
      },
    });

    testUserId = user.id;

    // Create initial transaction
    await prisma.tokenTransaction.create({
      data: {
        userId: testUserId,
        amount: 150,
        type: TransactionType.INITIAL,
        description: "Initial registration",
      },
    });
  });

  afterEach(async () => {
    try {
      // Clean up test data
      await prisma.tokenTransaction.deleteMany({
        where: { userId: testUserId },
      });

      await prisma.user.delete({
        where: { id: testUserId },
      });
    } catch (error) {
      console.error("Cleanup error:", error);
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("should award exactly 20 wisdom coins for daily reward", async () => {
    // Get initial balance
    const userBefore = await prisma.user.findUnique({
      where: { id: testUserId },
    });

    expect(userBefore).not.toBeNull();
    const initialBalance = userBefore!.wisdomCoins;

    // Award daily reward
    const dailyRewardAmount = 20;

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: testUserId },
        data: {
          wisdomCoins: { increment: dailyRewardAmount },
        },
      });

      await tx.tokenTransaction.create({
        data: {
          userId: testUserId,
          amount: dailyRewardAmount,
          type: TransactionType.DAILY,
          description: "Daily reward",
        },
      });
    });

    // Verify balance increased by exactly 20
    const userAfter = await prisma.user.findUnique({
      where: { id: testUserId },
    });

    expect(userAfter).not.toBeNull();
    expect(userAfter!.wisdomCoins).toBe(initialBalance + 20);

    // Verify transaction was created with correct amount
    const dailyTransaction = await prisma.tokenTransaction.findFirst({
      where: {
        userId: testUserId,
        type: TransactionType.DAILY,
      },
    });

    expect(dailyTransaction).not.toBeNull();
    expect(dailyTransaction!.amount).toBe(20);
    expect(dailyTransaction!.type).toBe(TransactionType.DAILY);
  });

  test("should create DAILY transaction type for daily reward", async () => {
    // Award daily reward
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: testUserId },
        data: {
          wisdomCoins: { increment: 20 },
        },
      });

      await tx.tokenTransaction.create({
        data: {
          userId: testUserId,
          amount: 20,
          type: TransactionType.DAILY,
          description: "Daily reward",
        },
      });
    });

    // Verify transaction type is DAILY
    const transaction = await prisma.tokenTransaction.findFirst({
      where: {
        userId: testUserId,
        type: TransactionType.DAILY,
      },
    });

    expect(transaction).not.toBeNull();
    expect(transaction!.type).toBe(TransactionType.DAILY);
    expect(transaction!.description).toContain("Daily");
  });

  test("should allow multiple daily rewards over time", async () => {
    // Award first daily reward
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: testUserId },
        data: {
          wisdomCoins: { increment: 20 },
        },
      });

      await tx.tokenTransaction.create({
        data: {
          userId: testUserId,
          amount: 20,
          type: TransactionType.DAILY,
          description: "Daily reward - Day 1",
        },
      });
    });

    // Award second daily reward
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: testUserId },
        data: {
          wisdomCoins: { increment: 20 },
        },
      });

      await tx.tokenTransaction.create({
        data: {
          userId: testUserId,
          amount: 20,
          type: TransactionType.DAILY,
          description: "Daily reward - Day 2",
        },
      });
    });

    // Verify both transactions exist
    const dailyTransactions = await prisma.tokenTransaction.findMany({
      where: {
        userId: testUserId,
        type: TransactionType.DAILY,
      },
      orderBy: { createdAt: "asc" },
    });

    expect(dailyTransactions).toHaveLength(2);
    expect(dailyTransactions[0].amount).toBe(20);
    expect(dailyTransactions[1].amount).toBe(20);

    // Verify total balance increased by 40 (2 x 20)
    const user = await prisma.user.findUnique({
      where: { id: testUserId },
    });

    expect(user!.wisdomCoins).toBe(150 + 40); // Initial 150 + 40 from daily rewards
  });

  test("should work for both students and teachers", async () => {
    // Create a teacher user
    const hashedPassword = await bcrypt.hash("testpassword123", 12);

    const teacher = await prisma.user.create({
      data: {
        email: `teacher-${Date.now()}@test.com`,
        password: hashedPassword,
        name: "Test Teacher",
        role: Role.TEACHER,
        wisdomCoins: 250,
      },
    });

    try {
      // Award daily reward to teacher
      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: teacher.id },
          data: {
            wisdomCoins: { increment: 20 },
          },
        });

        await tx.tokenTransaction.create({
          data: {
            userId: teacher.id,
            amount: 20,
            type: TransactionType.DAILY,
            description: "Daily reward",
          },
        });
      });

      // Verify teacher received daily reward
      const teacherAfter = await prisma.user.findUnique({
        where: { id: teacher.id },
      });

      expect(teacherAfter!.wisdomCoins).toBe(250 + 20);

      const transaction = await prisma.tokenTransaction.findFirst({
        where: {
          userId: teacher.id,
          type: TransactionType.DAILY,
        },
      });

      expect(transaction).not.toBeNull();
      expect(transaction!.amount).toBe(20);
    } finally {
      // Clean up teacher
      await prisma.tokenTransaction.deleteMany({
        where: { userId: teacher.id },
      });
      await prisma.user.delete({
        where: { id: teacher.id },
      });
    }
  });
});
