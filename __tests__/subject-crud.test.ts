/**
 * Property-Based Tests for Subject CRUD Operations
 * Feature: ailesson-platform
 * 
 * Property 25: Subject CRUD operations
 * Validates: Requirements 9.1, 9.2
 * 
 * NOTE: These tests require a running PostgreSQL database.
 * Ensure DATABASE_URL is set in .env and the database is accessible.
 */

import { PrismaClient } from '@prisma/client';
import * as fc from 'fast-check';

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

// Arbitraries for generating test data
const subjectArbitrary = fc.record({
  name: fc.string({ minLength: 1, maxLength: 50 }).map(s => `TestSubject_${Date.now()}_${s.replace(/[^a-zA-Z0-9]/g, '_')}`),
  description: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: undefined }),
  icon: fc.option(fc.string({ minLength: 1, maxLength: 10 }), { nil: undefined }),
});

const subjectUpdateArbitrary = fc.record({
  name: fc.string({ minLength: 1, maxLength: 50 }).map(s => `UpdatedSubject_${Date.now()}_${s.replace(/[^a-zA-Z0-9]/g, '_')}`),
  description: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: undefined }),
  icon: fc.option(fc.string({ minLength: 1, maxLength: 10 }), { nil: undefined }),
});

describe('Subject CRUD Operations - Property-Based Tests', () => {
  beforeAll(async () => {
    if (!isDatabaseAvailable || !prisma) {
      console.warn('⚠️  Database not available. Skipping subject CRUD tests.');
      return;
    }
    // Ensure database connection is ready
    await prisma.$connect();
  });

  afterAll(async () => {
    if (!prisma) return;
    // Clean up test data
    await prisma.subject.deleteMany({ 
      where: { 
        OR: [
          { name: { startsWith: 'TestSubject_' } },
          { name: { startsWith: 'UpdatedSubject_' } }
        ]
      } 
    });
    await prisma.$disconnect();
  });

  /**
   * Property 25: Subject CRUD operations
   * For any Admin creating, updating, or deleting a Subject, the operation should succeed 
   * and the database should reflect the changes appropriately.
   * Validates: Requirements 9.1, 9.2
   */
  test('Property 25: Subject CRUD operations - create, read, update, delete operations work correctly', async () => {
    if (!isDatabaseAvailable || !prisma) {
      console.log('⚠️  Skipping test: Database not available');
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        subjectArbitrary,
        subjectUpdateArbitrary,
        async (createData, updateData) => {
          // CREATE: Create a new subject
          const createdSubject = await prisma!.subject.create({
            data: {
              name: createData.name,
              description: createData.description || null,
              icon: createData.icon || null,
            },
          });

          // Verify creation
          expect(createdSubject).toBeDefined();
          expect(createdSubject.id).toBeDefined();
          expect(createdSubject.name).toBe(createData.name);
          expect(createdSubject.description).toBe(createData.description || null);
          expect(createdSubject.icon).toBe(createData.icon || null);

          // READ: Retrieve the created subject
          const retrievedSubject = await prisma!.subject.findUnique({
            where: { id: createdSubject.id },
          });

          expect(retrievedSubject).not.toBeNull();
          expect(retrievedSubject!.id).toBe(createdSubject.id);
          expect(retrievedSubject!.name).toBe(createData.name);

          // UPDATE: Update the subject
          const updatedSubject = await prisma!.subject.update({
            where: { id: createdSubject.id },
            data: {
              name: updateData.name,
              description: updateData.description || null,
              icon: updateData.icon || null,
            },
          });

          // Verify update
          expect(updatedSubject.id).toBe(createdSubject.id);
          expect(updatedSubject.name).toBe(updateData.name);
          expect(updatedSubject.description).toBe(updateData.description || null);
          expect(updatedSubject.icon).toBe(updateData.icon || null);

          // READ after UPDATE: Verify changes persisted
          const retrievedAfterUpdate = await prisma!.subject.findUnique({
            where: { id: createdSubject.id },
          });

          expect(retrievedAfterUpdate).not.toBeNull();
          expect(retrievedAfterUpdate!.name).toBe(updateData.name);
          expect(retrievedAfterUpdate!.description).toBe(updateData.description || null);
          expect(retrievedAfterUpdate!.icon).toBe(updateData.icon || null);

          // DELETE: Delete the subject
          await prisma!.subject.delete({
            where: { id: createdSubject.id },
          });

          // Verify deletion
          const retrievedAfterDelete = await prisma!.subject.findUnique({
            where: { id: createdSubject.id },
          });

          expect(retrievedAfterDelete).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property test: Subject name uniqueness
   * For any two subjects with the same name, the second creation should fail.
   */
  test('Property 25 (uniqueness): Subject names must be unique', async () => {
    if (!isDatabaseAvailable || !prisma) {
      console.log('⚠️  Skipping test: Database not available');
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        subjectArbitrary,
        async (subjectData) => {
          // Create first subject
          const subject1 = await prisma!.subject.create({
            data: {
              name: subjectData.name,
              description: subjectData.description || null,
              icon: subjectData.icon || null,
            },
          });

          // Attempt to create second subject with same name should fail
          await expect(
            prisma!.subject.create({
              data: {
                name: subjectData.name,
                description: 'Different description',
                icon: '🔥',
              },
            })
          ).rejects.toThrow();

          // Clean up
          await prisma!.subject.delete({ where: { id: subject1.id } });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property test: Subject list retrieval
   * For any set of created subjects, they should all be retrievable via findMany.
   */
  test('Property 25 (list): All created subjects can be retrieved', async () => {
    if (!isDatabaseAvailable || !prisma) {
      console.log('⚠️  Skipping test: Database not available');
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        fc.array(subjectArbitrary, { minLength: 1, maxLength: 5 }),
        async (subjectsData) => {
          // Create multiple subjects
          const createdSubjects = await Promise.all(
            subjectsData.map((data) =>
              prisma!.subject.create({
                data: {
                  name: data.name,
                  description: data.description || null,
                  icon: data.icon || null,
                },
              })
            )
          );

          // Retrieve all subjects
          const allSubjects = await prisma!.subject.findMany({
            where: {
              id: { in: createdSubjects.map((s) => s.id) },
            },
          });

          // Verify all created subjects are in the list
          expect(allSubjects.length).toBe(createdSubjects.length);
          
          const createdIds = new Set(createdSubjects.map((s) => s.id));
          allSubjects.forEach((subject) => {
            expect(createdIds.has(subject.id)).toBe(true);
          });

          // Clean up
          await prisma!.subject.deleteMany({
            where: {
              id: { in: createdSubjects.map((s) => s.id) },
            },
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
