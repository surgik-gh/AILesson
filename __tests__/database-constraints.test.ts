/**
 * Property-Based Tests for Database Constraints
 * Feature: ailesson-platform
 * 
 * Property 8: Lesson associations
 * Property 11: Quiz-Lesson one-to-one relationship
 * Validates: Requirements 3.3, 9.5, 4.4
 * 
 * NOTE: These tests require a running PostgreSQL database.
 * Ensure DATABASE_URL is set in .env and the database is accessible.
 */

import { PrismaClient } from '@prisma/client';
import * as fc from 'fast-check';
import * as bcrypt from 'bcryptjs';

// Skip tests if database is not available
let prisma: PrismaClient | null = null;
let isDatabaseAvailable = false;

try {
  if (process.env.DATABASE_URL) {
    prisma = new PrismaClient();
    isDatabaseAvailable = true;
  }
} catch (error) {
  console.warn('⚠️  Could not initialize Prisma Client. Database tests will be skipped.');
  isDatabaseAvailable = false;
}

// Helper to generate unique email
let emailCounter = 0;
const generateUniqueEmail = () => `test${Date.now()}_${emailCounter++}@test.com`;

// Arbitraries for generating test data
const userArbitrary = fc.record({
  email: fc.constant(generateUniqueEmail()),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  role: fc.constantFrom('STUDENT', 'TEACHER', 'ADMIN'),
});

const subjectArbitrary = fc.record({
  name: fc.string({ minLength: 1, maxLength: 50 }).map(s => `Subject_${Date.now()}_${s}`),
  description: fc.option(fc.string({ maxLength: 200 }), { nil: undefined }),
  icon: fc.option(fc.string({ maxLength: 10 }), { nil: undefined }),
});

const lessonArbitrary = fc.record({
  title: fc.string({ minLength: 1, maxLength: 100 }),
  content: fc.string({ minLength: 10, maxLength: 500 }),
  keyPoints: fc.array(fc.string({ minLength: 1, maxLength: 100 }), { minLength: 1, maxLength: 5 }),
  difficulty: fc.constantFrom('BEGINNER', 'INTERMEDIATE', 'ADVANCED'),
});

const questionArbitrary = fc.record({
  type: fc.constantFrom('TEXT', 'SINGLE', 'MULTIPLE'),
  text: fc.string({ minLength: 5, maxLength: 200 }),
  order: fc.integer({ min: 0, max: 100 }),
});

describe('Database Constraints - Property-Based Tests', () => {
  beforeAll(async () => {
    if (!isDatabaseAvailable || !prisma) {
      console.warn('⚠️  Database not available. Skipping database constraint tests.');
      return;
    }
    // Ensure database connection is ready
    await prisma.$connect();
  });

  afterAll(async () => {
    if (!prisma) return;
    // Clean up test data
    await prisma.userAnswer.deleteMany({});
    await prisma.quizAttempt.deleteMany({});
    await prisma.question.deleteMany({});
    await prisma.quiz.deleteMany({});
    await prisma.sentLesson.deleteMany({});
    await prisma.lesson.deleteMany({});
    await prisma.subject.deleteMany({ where: { name: { startsWith: 'Subject_' } } });
    await prisma.tokenTransaction.deleteMany({});
    await prisma.chatMessage.deleteMany({});
    await prisma.expert.deleteMany({});
    await prisma.userAchievement.deleteMany({});
    await prisma.leaderboardEntry.deleteMany({});
    await prisma.userSettings.deleteMany({});
    await prisma.user.deleteMany({ where: { email: { contains: '@test.com' } } });
    await prisma.$disconnect();
  });

  /**
   * Property 8: Lesson associations
   * For any created Lesson, it must have exactly one associated Subject (via subjectId) 
   * and exactly one creator (via creatorId).
   * Validates: Requirements 3.3, 9.5
   */
  test('Property 8: Lesson associations - every lesson has exactly one subject and one creator', async () => {
    if (!isDatabaseAvailable || !prisma) {
      console.log('⚠️  Skipping test: Database not available');
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        userArbitrary,
        subjectArbitrary,
        lessonArbitrary,
        async (userData, subjectData, lessonData) => {
          // Create user (creator)
          const hashedPassword = await bcrypt.hash('password123', 10);
          const user = await prisma!.user.create({
            data: {
              ...userData,
              password: hashedPassword,
              wisdomCoins: 100,
            },
          });

          // Create subject
          const subject = await prisma!.subject.create({
            data: subjectData,
          });

          // Create lesson
          const lesson = await prisma!.lesson.create({
            data: {
              ...lessonData,
              subjectId: subject.id,
              creatorId: user.id,
            },
          });

          // Verify lesson has exactly one subject
          const lessonWithSubject = await prisma!.lesson.findUnique({
            where: { id: lesson.id },
            include: { subject: true, creator: true },
          });

          // Assertions
          expect(lessonWithSubject).not.toBeNull();
          expect(lessonWithSubject!.subjectId).toBe(subject.id);
          expect(lessonWithSubject!.subject.id).toBe(subject.id);
          expect(lessonWithSubject!.creatorId).toBe(user.id);
          expect(lessonWithSubject!.creator.id).toBe(user.id);

          // Clean up
          await prisma!.lesson.delete({ where: { id: lesson.id } });
          await prisma!.subject.delete({ where: { id: subject.id } });
          await prisma!.user.delete({ where: { id: user.id } });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 11: Quiz-Lesson one-to-one relationship
   * For any Quiz in the system, it must reference exactly one Lesson, 
   * and that Lesson must not be referenced by any other Quiz.
   * Validates: Requirements 4.4
   */
  test('Property 11: Quiz-Lesson one-to-one relationship - each quiz references exactly one lesson uniquely', async () => {
    if (!isDatabaseAvailable || !prisma) {
      console.log('⚠️  Skipping test: Database not available');
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        userArbitrary,
        subjectArbitrary,
        lessonArbitrary,
        fc.array(questionArbitrary, { minLength: 1, maxLength: 5 }),
        async (userData, subjectData, lessonData, questionsData) => {
          // Create user
          const hashedPassword = await bcrypt.hash('password123', 10);
          const user = await prisma!.user.create({
            data: {
              ...userData,
              password: hashedPassword,
              wisdomCoins: 100,
            },
          });

          // Create subject
          const subject = await prisma!.subject.create({
            data: subjectData,
          });

          // Create lesson
          const lesson = await prisma!.lesson.create({
            data: {
              ...lessonData,
              subjectId: subject.id,
              creatorId: user.id,
            },
          });

          // Create quiz linked to lesson
          const quiz = await prisma!.quiz.create({
            data: {
              lessonId: lesson.id,
              questions: {
                create: questionsData.map((q) => ({
                  ...q,
                  correctAnswer: q.type === 'TEXT' ? 'Sample answer' : ['Option 1'],
                  options: q.type !== 'TEXT' ? ['Option 1', 'Option 2', 'Option 3', 'Option 4'] : null,
                })),
              },
            },
            include: {
              lesson: true,
              questions: true,
            },
          });

          // Verify quiz references exactly one lesson
          expect(quiz.lessonId).toBe(lesson.id);
          expect(quiz.lesson.id).toBe(lesson.id);

          // Verify lesson has exactly one quiz (one-to-one relationship)
          const lessonWithQuiz = await prisma!.lesson.findUnique({
            where: { id: lesson.id },
            include: { quiz: true },
          });

          expect(lessonWithQuiz!.quiz).not.toBeNull();
          expect(lessonWithQuiz!.quiz!.id).toBe(quiz.id);

          // Verify we cannot create another quiz for the same lesson (unique constraint)
          await expect(
            prisma!.quiz.create({
              data: {
                lessonId: lesson.id,
              },
            })
          ).rejects.toThrow();

          // Clean up
          await prisma!.question.deleteMany({ where: { quizId: quiz.id } });
          await prisma!.quiz.delete({ where: { id: quiz.id } });
          await prisma!.lesson.delete({ where: { id: lesson.id } });
          await prisma!.subject.delete({ where: { id: subject.id } });
          await prisma!.user.delete({ where: { id: user.id } });
        }
      ),
      { numRuns: 100 }
    );
  });
});
