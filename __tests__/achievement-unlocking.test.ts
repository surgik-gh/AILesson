/**
 * @jest-environment node
 */

import fc from 'fast-check';
import { checkAchievements } from '@/lib/utils/achievements';
import { prisma } from '@/lib/db/prisma';
import { QuestionType } from '@prisma/client';

// Feature: ailesson-platform, Property 15: Achievement unlocking - first quiz
// Feature: ailesson-platform, Property 16: Achievement unlocking - perfect quiz
// Feature: ailesson-platform, Property 17: Achievement unlocking - ten quizzes
describe('Achievement Unlocking Properties', () => {
  let testUserId: string;
  let testSubjectId: string;
  let testLessonId: string;
  let testQuizId: string;
  let firstQuizAchievementId: string;
  let perfectQuizAchievementId: string;
  let tenQuizzesAchievementId: string;

  beforeAll(async () => {
    // Create test subject
    const subject = await prisma.subject.create({
      data: {
        name: `Test Subject ${Date.now()}`,
        description: 'Test subject for achievements',
      },
    });
    testSubjectId = subject.id;

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: `test-achievements-${Date.now()}@test.com`,
        password: 'hashedpassword',
        name: 'Test User',
        role: 'STUDENT',
        wisdomCoins: 100,
      },
    });
    testUserId = user.id;

    // Create test lesson
    const lesson = await prisma.lesson.create({
      data: {
        title: 'Test Lesson for Achievements',
        content: 'Test content',
        keyPoints: ['Point 1', 'Point 2'],
        subjectId: testSubjectId,
        creatorId: testUserId,
      },
    });
    testLessonId = lesson.id;

    // Create test quiz
    const quiz = await prisma.quiz.create({
      data: {
        lessonId: testLessonId,
      },
    });
    testQuizId = quiz.id;

    // Get achievement IDs
    const firstQuizAchievement = await prisma.achievement.findFirst({
      where: { condition: 'FIRST_QUIZ' },
    });
    const perfectQuizAchievement = await prisma.achievement.findFirst({
      where: { condition: 'PERFECT_QUIZ' },
    });
    const tenQuizzesAchievement = await prisma.achievement.findFirst({
      where: { condition: 'TEN_QUIZZES' },
    });

    if (!firstQuizAchievement || !perfectQuizAchievement || !tenQuizzesAchievement) {
      throw new Error('Required achievements not found in database. Run seed script first.');
    }

    firstQuizAchievementId = firstQuizAchievement.id;
    perfectQuizAchievementId = perfectQuizAchievement.id;
    tenQuizzesAchievementId = tenQuizzesAchievement.id;
  });

  afterAll(async () => {
    // Clean up in reverse order of dependencies
    try {
      // Delete all user achievements
      await prisma.userAchievement.deleteMany({
        where: { userId: testUserId },
      });

      // Delete all user answers
      await prisma.userAnswer.deleteMany({
        where: { userId: testUserId },
      });

      // Delete all quiz attempts
      await prisma.quizAttempt.deleteMany({
        where: { userId: testUserId },
      });

      // Delete all questions
      await prisma.question.deleteMany({
        where: { quizId: testQuizId },
      });

      // Delete quiz
      await prisma.quiz.deleteMany({
        where: { id: testQuizId },
      });

      // Delete lesson
      await prisma.lesson.deleteMany({
        where: { id: testLessonId },
      });

      // Delete token transactions
      await prisma.tokenTransaction.deleteMany({
        where: { userId: testUserId },
      });

      // Delete leaderboard entry
      await prisma.leaderboardEntry.deleteMany({
        where: { userId: testUserId },
      });

      // Delete user
      await prisma.user.deleteMany({
        where: { id: testUserId },
      });

      // Delete subject
      await prisma.subject.deleteMany({
        where: { id: testSubjectId },
      });
    } catch (error) {
      console.error('Cleanup error:', error);
    }
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up achievements, user answers, quiz attempts, and leaderboard before each test
    await prisma.userAchievement.deleteMany({
      where: { userId: testUserId },
    });
    await prisma.userAnswer.deleteMany({
      where: { userId: testUserId },
    });
    await prisma.quizAttempt.deleteMany({
      where: { userId: testUserId },
    });
    await prisma.leaderboardEntry.deleteMany({
      where: { userId: testUserId },
    });
  });

  // Property 15: Achievement unlocking - first quiz
  test('completing first quiz awards first_quiz achievement', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constant(null), // No random data needed, just testing the condition
        async () => {
          // Clean up before this iteration
          await prisma.userAchievement.deleteMany({
            where: { userId: testUserId },
          });
          await prisma.leaderboardEntry.deleteMany({
            where: { userId: testUserId },
          });

          // Create or update leaderboard entry with quizCount = 1 (first quiz completed)
          await prisma.leaderboardEntry.upsert({
            where: { userId: testUserId },
            create: {
              userId: testUserId,
              score: 10,
              quizCount: 1,
              correctAnswers: 1,
              totalAnswers: 1,
            },
            update: {
              score: 10,
              quizCount: 1,
              correctAnswers: 1,
              totalAnswers: 1,
            },
          });

          // Check achievements
          const result = await checkAchievements(testUserId);

          // Verify first_quiz achievement was awarded
          const userAchievement = await prisma.userAchievement.findFirst({
            where: {
              userId: testUserId,
              achievementId: firstQuizAchievementId,
            },
          });

          expect(userAchievement).toBeTruthy();
          expect(result.newAchievements.length).toBeGreaterThan(0);
          expect(result.newAchievements.some((a) => a.id === firstQuizAchievementId)).toBe(true);
        }
      ),
      { numRuns: 3 }
    );
  }, 30000);

  // Property 16: Achievement unlocking - perfect quiz
  test('completing a quiz with 100% correct answers awards perfect_quiz achievement', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 3, max: 10 }), // Number of questions
        async (numQuestions) => {
          // Clean up before this iteration
          await prisma.userAchievement.deleteMany({
            where: { userId: testUserId },
          });
          await prisma.userAnswer.deleteMany({
            where: { userId: testUserId },
          });
          await prisma.quizAttempt.deleteMany({
            where: { userId: testUserId },
          });
          await prisma.leaderboardEntry.deleteMany({
            where: { userId: testUserId },
          });

          // Create questions
          const questions = await Promise.all(
            Array.from({ length: numQuestions }, (_, i) =>
              prisma.question.create({
                data: {
                  type: QuestionType.SINGLE,
                  text: `Question ${i + 1}`,
                  correctAnswer: 0,
                  options: ['Correct', 'Wrong 1', 'Wrong 2', 'Wrong 3'],
                  order: i + 1,
                  quizId: testQuizId,
                },
              })
            )
          );

          // Create a perfect quiz attempt
          const attempt = await prisma.quizAttempt.create({
            data: {
              quizId: testQuizId,
              userId: testUserId,
              completedAt: new Date(),
              score: numQuestions * 10,
              isPerfect: true,
            },
          });

          // Create all correct answers
          await Promise.all(
            questions.map((q) =>
              prisma.userAnswer.create({
                data: {
                  questionId: q.id,
                  userId: testUserId,
                  attemptId: attempt.id,
                  answer: 0,
                  isCorrect: true,
                },
              })
            )
          );

          // Create or update leaderboard entry
          await prisma.leaderboardEntry.upsert({
            where: { userId: testUserId },
            create: {
              userId: testUserId,
              score: numQuestions * 10,
              quizCount: 1,
              correctAnswers: numQuestions,
              totalAnswers: numQuestions,
            },
            update: {
              score: numQuestions * 10,
              quizCount: 1,
              correctAnswers: numQuestions,
              totalAnswers: numQuestions,
            },
          });

          // Check achievements
          const result = await checkAchievements(testUserId);

          // Verify perfect_quiz achievement was awarded
          const userAchievement = await prisma.userAchievement.findFirst({
            where: {
              userId: testUserId,
              achievementId: perfectQuizAchievementId,
            },
          });

          expect(userAchievement).toBeTruthy();
          expect(result.newAchievements.some((a) => a.id === perfectQuizAchievementId)).toBe(true);

          // Cleanup questions for next iteration
          await prisma.userAnswer.deleteMany({
            where: { attemptId: attempt.id },
          });
          await prisma.quizAttempt.delete({
            where: { id: attempt.id },
          });
          await prisma.question.deleteMany({
            where: { id: { in: questions.map((q) => q.id) } },
          });
        }
      ),
      { numRuns: 3 }
    );
  }, 60000);

  // Property 17: Achievement unlocking - ten quizzes
  test('completing ten quizzes awards ten_quizzes achievement', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 10, max: 15 }), // Quiz count >= 10
        async (quizCount) => {
          // Clean up before this iteration
          await prisma.userAchievement.deleteMany({
            where: { userId: testUserId },
          });
          await prisma.leaderboardEntry.deleteMany({
            where: { userId: testUserId },
          });

          // Create or update leaderboard entry with quizCount >= 10
          await prisma.leaderboardEntry.upsert({
            where: { userId: testUserId },
            create: {
              userId: testUserId,
              score: quizCount * 10,
              quizCount: quizCount,
              correctAnswers: quizCount * 5,
              totalAnswers: quizCount * 5,
            },
            update: {
              score: quizCount * 10,
              quizCount: quizCount,
              correctAnswers: quizCount * 5,
              totalAnswers: quizCount * 5,
            },
          });

          // Check achievements
          const result = await checkAchievements(testUserId);

          // Verify ten_quizzes achievement was awarded
          const userAchievement = await prisma.userAchievement.findFirst({
            where: {
              userId: testUserId,
              achievementId: tenQuizzesAchievementId,
            },
          });

          expect(userAchievement).toBeTruthy();
          expect(result.newAchievements.some((a) => a.id === tenQuizzesAchievementId)).toBe(true);
        }
      ),
      { numRuns: 3 }
    );
  }, 30000);

  // Additional test: Achievements are not awarded twice
  test('achievements are not awarded twice to the same user', async () => {
    // Create or update leaderboard entry with quizCount = 1
    await prisma.leaderboardEntry.upsert({
      where: { userId: testUserId },
      create: {
        userId: testUserId,
        score: 10,
        quizCount: 1,
        correctAnswers: 1,
        totalAnswers: 1,
      },
      update: {
        score: 10,
        quizCount: 1,
        correctAnswers: 1,
        totalAnswers: 1,
      },
    });

    // First check - should award achievement
    const result1 = await checkAchievements(testUserId);
    expect(result1.newAchievements.length).toBeGreaterThan(0);

    // Second check - should not award again
    const result2 = await checkAchievements(testUserId);
    expect(result2.newAchievements.length).toBe(0);

    // Verify only one achievement record exists
    const achievements = await prisma.userAchievement.findMany({
      where: {
        userId: testUserId,
        achievementId: firstQuizAchievementId,
      },
    });
    expect(achievements.length).toBe(1);
  });

  // Edge case: User with no leaderboard entry
  test('checkAchievements handles user with no leaderboard entry gracefully', async () => {
    // Don't create leaderboard entry
    const result = await checkAchievements(testUserId);

    // Should return empty array without errors
    expect(result.newAchievements).toEqual([]);
  });
});
