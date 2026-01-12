/**
 * Unit Tests for Subject Deletion with Lessons
 * Feature: ailesson-platform
 * 
 * Tests cascade behavior or error handling when deleting subjects with associated lessons.
 * Validates: Requirements 9.3
 * 
 * NOTE: These tests require a running PostgreSQL database.
 * Ensure DATABASE_URL is set in .env and the database is accessible.
 */

import { PrismaClient } from '@prisma/client';
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

describe('Subject Deletion with Lessons - Unit Tests', () => {
  beforeAll(async () => {
    if (!isDatabaseAvailable || !prisma) {
      console.warn('⚠️  Database not available. Skipping subject deletion tests.');
      return;
    }
    await prisma.$connect();
  });

  afterAll(async () => {
    if (!prisma) return;
    // Clean up test data
    await prisma.lesson.deleteMany({ where: { title: { startsWith: 'Test Lesson' } } });
    await prisma.subject.deleteMany({ where: { name: { startsWith: 'Test Subject' } } });
    await prisma.user.deleteMany({ where: { email: { contains: 'deletion-test' } } });
    await prisma.$disconnect();
  });

  /**
   * Test: Cannot delete subject with associated lessons
   * Validates: Requirements 9.3
   */
  test('should prevent deletion of subject with associated lessons', async () => {
    if (!isDatabaseAvailable || !prisma) {
      console.log('⚠️  Skipping test: Database not available');
      return;
    }

    // Create a test user
    const hashedPassword = await bcrypt.hash('password123', 10);
    const user = await prisma.user.create({
      data: {
        email: `deletion-test-${Date.now()}@test.com`,
        name: 'Test User',
        password: hashedPassword,
        role: 'TEACHER',
        wisdomCoins: 100,
      },
    });

    // Create a test subject
    const subject = await prisma.subject.create({
      data: {
        name: `Test Subject ${Date.now()}`,
        description: 'Subject for deletion test',
        icon: '📚',
      },
    });

    // Create a lesson associated with the subject
    const lesson = await prisma.lesson.create({
      data: {
        title: `Test Lesson ${Date.now()}`,
        content: 'Test content for deletion test',
        keyPoints: ['Point 1', 'Point 2'],
        difficulty: 'BEGINNER',
        subjectId: subject.id,
        creatorId: user.id,
      },
    });

    // Attempt to delete the subject should fail due to foreign key constraint
    await expect(
      prisma.subject.delete({
        where: { id: subject.id },
      })
    ).rejects.toThrow();

    // Verify subject still exists
    const subjectStillExists = await prisma.subject.findUnique({
      where: { id: subject.id },
    });
    expect(subjectStillExists).not.toBeNull();

    // Clean up: delete lesson first, then subject
    await prisma.lesson.delete({ where: { id: lesson.id } });
    await prisma.subject.delete({ where: { id: subject.id } });
    await prisma.user.delete({ where: { id: user.id } });
  });

  /**
   * Test: Can delete subject without associated lessons
   * Validates: Requirements 9.3
   */
  test('should allow deletion of subject without associated lessons', async () => {
    if (!isDatabaseAvailable || !prisma) {
      console.log('⚠️  Skipping test: Database not available');
      return;
    }

    // Create a test subject
    const subject = await prisma.subject.create({
      data: {
        name: `Test Subject Empty ${Date.now()}`,
        description: 'Subject without lessons',
        icon: '📖',
      },
    });

    // Delete the subject (should succeed)
    await prisma.subject.delete({
      where: { id: subject.id },
    });

    // Verify subject was deleted
    const subjectDeleted = await prisma.subject.findUnique({
      where: { id: subject.id },
    });
    expect(subjectDeleted).toBeNull();
  });

  /**
   * Test: Check lesson count before deletion
   * Validates: Requirements 9.3
   */
  test('should correctly count associated lessons before deletion', async () => {
    if (!isDatabaseAvailable || !prisma) {
      console.log('⚠️  Skipping test: Database not available');
      return;
    }

    // Create a test user
    const hashedPassword = await bcrypt.hash('password123', 10);
    const user = await prisma.user.create({
      data: {
        email: `deletion-count-test-${Date.now()}@test.com`,
        name: 'Test User',
        password: hashedPassword,
        role: 'TEACHER',
        wisdomCoins: 100,
      },
    });

    // Create a test subject
    const subject = await prisma.subject.create({
      data: {
        name: `Test Subject Count ${Date.now()}`,
        description: 'Subject for count test',
        icon: '🔢',
      },
    });

    // Create multiple lessons
    const lesson1 = await prisma.lesson.create({
      data: {
        title: `Test Lesson 1 ${Date.now()}`,
        content: 'Content 1',
        keyPoints: ['Point 1'],
        difficulty: 'BEGINNER',
        subjectId: subject.id,
        creatorId: user.id,
      },
    });

    const lesson2 = await prisma.lesson.create({
      data: {
        title: `Test Lesson 2 ${Date.now()}`,
        content: 'Content 2',
        keyPoints: ['Point 2'],
        difficulty: 'INTERMEDIATE',
        subjectId: subject.id,
        creatorId: user.id,
      },
    });

    // Check lesson count
    const subjectWithCount = await prisma.subject.findUnique({
      where: { id: subject.id },
      include: {
        _count: {
          select: { lessons: true },
        },
      },
    });

    expect(subjectWithCount).not.toBeNull();
    expect(subjectWithCount!._count.lessons).toBe(2);

    // Clean up
    await prisma.lesson.delete({ where: { id: lesson1.id } });
    await prisma.lesson.delete({ where: { id: lesson2.id } });
    await prisma.subject.delete({ where: { id: subject.id } });
    await prisma.user.delete({ where: { id: user.id } });
  });

  /**
   * Test: Cascade deletion after removing all lessons
   * Validates: Requirements 9.3
   */
  test('should allow deletion after all associated lessons are removed', async () => {
    if (!isDatabaseAvailable || !prisma) {
      console.log('⚠️  Skipping test: Database not available');
      return;
    }

    // Create a test user
    const hashedPassword = await bcrypt.hash('password123', 10);
    const user = await prisma.user.create({
      data: {
        email: `deletion-cascade-test-${Date.now()}@test.com`,
        name: 'Test User',
        password: hashedPassword,
        role: 'TEACHER',
        wisdomCoins: 100,
      },
    });

    // Create a test subject
    const subject = await prisma.subject.create({
      data: {
        name: `Test Subject Cascade ${Date.now()}`,
        description: 'Subject for cascade test',
        icon: '🔗',
      },
    });

    // Create a lesson
    const lesson = await prisma.lesson.create({
      data: {
        title: `Test Lesson Cascade ${Date.now()}`,
        content: 'Content for cascade',
        keyPoints: ['Point'],
        difficulty: 'BEGINNER',
        subjectId: subject.id,
        creatorId: user.id,
      },
    });

    // Verify subject has lessons
    const subjectWithLessons = await prisma.subject.findUnique({
      where: { id: subject.id },
      include: { _count: { select: { lessons: true } } },
    });
    expect(subjectWithLessons!._count.lessons).toBe(1);

    // Delete the lesson
    await prisma.lesson.delete({ where: { id: lesson.id } });

    // Now deletion should succeed
    await prisma.subject.delete({ where: { id: subject.id } });

    // Verify subject was deleted
    const subjectDeleted = await prisma.subject.findUnique({
      where: { id: subject.id },
    });
    expect(subjectDeleted).toBeNull();

    // Clean up user
    await prisma.user.delete({ where: { id: user.id } });
  });
});
