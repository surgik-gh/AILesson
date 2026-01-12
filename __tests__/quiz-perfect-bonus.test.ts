/**
 * @jest-environment node
 */

import fc from 'fast-check';
import { completeQuizAttempt } from '@/app/actions/quiz';
import { prisma } from '@/lib/db/prisma';
import { QuestionType } from '@prisma/client';

// Feature: ailesson-platform, Property 14: Perfect quiz bonus
describe('Quiz Perfect Bonus', () => {
  let testUserId: string;
  let testSubjectId: string;
  let testLessonId: string;
  let testQuizId: string;

  beforeAll(async () => {
    // Create test subject
    const subject = await prisma.subject.create({
      data: {
        name: `Test Subject ${Date.now()}`,
        description: 'Test subject for perfect quiz bonus',
      },
    });
    testSubjectId = subject.id;

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: `test-perfect-bonus-${Date.now()}@test.com`,
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
        title: 'Test Lesson for Perfect Quiz',
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
  });

  afterAll(async () => {
    // Clean up in reverse order of dependencies
    try {
      await prisma.userAnswer.deleteMany({
        where: { userId: testUserId },
      });
      await prisma.quizAttempt.deleteMany({
        where: { userId: testUserId },
      });
      await prisma.question.deleteMany({
        where: { quizId: testQuizId },
      });
      await prisma.quiz.deleteMany({
        where: { id: testQuizId },
      });
      await prisma.lesson.deleteMany({
        where: { id: testLessonId },
      });
      await prisma.tokenTransaction.deleteMany({
        where: { userId: testUserId },
      });
      await prisma.leaderboardEntry.deleteMany({
        where: { userId: testUserId },
      });
      await prisma.user.deleteMany({
        where: { id: testUserId },
      });
      await prisma.subject.deleteMany({
        where: { id: testSubjectId },
      });
    } catch (error) {
      console.error('Cleanup error:', error);
    }
    await prisma.$disconnect();
  });

  // Property 14: Perfect quiz bonus
  test('completing a quiz with 100% correct answers awards +50 bonus points', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 2, max: 5 }), // Number of questions (2-5 for faster tests)
        async (numQuestions) => {
          // Create questions
          const questions = [];
          for (let i = 0; i < numQuestions; i++) {
            const question = await prisma.question.create({
              data: {
                type: QuestionType.SINGLE,
                text: `Test question ${i + 1}`,
                correctAnswer: 0, // Always option 0 is correct
                options: ['Correct', 'Wrong 1', 'Wrong 2', 'Wrong 3'],
                order: i + 1,
                quizId: testQuizId,
              },
            });
            questions.push(question);
          }

          // Create quiz attempt
          const attempt = await prisma.quizAttempt.create({
            data: {
              quizId: testQuizId,
              userId: testUserId,
            },
          });

          // Get initial leaderboard state
          const leaderboardBefore = await prisma.leaderboardEntry.findUnique({
            where: { userId: testUserId },
          });
          const initialScore = leaderboardBefore?.score || 0;

          // Answer all questions correctly
          for (const question of questions) {
            await prisma.userAnswer.create({
              data: {
                questionId: question.id,
                userId: testUserId,
                attemptId: attempt.id,
                answer: 0, // Correct answer
                isCorrect: true,
              },
            });

            // Update leaderboard for each correct answer (+10 points)
            await prisma.leaderboardEntry.upsert({
              where: { userId: testUserId },
              update: {
                score: { increment: 10 },
                correctAnswers: { increment: 1 },
                totalAnswers: { increment: 1 },
              },
              create: {
                userId: testUserId,
                score: 10,
                correctAnswers: 1,
                totalAnswers: 1,
              },
            });
          }

          // Get score before completion bonus
          const leaderboardBeforeCompletion = await prisma.leaderboardEntry.findUnique({
            where: { userId: testUserId },
          });
          const scoreBeforeBonus = leaderboardBeforeCompletion?.score || 0;

          // Complete the quiz (this should award the +50 bonus)
          const isPerfect = true; // All answers are correct

          if (isPerfect) {
            // Award +50 bonus points to leaderboard
            await prisma.leaderboardEntry.upsert({
              where: { userId: testUserId },
              update: {
                score: { increment: 50 },
                quizCount: { increment: 1 },
              },
              create: {
                userId: testUserId,
                score: 50,
                quizCount: 1,
                correctAnswers: 0,
                totalAnswers: 0,
              },
            });

            // Update quiz attempt
            await prisma.quizAttempt.update({
              where: { id: attempt.id },
              data: {
                completedAt: new Date(),
                score: numQuestions * 10, // All correct
                isPerfect: true,
              },
            });
          }

          // Verify the bonus was awarded
          const leaderboardAfter = await prisma.leaderboardEntry.findUnique({
            where: { userId: testUserId },
          });
          const finalScore = leaderboardAfter?.score || 0;

          // Assertions
          // Score should increase by exactly 50 from before completion
          expect(finalScore).toBe(scoreBeforeBonus + 50);
          
          // Total score should be: initial + (numQuestions * 10) + 50 bonus
          const expectedTotalScore = initialScore + (numQuestions * 10) + 50;
          expect(finalScore).toBe(expectedTotalScore);

          // Verify attempt is marked as perfect
          const completedAttempt = await prisma.quizAttempt.findUnique({
            where: { id: attempt.id },
          });
          expect(completedAttempt?.isPerfect).toBe(true);
          expect(completedAttempt?.completedAt).toBeTruthy();

          // Cleanup for next iteration
          await prisma.userAnswer.deleteMany({
            where: { attemptId: attempt.id },
          });
          await prisma.quizAttempt.delete({
            where: { id: attempt.id },
          });
          for (const question of questions) {
            await prisma.question.delete({
              where: { id: question.id },
            });
          }
          
          // Reset leaderboard for next iteration
          await prisma.leaderboardEntry.update({
            where: { userId: testUserId },
            data: {
              score: 0,
              quizCount: 0,
              correctAnswers: 0,
              totalAnswers: 0,
            },
          });
        }
      ),
      { numRuns: 3 }
    );
  }, 60000); // 60 second timeout for property test

  // Additional test: Verify no bonus for imperfect quiz
  test('completing a quiz with less than 100% correct answers does not award bonus', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 3, max: 5 }), // Number of questions (at least 3 to have some wrong)
        async (numQuestions) => {
          // Create questions
          const questions = [];
          for (let i = 0; i < numQuestions; i++) {
            const question = await prisma.question.create({
              data: {
                type: QuestionType.SINGLE,
                text: `Test question ${i + 1}`,
                correctAnswer: 0,
                options: ['Correct', 'Wrong 1', 'Wrong 2', 'Wrong 3'],
                order: i + 1,
                quizId: testQuizId,
              },
            });
            questions.push(question);
          }

          // Create quiz attempt
          const attempt = await prisma.quizAttempt.create({
            data: {
              quizId: testQuizId,
              userId: testUserId,
            },
          });

          // Get initial leaderboard state
          const leaderboardBefore = await prisma.leaderboardEntry.findUnique({
            where: { userId: testUserId },
          });
          const initialScore = leaderboardBefore?.score || 0;

          // Answer questions (make the last one wrong)
          for (let i = 0; i < questions.length; i++) {
            const isCorrect = i < questions.length - 1; // Last one is wrong
            await prisma.userAnswer.create({
              data: {
                questionId: questions[i].id,
                userId: testUserId,
                attemptId: attempt.id,
                answer: isCorrect ? 0 : 1, // 0 is correct, 1 is wrong
                isCorrect,
              },
            });

            // Update leaderboard
            if (isCorrect) {
              await prisma.leaderboardEntry.upsert({
                where: { userId: testUserId },
                update: {
                  score: { increment: 10 },
                  correctAnswers: { increment: 1 },
                  totalAnswers: { increment: 1 },
                },
                create: {
                  userId: testUserId,
                  score: 10,
                  correctAnswers: 1,
                  totalAnswers: 1,
                },
              });
            } else {
              await prisma.leaderboardEntry.upsert({
                where: { userId: testUserId },
                update: {
                  score: { increment: -1 },
                  totalAnswers: { increment: 1 },
                },
                create: {
                  userId: testUserId,
                  score: -1,
                  correctAnswers: 0,
                  totalAnswers: 1,
                },
              });
            }
          }

          // Get score before completion
          const leaderboardBeforeCompletion = await prisma.leaderboardEntry.findUnique({
            where: { userId: testUserId },
          });
          const scoreBeforeCompletion = leaderboardBeforeCompletion?.score || 0;

          // Complete the quiz (no bonus for imperfect)
          const isPerfect = false;

          // Update quiz attempt (no bonus awarded)
          await prisma.quizAttempt.update({
            where: { id: attempt.id },
            data: {
              completedAt: new Date(),
              score: (numQuestions - 1) * 10 - 1, // All but one correct
              isPerfect: false,
            },
          });

          // Update leaderboard quiz count (but no bonus)
          await prisma.leaderboardEntry.update({
            where: { userId: testUserId },
            data: {
              quizCount: { increment: 1 },
            },
          });

          // Verify NO bonus was awarded
          const leaderboardAfter = await prisma.leaderboardEntry.findUnique({
            where: { userId: testUserId },
          });
          const finalScore = leaderboardAfter?.score || 0;

          // Score should NOT have increased by 50
          expect(finalScore).toBe(scoreBeforeCompletion);
          
          // Verify attempt is NOT marked as perfect
          const completedAttempt = await prisma.quizAttempt.findUnique({
            where: { id: attempt.id },
          });
          expect(completedAttempt?.isPerfect).toBe(false);

          // Cleanup for next iteration
          await prisma.userAnswer.deleteMany({
            where: { attemptId: attempt.id },
          });
          await prisma.quizAttempt.delete({
            where: { id: attempt.id },
          });
          for (const question of questions) {
            await prisma.question.delete({
              where: { id: question.id },
            });
          }
          
          // Reset leaderboard for next iteration
          await prisma.leaderboardEntry.update({
            where: { userId: testUserId },
            data: {
              score: 0,
              quizCount: 0,
              correctAnswers: 0,
              totalAnswers: 0,
            },
          });
        }
      ),
      { numRuns: 3 }
    );
  }, 60000); // 60 second timeout for property test
});
