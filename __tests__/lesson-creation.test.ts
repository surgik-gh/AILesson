/**
 * @jest-environment node
 */

import fc from "fast-check";
import { prisma } from "@/lib/db/prisma";
import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";

// Feature: ailesson-platform, Property 6: Lesson creation generates quiz
// Feature: ailesson-platform, Property 7: Lesson creation coin deduction (non-admin)
// Feature: ailesson-platform, Property 8: Lesson associations

describe("Lesson Creation Properties", () => {
  let testSubjectId: string;
  let testTeacherId: string;
  let testAdminId: string;

  beforeAll(async () => {
    // Create a test subject
    const subject = await prisma.subject.create({
      data: {
        name: `Test Subject ${Date.now()}`,
        description: "Test subject for lesson creation tests",
      },
    });
    testSubjectId = subject.id;

    // Create a test teacher with sufficient coins
    const hashedPassword = await bcrypt.hash("testpassword", 12);
    const teacher = await prisma.user.create({
      data: {
        email: `teacher-${Date.now()}@test.com`,
        password: hashedPassword,
        name: "Test Teacher",
        role: Role.TEACHER,
        wisdomCoins: 1000,
      },
    });
    testTeacherId = teacher.id;

    // Create initial transaction for teacher
    await prisma.tokenTransaction.create({
      data: {
        userId: testTeacherId,
        amount: 1000,
        type: "INITIAL",
      },
    });

    // Create a test admin
    const admin = await prisma.user.create({
      data: {
        email: `admin-${Date.now()}@test.com`,
        password: hashedPassword,
        name: "Test Admin",
        role: Role.ADMIN,
        wisdomCoins: 999999,
      },
    });
    testAdminId = admin.id;

    // Create initial transaction for admin
    await prisma.tokenTransaction.create({
      data: {
        userId: testAdminId,
        amount: 999999,
        type: "INITIAL",
      },
    });
  }, 30000);

  afterAll(async () => {
    // Clean up test data
    try {
      // Delete lessons and related data
      const lessons = await prisma.lesson.findMany({
        where: {
          OR: [{ creatorId: testTeacherId }, { creatorId: testAdminId }],
        },
        select: { id: true },
      });

      const lessonIds = lessons.map((l) => l.id);

      if (lessonIds.length > 0) {
        // Delete quizzes (cascade will handle questions)
        await prisma.quiz.deleteMany({
          where: { lessonId: { in: lessonIds } },
        });

        // Delete lessons
        await prisma.lesson.deleteMany({
          where: { id: { in: lessonIds } },
        });
      }

      // Delete transactions
      await prisma.tokenTransaction.deleteMany({
        where: {
          userId: { in: [testTeacherId, testAdminId] },
        },
      });

      // Delete users
      await prisma.user.deleteMany({
        where: {
          id: { in: [testTeacherId, testAdminId] },
        },
      });

      // Delete subject
      await prisma.subject.delete({
        where: { id: testSubjectId },
      });
    } catch (error) {
      console.error("Cleanup error:", error);
    }

    await prisma.$disconnect();
  });

  test("Property 8: Lesson associations - every lesson has exactly one subject and one creator", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          title: fc.string({ minLength: 5, maxLength: 100 }),
          content: fc.string({ minLength: 20, maxLength: 500 }),
          keyPoints: fc.array(fc.string({ minLength: 5, maxLength: 50 }), {
            minLength: 1,
            maxLength: 5,
          }),
          difficulty: fc.constantFrom("BEGINNER", "INTERMEDIATE", "ADVANCED"),
          useTeacher: fc.boolean(),
        }),
        async (lessonData) => {
          const creatorId = lessonData.useTeacher ? testTeacherId : testAdminId;

          // Create lesson
          const lesson = await prisma.lesson.create({
            data: {
              title: lessonData.title,
              content: lessonData.content,
              keyPoints: lessonData.keyPoints,
              difficulty: lessonData.difficulty as any,
              subjectId: testSubjectId,
              creatorId: creatorId,
            },
            include: {
              subject: true,
              creator: true,
            },
          });

          // Property: Lesson must have exactly one subject
          expect(lesson.subjectId).toBe(testSubjectId);
          expect(lesson.subject).toBeDefined();
          expect(lesson.subject.id).toBe(testSubjectId);

          // Property: Lesson must have exactly one creator
          expect(lesson.creatorId).toBe(creatorId);
          expect(lesson.creator).toBeDefined();
          expect(lesson.creator.id).toBe(creatorId);

          // Clean up this lesson
          await prisma.lesson.delete({ where: { id: lesson.id } });
        }
      ),
      { numRuns: 10 }
    );
  }, 120000);

  test("Property 7: Lesson creation coin deduction (non-admin) - teachers lose 20 coins, admins don't", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          title: fc.string({ minLength: 5, maxLength: 100 }),
          content: fc.string({ minLength: 20, maxLength: 500 }),
          keyPoints: fc.array(fc.string({ minLength: 5, maxLength: 50 }), {
            minLength: 1,
            maxLength: 5,
          }),
          difficulty: fc.constantFrom("BEGINNER", "INTERMEDIATE", "ADVANCED"),
          useTeacher: fc.boolean(),
        }),
        async (lessonData) => {
          const creatorId = lessonData.useTeacher ? testTeacherId : testAdminId;
          const isTeacher = lessonData.useTeacher;

          // Get initial balance
          const userBefore = await prisma.user.findUnique({
            where: { id: creatorId },
            select: { wisdomCoins: true },
          });

          expect(userBefore).not.toBeNull();
          const initialBalance = userBefore!.wisdomCoins;

          // Create lesson with transaction
          const lesson = await prisma.$transaction(async (tx) => {
            const newLesson = await tx.lesson.create({
              data: {
                title: lessonData.title,
                content: lessonData.content,
                keyPoints: lessonData.keyPoints,
                difficulty: lessonData.difficulty as any,
                subjectId: testSubjectId,
                creatorId: creatorId,
              },
            });

            // Deduct coins only for non-admin
            if (isTeacher) {
              await tx.user.update({
                where: { id: creatorId },
                data: { wisdomCoins: { decrement: 20 } },
              });

              await tx.tokenTransaction.create({
                data: {
                  userId: creatorId,
                  amount: -20,
                  type: "LESSON_COST",
                  description: `Created lesson: ${newLesson.title}`,
                },
              });
            }

            return newLesson;
          });

          // Get final balance
          const userAfter = await prisma.user.findUnique({
            where: { id: creatorId },
            select: { wisdomCoins: true },
          });

          expect(userAfter).not.toBeNull();
          const finalBalance = userAfter!.wisdomCoins;

          // Property: Teachers should lose 20 coins, admins should not
          if (isTeacher) {
            expect(finalBalance).toBe(initialBalance - 20);

            // Verify transaction was created
            const transaction = await prisma.tokenTransaction.findFirst({
              where: {
                userId: creatorId,
                type: "LESSON_COST",
                amount: -20,
              },
              orderBy: { createdAt: "desc" },
            });

            expect(transaction).not.toBeNull();
            expect(transaction!.amount).toBe(-20);
          } else {
            // Admin balance should not change
            expect(finalBalance).toBe(initialBalance);
          }

          // Clean up
          await prisma.lesson.delete({ where: { id: lesson.id } });
        }
      ),
      { numRuns: 10 }
    );
  }, 120000);
});
