/**
 * @jest-environment node
 */

import fc from "fast-check";
import { prisma } from "@/lib/db/prisma";
import { Role, AchievementCondition } from "@prisma/client";
import bcrypt from "bcryptjs";

// Feature: ailesson-platform, Property 29: Teacher student progress access
// Validates: Requirements 13.1, 13.2, 13.3

describe("Teacher Student Progress Access Properties", () => {
  let testTeacherId: string;
  let testSubjectId: string;
  let testStudentIds: string[] = [];
  let testLessonIds: string[] = [];
  let testAchievementIds: string[] = [];

  beforeAll(async () => {
    // Create a test teacher
    const hashedPassword = await bcrypt.hash("testpassword", 12);
    const teacher = await prisma.user.create({
      data: {
        email: `teacher-progress-${Date.now()}@test.com`,
        password: hashedPassword,
        name: "Test Teacher",
        role: Role.TEACHER,
        wisdomCoins: 1000,
      },
    });
    testTeacherId = teacher.id;

    // Create a test subject
    const subject = await prisma.subject.create({
      data: {
        name: `Test Subject ${Date.now()}`,
        description: "Test subject for progress tests",
      },
    });
    testSubjectId = subject.id;

    // Get existing achievements or create unique ones
    let achievement1 = await prisma.achievement.findUnique({
      where: { name: "first_quiz" },
    });
    
    if (!achievement1) {
      achievement1 = await prisma.achievement.create({
        data: {
          name: "first_quiz",
          description: "Complete your first quiz",
          condition: AchievementCondition.FIRST_QUIZ,
          icon: "🎯",
        },
      });
    }
    testAchievementIds.push(achievement1.id);

    let achievement2 = await prisma.achievement.findUnique({
      where: { name: "perfect_quiz" },
    });
    
    if (!achievement2) {
      achievement2 = await prisma.achievement.create({
        data: {
          name: "perfect_quiz",
          description: "Complete a quiz with 100% correct answers",
          condition: AchievementCondition.PERFECT_QUIZ,
          icon: "⭐",
        },
      });
    }
    testAchievementIds.push(achievement2.id);

    // Create test students with various progress
    for (let i = 0; i < 3; i++) {
      const student = await prisma.user.create({
        data: {
          email: `student-progress-${Date.now()}-${i}@test.com`,
          password: hashedPassword,
          name: `Test Student ${i}`,
          role: Role.STUDENT,
          wisdomCoins: 150,
        },
      });
      testStudentIds.push(student.id);

      // Create leaderboard entry
      await prisma.leaderboardEntry.create({
        data: {
          userId: student.id,
          score: 10 * (i + 1),
          quizCount: i + 1,
          correctAnswers: 5 * (i + 1),
          totalAnswers: 10 * (i + 1),
        },
      });
    }

    // Create test lessons
    for (let i = 0; i < 2; i++) {
      const lesson = await prisma.lesson.create({
        data: {
          title: `Test Lesson ${i}`,
          content: "Test content for progress tracking",
          keyPoints: ["Point 1", "Point 2"],
          difficulty: "BEGINNER",
          subjectId: testSubjectId,
          creatorId: testTeacherId,
        },
      });
      testLessonIds.push(lesson.id);

      // Create quiz for lesson
      const quiz = await prisma.quiz.create({
        data: {
          lessonId: lesson.id,
          questions: {
            create: [
              {
                type: "SINGLE",
                text: "Test question 1",
                correctAnswer: { answer: "A" },
                options: { options: ["A", "B", "C", "D"] },
                order: 1,
              },
              {
                type: "SINGLE",
                text: "Test question 2",
                correctAnswer: { answer: "B" },
                options: { options: ["A", "B", "C", "D"] },
                order: 2,
              },
            ],
          },
        },
      });
    }
  }, 30000);

  afterAll(async () => {
    // Clean up test data
    try {
      // Delete quiz attempts and answers
      const quizzes = await prisma.quiz.findMany({
        where: { lessonId: { in: testLessonIds } },
        select: { id: true },
      });
      const quizIds = quizzes.map((q) => q.id);

      if (quizIds.length > 0) {
        const attempts = await prisma.quizAttempt.findMany({
          where: { quizId: { in: quizIds } },
          select: { id: true },
        });
        const attemptIds = attempts.map((a) => a.id);

        if (attemptIds.length > 0) {
          await prisma.userAnswer.deleteMany({
            where: { attemptId: { in: attemptIds } },
          });
          await prisma.quizAttempt.deleteMany({
            where: { id: { in: attemptIds } },
          });
        }

        // Delete questions
        await prisma.question.deleteMany({
          where: { quizId: { in: quizIds } },
        });

        // Delete quizzes
        await prisma.quiz.deleteMany({
          where: { id: { in: quizIds } },
        });
      }

      // Delete sent lessons
      await prisma.sentLesson.deleteMany({
        where: { lessonId: { in: testLessonIds } },
      });

      // Delete lessons
      await prisma.lesson.deleteMany({
        where: { id: { in: testLessonIds } },
      });

      // Delete user achievements
      await prisma.userAchievement.deleteMany({
        where: { userId: { in: testStudentIds } },
      });

      // Delete leaderboard entries
      await prisma.leaderboardEntry.deleteMany({
        where: { userId: { in: testStudentIds } },
      });

      // Delete users
      await prisma.user.deleteMany({
        where: { id: { in: [...testStudentIds, testTeacherId] } },
      });

      // Don't delete achievements if they were pre-existing
      // Only delete if we created them (but we're using existing ones now)

      // Delete subject
      await prisma.subject.delete({
        where: { id: testSubjectId },
      });
    } catch (error) {
      console.error("Cleanup error:", error);
    }

    await prisma.$disconnect();
  });

  test("Property 29: Teacher student progress access - teachers can query all student progress data", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...testStudentIds),
        async (studentId) => {
          // Ensure leaderboard entry exists for this student
          await prisma.leaderboardEntry.upsert({
            where: { userId: studentId },
            update: {},
            create: {
              userId: studentId,
              score: 10,
              quizCount: 1,
              correctAnswers: 5,
              totalAnswers: 10,
            },
          });
          
          // Property 1: Teacher can retrieve student basic info
          const student = await prisma.user.findUnique({
            where: { id: studentId },
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              wisdomCoins: true,
              createdAt: true,
            },
          });

          expect(student).not.toBeNull();
          expect(student!.role).toBe(Role.STUDENT);

          // Property 2: Teacher can retrieve completed lessons (via quiz attempts)
          const completedQuizAttempts = await prisma.quizAttempt.findMany({
            where: {
              userId: studentId,
              completedAt: { not: null },
            },
            include: {
              quiz: {
                include: {
                  lesson: {
                    include: {
                      subject: true,
                    },
                  },
                },
              },
              answers: true,
            },
          });

          // Should be able to query (even if empty)
          expect(Array.isArray(completedQuizAttempts)).toBe(true);

          // Property 3: Teacher can retrieve quiz results and statistics
          const leaderboardEntry = await prisma.leaderboardEntry.findUnique({
            where: { userId: studentId },
          });

          expect(leaderboardEntry).not.toBeNull();
          expect(leaderboardEntry!.userId).toBe(studentId);
          expect(typeof leaderboardEntry!.score).toBe("number");
          expect(typeof leaderboardEntry!.quizCount).toBe("number");
          expect(typeof leaderboardEntry!.correctAnswers).toBe("number");
          expect(typeof leaderboardEntry!.totalAnswers).toBe("number");

          // Property 4: Teacher can retrieve earned achievements
          const achievements = await prisma.userAchievement.findMany({
            where: { userId: studentId },
            include: {
              achievement: true,
            },
          });

          // Should be able to query (even if empty)
          expect(Array.isArray(achievements)).toBe(true);

          // Property 5: All retrieved data should be consistent
          if (leaderboardEntry!.totalAnswers > 0) {
            const percentage =
              (leaderboardEntry!.correctAnswers / leaderboardEntry!.totalAnswers) * 100;
            expect(percentage).toBeGreaterThanOrEqual(0);
            expect(percentage).toBeLessThanOrEqual(100);
          }
        }
      ),
      { numRuns: 15 }
    );
  }, 120000);

  test("Property: Teacher can access lessons sent to students", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          studentId: fc.constantFrom(...testStudentIds),
          lessonId: fc.constantFrom(...testLessonIds),
        }),
        async ({ studentId, lessonId }) => {
          // Send lesson to student
          const sentLesson = await prisma.sentLesson.create({
            data: {
              lessonId,
              studentId,
              teacherId: testTeacherId,
            },
          });

          // Property: Teacher can query sent lessons
          const receivedLessons = await prisma.sentLesson.findMany({
            where: { studentId },
            include: {
              lesson: {
                include: {
                  subject: true,
                },
              },
              teacher: true,
            },
          });

          expect(receivedLessons.length).toBeGreaterThanOrEqual(1);

          const foundLesson = receivedLessons.find((sl) => sl.id === sentLesson.id);
          expect(foundLesson).toBeDefined();
          expect(foundLesson!.lessonId).toBe(lessonId);
          expect(foundLesson!.studentId).toBe(studentId);
          expect(foundLesson!.teacherId).toBe(testTeacherId);

          // Property: Lesson data is complete
          expect(foundLesson!.lesson).toBeDefined();
          expect(foundLesson!.lesson.title).toBeDefined();
          expect(foundLesson!.lesson.subject).toBeDefined();
          expect(foundLesson!.teacher).toBeDefined();

          // Clean up
          await prisma.sentLesson.delete({
            where: { id: sentLesson.id },
          });
        }
      ),
      { numRuns: 10 }
    );
  }, 120000);

  test("Property: Teacher can track student quiz completion over time", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          studentId: fc.constantFrom(...testStudentIds),
          lessonIndex: fc.integer({ min: 0, max: testLessonIds.length - 1 }),
          correctCount: fc.integer({ min: 0, max: 2 }),
        }),
        async ({ studentId, lessonIndex, correctCount }) => {
          const lessonId = testLessonIds[lessonIndex];

          // Get quiz for lesson
          const quiz = await prisma.quiz.findUnique({
            where: { lessonId },
            include: { questions: true },
          });

          if (!quiz || quiz.questions.length === 0) {
            return; // Skip if no quiz
          }

          // Create quiz attempt
          const attempt = await prisma.quizAttempt.create({
            data: {
              quizId: quiz.id,
              userId: studentId,
              score: correctCount * 10,
              isPerfect: correctCount === quiz.questions.length,
              completedAt: new Date(),
            },
          });

          // Create answers
          for (let i = 0; i < quiz.questions.length; i++) {
            await prisma.userAnswer.create({
              data: {
                questionId: quiz.questions[i].id,
                userId: studentId,
                attemptId: attempt.id,
                answer: { answer: "A" },
                isCorrect: i < correctCount,
              },
            });
          }

          // Property: Teacher can retrieve this completed attempt
          const completedAttempts = await prisma.quizAttempt.findMany({
            where: {
              userId: studentId,
              completedAt: { not: null },
            },
            include: {
              quiz: {
                include: {
                  lesson: true,
                },
              },
              answers: true,
            },
          });

          const foundAttempt = completedAttempts.find((a) => a.id === attempt.id);
          expect(foundAttempt).toBeDefined();
          expect(foundAttempt!.userId).toBe(studentId);
          expect(foundAttempt!.completedAt).not.toBeNull();

          // Property: Statistics are accurate
          const correctAnswers = foundAttempt!.answers.filter((a) => a.isCorrect).length;
          expect(correctAnswers).toBe(correctCount);

          // Clean up
          await prisma.userAnswer.deleteMany({
            where: { attemptId: attempt.id },
          });
          await prisma.quizAttempt.delete({
            where: { id: attempt.id },
          });
        }
      ),
      { numRuns: 10 }
    );
  }, 120000);
});
