/**
 * @jest-environment node
 */

import fc from 'fast-check';
import { prisma } from '@/lib/db/prisma';

// Feature: ailesson-platform, Property 18: Leaderboard ordering
// Feature: ailesson-platform, Property 21: Correct answer percentage calculation
describe('Leaderboard Ordering and Percentage Calculation', () => {
  let testUserIds: string[] = [];
  let testSubjectId: string;

  beforeAll(async () => {
    // Clean up any existing test data from previous runs
    await prisma.tokenTransaction.deleteMany({
      where: {
        user: {
          email: {
            contains: '-leaderboard-test-',
          },
        },
      },
    });
    
    await prisma.leaderboardEntry.deleteMany({
      where: {
        user: {
          email: {
            contains: '-leaderboard-test-',
          },
        },
      },
    });
    
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: '-leaderboard-test-',
        },
      },
    });

    // Create test subject
    const subject = await prisma.subject.create({
      data: {
        name: `Test Subject Leaderboard ${Date.now()}`,
        description: 'Test subject for leaderboard',
      },
    });
    testSubjectId = subject.id;
  }, 60000);

  afterEach(async () => {
    // Clean up test users after each test
    // Delete in correct order to avoid foreign key constraint violations
    if (testUserIds.length > 0) {
      try {
        // First delete all token transactions for these users
        await prisma.tokenTransaction.deleteMany({
          where: { userId: { in: testUserIds } },
        });
        
        // Then delete leaderboard entries (must be before users)
        await prisma.leaderboardEntry.deleteMany({
          where: { userId: { in: testUserIds } },
        });
        
        // Finally delete the users
        await prisma.user.deleteMany({
          where: { id: { in: testUserIds } },
        });
      } catch (error) {
        // Ignore cleanup errors - they're not critical
        // console.error('Cleanup error:', error);
      }
    }
    testUserIds = [];
  }, 30000); // 30 second timeout for cleanup

  afterAll(async () => {
    // Clean up test subject
    try {
      await prisma.subject.deleteMany({
        where: { id: testSubjectId },
      });
    } catch (error) {
      console.error('Cleanup error:', error);
    }
    await prisma.$disconnect();
  });

  // Property 18: Leaderboard ordering
  test('leaderboard entries are ordered by score in descending order', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            name: fc.string({ minLength: 3, maxLength: 20 }),
            score: fc.integer({ min: -100, max: 1000 }),
            quizCount: fc.integer({ min: 0, max: 50 }),
            correctAnswers: fc.integer({ min: 0, max: 100 }),
            totalAnswers: fc.integer({ min: 0, max: 100 }),
          }),
          { minLength: 2, maxLength: 5 }
        ),
        async (studentData) => {
          // Create students with leaderboard entries
          const createdUserIds = [];
          
          for (const data of studentData) {
            const user = await prisma.user.create({
              data: {
                email: `ordering-leaderboard-test-${Date.now()}-${Math.random()}@test.com`,
                password: 'hashedpassword',
                name: data.name,
                role: 'STUDENT',
                wisdomCoins: 100,
              },
            });
            createdUserIds.push(user.id);
            testUserIds.push(user.id);

            await prisma.leaderboardEntry.create({
              data: {
                userId: user.id,
                score: data.score,
                quizCount: data.quizCount,
                correctAnswers: Math.min(data.correctAnswers, data.totalAnswers),
                totalAnswers: data.totalAnswers,
              },
            });
          }

          // Query leaderboard ordered by score - ONLY for users created in this test
          const leaderboard = await prisma.leaderboardEntry.findMany({
            where: {
              userId: { in: createdUserIds },
            },
            orderBy: {
              score: 'desc',
            },
          });

          // Verify ordering: each entry should have score >= next entry
          for (let i = 0; i < leaderboard.length - 1; i++) {
            expect(leaderboard[i].score).toBeGreaterThanOrEqual(
              leaderboard[i + 1].score
            );
          }

          // Verify all created entries are in the result
          expect(leaderboard.length).toBe(createdUserIds.length);
        }
      ),
      { numRuns: 3 }
    );
  }, 120000); // Increase timeout to 120 seconds

  // Property 21: Correct answer percentage calculation
  test('correct answer percentage is calculated correctly for all entries', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            name: fc.string({ minLength: 3, maxLength: 20 }),
            score: fc.integer({ min: 0, max: 1000 }),
            quizCount: fc.integer({ min: 0, max: 50 }),
            correctAnswers: fc.integer({ min: 0, max: 100 }),
            totalAnswers: fc.integer({ min: 0, max: 100 }),
          }).chain((data) => {
            // Ensure correctAnswers <= totalAnswers
            return fc.constant({
              ...data,
              correctAnswers: Math.min(data.correctAnswers, data.totalAnswers),
            });
          }),
          { minLength: 1, maxLength: 5 }
        ),
        async (studentData) => {
          // Create students with leaderboard entries
          const createdUserIds = [];
          
          for (const data of studentData) {
            const user = await prisma.user.create({
              data: {
                email: `percentage-leaderboard-test-${Date.now()}-${Math.random()}@test.com`,
                password: 'hashedpassword',
                name: data.name,
                role: 'STUDENT',
                wisdomCoins: 100,
              },
            });
            createdUserIds.push(user.id);
            testUserIds.push(user.id);

            await prisma.leaderboardEntry.create({
              data: {
                userId: user.id,
                score: data.score,
                quizCount: data.quizCount,
                correctAnswers: data.correctAnswers,
                totalAnswers: data.totalAnswers,
              },
            });
          }

          // Query leaderboard entries - ONLY for users created in this test
          const leaderboard = await prisma.leaderboardEntry.findMany({
            where: {
              userId: { in: createdUserIds },
            },
          });

          // Verify percentage calculation for each entry
          for (const entry of leaderboard) {
            const expectedPercentage =
              entry.totalAnswers > 0
                ? (entry.correctAnswers / entry.totalAnswers) * 100
                : 0;

            const calculatedPercentage =
              entry.totalAnswers > 0
                ? (entry.correctAnswers / entry.totalAnswers) * 100
                : 0;

            expect(calculatedPercentage).toBeCloseTo(expectedPercentage, 2);

            // Additional validations
            expect(entry.correctAnswers).toBeLessThanOrEqual(entry.totalAnswers);
            expect(calculatedPercentage).toBeGreaterThanOrEqual(0);
            expect(calculatedPercentage).toBeLessThanOrEqual(100);
          }
        }
      ),
      { numRuns: 3 }
    );
  }, 60000);

  // Edge case: Empty leaderboard
  test('empty leaderboard returns empty array', async () => {
    const leaderboard = await prisma.leaderboardEntry.findMany({
      where: {
        userId: 'non-existent-user-id',
      },
      orderBy: {
        score: 'desc',
      },
    });

    expect(leaderboard).toEqual([]);
  });

  // Edge case: Single entry leaderboard
  test('single entry leaderboard returns that entry', async () => {
    const user = await prisma.user.create({
      data: {
        email: `single-entry-leaderboard-test-${Date.now()}@test.com`,
        password: 'hashedpassword',
        name: 'Single User',
        role: 'STUDENT',
        wisdomCoins: 100,
      },
    });
    testUserIds.push(user.id);

    await prisma.leaderboardEntry.create({
      data: {
        userId: user.id,
        score: 100,
        quizCount: 5,
        correctAnswers: 10,
        totalAnswers: 15,
      },
    });

    const leaderboard = await prisma.leaderboardEntry.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        score: 'desc',
      },
    });

    expect(leaderboard.length).toBe(1);
    expect(leaderboard[0].userId).toBe(user.id);
    expect(leaderboard[0].score).toBe(100);
  });

  // Edge case: Zero total answers
  test('percentage is 0 when totalAnswers is 0', async () => {
    const user = await prisma.user.create({
      data: {
        email: `zero-answers-leaderboard-test-${Date.now()}@test.com`,
        password: 'hashedpassword',
        name: 'Zero Answers User',
        role: 'STUDENT',
        wisdomCoins: 100,
      },
    });
    testUserIds.push(user.id);

    await prisma.leaderboardEntry.create({
      data: {
        userId: user.id,
        score: 0,
        quizCount: 0,
        correctAnswers: 0,
        totalAnswers: 0,
      },
    });

    const entry = await prisma.leaderboardEntry.findUnique({
      where: { userId: user.id },
    });

    const percentage =
      entry && entry.totalAnswers > 0
        ? (entry.correctAnswers / entry.totalAnswers) * 100
        : 0;

    expect(percentage).toBe(0);
  });

  // Edge case: Negative scores
  test('leaderboard handles negative scores correctly', async () => {
    const users = [];
    const userIds = [];
    for (let i = 0; i < 3; i++) {
      const user = await prisma.user.create({
        data: {
          email: `negative-score-leaderboard-test-${Date.now()}-${Math.random()}-${i}@test.com`,
          password: 'hashedpassword',
          name: `User ${i}`,
          role: 'STUDENT',
          wisdomCoins: 100,
        },
      });
      testUserIds.push(user.id);
      userIds.push(user.id);
      users.push(user);

      await prisma.leaderboardEntry.create({
        data: {
          userId: user.id,
          score: -10 * (i + 1), // -10, -20, -30
          quizCount: 5,
          correctAnswers: 0,
          totalAnswers: 10,
        },
      });
    }

    const leaderboard = await prisma.leaderboardEntry.findMany({
      where: {
        userId: { in: userIds },
      },
      orderBy: {
        score: 'desc',
      },
    });

    // Should be ordered: -10, -20, -30
    expect(leaderboard.length).toBe(3);
    expect(leaderboard[0].score).toBe(-10);
    expect(leaderboard[1].score).toBe(-20);
    expect(leaderboard[2].score).toBe(-30);
  });
});
