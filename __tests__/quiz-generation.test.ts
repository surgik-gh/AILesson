/**
 * Property-Based Tests for Quiz Generation
 * Feature: ailesson-platform
 * 
 * Property 9: Question type validation
 * Property 10: Question structure completeness
 * Validates: Requirements 4.2, 4.3
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
  role: fc.constantFrom('TEACHER', 'ADMIN'),
});

const subjectArbitrary = fc.record({
  name: fc.string({ minLength: 1, maxLength: 50 }).map(s => `Subject_${Date.now()}_${s}`),
  description: fc.option(fc.string({ maxLength: 200 }), { nil: undefined }),
});

const lessonArbitrary = fc.record({
  title: fc.string({ minLength: 1, maxLength: 100 }),
  content: fc.string({ minLength: 10, maxLength: 500 }),
  keyPoints: fc.array(fc.string({ minLength: 1, maxLength: 100 }), { minLength: 1, maxLength: 5 }),
  difficulty: fc.constantFrom('BEGINNER', 'INTERMEDIATE', 'ADVANCED'),
});

// Arbitrary for generating valid questions
const textQuestionArbitrary = fc.record({
  type: fc.constant('TEXT' as const),
  text: fc.string({ minLength: 5, maxLength: 200 }),
  correctAnswer: fc.string({ minLength: 1, maxLength: 100 }),
  order: fc.integer({ min: 1, max: 10 }),
});

const singleQuestionArbitrary = fc.record({
  type: fc.constant('SINGLE' as const),
  text: fc.string({ minLength: 5, maxLength: 200 }),
  options: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 2, maxLength: 6 }),
  order: fc.integer({ min: 1, max: 10 }),
}).map(q => ({
  ...q,
  correctAnswer: q.options[0], // First option is correct
}));

const multipleQuestionArbitrary = fc.record({
  type: fc.constant('MULTIPLE' as const),
  text: fc.string({ minLength: 5, maxLength: 200 }),
  options: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 3, maxLength: 6 }),
  order: fc.integer({ min: 1, max: 10 }),
}).map(q => ({
  ...q,
  correctAnswer: [q.options[0], q.options[1]], // First two options are correct
}));

const questionArbitrary = fc.oneof(
  textQuestionArbitrary,
  singleQuestionArbitrary,
  multipleQuestionArbitrary
);

describe('Quiz Generation - Property-Based Tests', () => {
  beforeAll(async () => {
    if (!isDatabaseAvailable || !prisma) {
      console.warn('⚠️  Database not available. Skipping quiz generation tests.');
      return;
    }
    await prisma.$connect();
  });

  afterAll(async () => {
    if (!prisma) return;
    // Clean up test data
    await prisma.userAnswer.deleteMany({});
    await prisma.quizAttempt.deleteMany({});
    await prisma.question.deleteMany({});
    await prisma.quiz.deleteMany({});
    await prisma.lesson.deleteMany({});
    await prisma.subject.deleteMany({ where: { name: { startsWith: 'Subject_' } } });
    await prisma.tokenTransaction.deleteMany({});
    await prisma.expert.deleteMany({});
    await prisma.user.deleteMany({ where: { email: { contains: '@test.com' } } });
    await prisma.$disconnect();
  });

  /**
   * Property 9: Question type validation
   * For any Question in the system, its type field must be one of: TEXT, SINGLE, or MULTIPLE.
   * Validates: Requirements 4.2
   */
  test('Property 9: Question type validation - all questions have valid types', async () => {
    if (!isDatabaseAvailable || !prisma) {
      console.log('⚠️  Skipping test: Database not available');
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        userArbitrary,
        subjectArbitrary,
        lessonArbitrary,
        fc.array(questionArbitrary, { minLength: 5, maxLength: 10 }),
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

          // Create quiz with questions
          const quiz = await prisma!.quiz.create({
            data: {
              lessonId: lesson.id,
              questions: {
                create: questionsData.map((q) => ({
                  type: q.type,
                  text: q.text,
                  correctAnswer: q.correctAnswer,
                  options: 'options' in q ? q.options : null,
                  order: q.order,
                })),
              },
            },
            include: {
              questions: true,
            },
          });

          // Verify all questions have valid types
          const validTypes = ['TEXT', 'SINGLE', 'MULTIPLE'];
          quiz.questions.forEach((question) => {
            expect(validTypes).toContain(question.type);
            expect(['TEXT', 'SINGLE', 'MULTIPLE']).toContain(question.type);
          });

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

  /**
   * Property 10: Question structure completeness
   * For any Question, it must have a text field (non-empty), a correctAnswer field (valid JSON), 
   * and if type is SINGLE or MULTIPLE, it must have an options field (valid JSON array).
   * Validates: Requirements 4.3
   */
  test('Property 10: Question structure completeness - all questions have required fields', async () => {
    if (!isDatabaseAvailable || !prisma) {
      console.log('⚠️  Skipping test: Database not available');
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        userArbitrary,
        subjectArbitrary,
        lessonArbitrary,
        fc.array(questionArbitrary, { minLength: 5, maxLength: 10 }),
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

          // Create quiz with questions
          const quiz = await prisma!.quiz.create({
            data: {
              lessonId: lesson.id,
              questions: {
                create: questionsData.map((q) => ({
                  type: q.type,
                  text: q.text,
                  correctAnswer: q.correctAnswer,
                  options: 'options' in q ? q.options : null,
                  order: q.order,
                })),
              },
            },
            include: {
              questions: true,
            },
          });

          // Verify all questions have required fields
          quiz.questions.forEach((question) => {
            // All questions must have text (non-empty)
            expect(question.text).toBeTruthy();
            expect(typeof question.text).toBe('string');
            expect(question.text.length).toBeGreaterThan(0);

            // All questions must have correctAnswer
            expect(question.correctAnswer).toBeDefined();
            expect(question.correctAnswer).not.toBeNull();

            // SINGLE and MULTIPLE types must have options
            if (question.type === 'SINGLE' || question.type === 'MULTIPLE') {
              expect(question.options).toBeDefined();
              expect(question.options).not.toBeNull();
              expect(Array.isArray(question.options)).toBe(true);
              expect((question.options as any[]).length).toBeGreaterThanOrEqual(2);
            }

            // TEXT type should not have options (or can be null)
            if (question.type === 'TEXT') {
              // Options can be null or undefined for TEXT type
              if (question.options !== null && question.options !== undefined) {
                // If options exist for TEXT, they should still be valid
                expect(Array.isArray(question.options)).toBe(true);
              }
            }
          });

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
