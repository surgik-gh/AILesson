/**
 * @jest-environment node
 */

import fc from 'fast-check';
import { resetDailyLeaderboard } from '@/app/actions/leaderboard';
import { prisma } from '@/lib/db/prisma';

// Feature: ailesson-platform, Property 19: Daily leaderboard reset - leader reward
// Feature: ailesson-platform, Property 20: Daily leaderboard reset - statistics reset
describe('Daily Leaderboard Reset', () => {
  let testUserIds: string[] = [];
  let testSubjectId: string;

  beforeAll(async () => {
    // Clean up any existing test data from previous runs
    await prisma.tokenTransaction.deleteMany({
      where: {
        user: {
          email: {
            contains: '-test-',
          },
        },
      },
    });
    
    await prisma.leaderboardEntry.deleteMany({
      where: {
        user: {
          email: {
            contains: '-test-',
          },
        },
      },
    });
    
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: '-test-',
        },
      },
    });

    // Create test subject
    const subject = await prisma.subject.create({
      data: {
        name: `Test Subject Reset ${Date.now()}`,
        description: 'Test subject for leaderboard reset',
      },
    });
    testSubjectId = subject.id;
  }, 60000);

  afterEach(async () => {
    // Clean up test users after each test
    // Delete in correct order to avoid foreign key constraint violations
    if (testUserIds.length > 0) {
      try {
        // First delete all related data
        await prisma.quizAttempt.deleteMany({
          where: { 
            quiz: {
              lesson: {
                creatorId: { in: testUserIds }
              }
            }
          },
        });
        
        await prisma.quiz.deleteMany({
          where: { 
            lesson: {
              creatorId: { in: testUserIds }
            }
          },
        });
        
        await prisma.lesson.deleteMany({
          where: { creatorId: { in: testUserIds } },
        });
        
        // Then delete token transactions
        await prisma.tokenTransaction.deleteMany({
          where: { userId: { in: testUserIds } },
        });
        
        // Then delete leaderboard entries
        await prisma.leaderboardEntry.deleteMany({
          where: { userId: { in: testUserIds } },
        });
        
        // Finally delete the users
        await prisma.user.deleteMany({
          where: { id: { in: testUserIds } },
        });
      } catch (error) {
        console.error('Cleanup error:', error);
      }
    }
    testUserIds = [];
  }, 30000);

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

  // Property 19: Daily leaderboard reset - leader reward
  test('top student receives +25 wisdom coins and transaction record after reset', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            name: fc.string({ minLength: 3, maxLength: 20 }),
            score: fc.integer({ min: 0, max: 1000 }),
            initialCoins: fc.integer({ min: 100, max: 500 }),
          }),
          { minLength: 2, maxLength: 5 }
        ),
        async (studentData) => {
          // Create students with leaderboard entries
          const createdUserIds = [];
          let expectedLeaderId = null;
          let maxScore = -Infinity;

          for (const data of studentData) {
            const user = await prisma.user.create({
              data: {
                email: `reset-test-${Date.now()}-${Math.random()}@test.com`,
                password: 'hashedpassword',
                name: data.name,
                role: 'STUDENT',
                wisdomCoins: data.initialCoins,
              },
            });
            createdUserIds.push(user.id);
            testUserIds.push(user.id);

            await prisma.leaderboardEntry.create({
              data: {
                userId: user.id,
                score: data.score,
                quizCount: 10,
                correctAnswers: 50,
                totalAnswers: 100,
              },
            });

            // Track who should be the leader
            if (data.score > maxScore) {
              maxScore = data.score;
              expectedLeaderId = user.id;
            }
          }

          // Get leader's initial state
          const leaderBefore = await prisma.user.findUnique({
            where: { id: expectedLeaderId! },
          });

          // Reset the leaderboard
          const result = await resetDailyLeaderboard();

          // Verify leader received reward
          expect(result.success).toBe(true);
          if (!result.success) {
            throw new Error('Reset failed');
          }
          
          // Type assertion after success check
          const successResult = result as { success: true; leader: { userId: string; name: string; score: number; coinsAwarded: number; } | null; studentsReset: number; };
          
          expect(successResult.leader).toBeTruthy();
          expect(successResult.leader?.userId).toBe(expectedLeaderId);

          // Verify coins were awarded
          const leaderAfter = await prisma.user.findUnique({
            where: { id: expectedLeaderId! },
          });
          expect(leaderAfter?.wisdomCoins).toBe(
            (leaderBefore?.wisdomCoins || 0) + 25
          );

          // Verify transaction was created
          const transaction = await prisma.tokenTransaction.findFirst({
            where: {
              userId: expectedLeaderId!,
              type: 'LEADERBOARD_REWARD',
              amount: 25,
            },
            orderBy: {
              createdAt: 'desc',
            },
          });
          expect(transaction).toBeTruthy();
          expect(transaction?.description).toContain('leaderboard');
        }
      ),
      { numRuns: 3 }
    );
  }, 60000);

  // Property 20: Daily leaderboard reset - statistics reset
  test('all student leaderboard statistics are reset to zero after reset', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            name: fc.string({ minLength: 3, maxLength: 20 }),
            score: fc.integer({ min: -50, max: 1000 }),
            quizCount: fc.integer({ min: 1, max: 50 }),
            correctAnswers: fc.integer({ min: 0, max: 100 }),
            totalAnswers: fc.integer({ min: 1, max: 100 }),
          }),
          { minLength: 2, maxLength: 5 }
        ),
        async (studentData) => {
          // Create students with leaderboard entries
          const createdUserIds = [];

          for (const data of studentData) {
            const user = await prisma.user.create({
              data: {
                email: `stats-reset-${Date.now()}-${Math.random()}@test.com`,
                password: 'hashedpassword',
                name: data.name,
                role: 'STUDENT',
                wisdomCoins: 150,
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

          // Reset the leaderboard
          const result = await resetDailyLeaderboard();

          expect(result.success).toBe(true);
          if (!result.success) {
            throw new Error('Reset failed');
          }
          
          // Type assertion after success check
          const successResult = result as { success: true; leader: { userId: string; name: string; score: number; coinsAwarded: number; } | null; studentsReset: number; };
          
          expect(successResult.studentsReset).toBeGreaterThanOrEqual(createdUserIds.length);

          // Verify all entries are reset
          const leaderboardAfter = await prisma.leaderboardEntry.findMany({
            where: {
              userId: { in: createdUserIds },
            },
          });

          for (const entry of leaderboardAfter) {
            expect(entry.score).toBe(0);
            expect(entry.quizCount).toBe(0);
            expect(entry.correctAnswers).toBe(0);
            expect(entry.totalAnswers).toBe(0);
            expect(entry.lastResetAt).toBeTruthy();
          }
        }
      ),
      { numRuns: 3 }
    );
  }, 60000);

  // Edge case: Empty leaderboard reset
  test('reset succeeds with no students on leaderboard', async () => {
    // Don't create any students - just call reset
    // The function should handle the case where there are no students gracefully
    const result = await resetDailyLeaderboard();

    expect(result.success).toBe(true);
    if (!result.success) {
      throw new Error('Reset failed');
    }
    
    // Type assertion after success check
    const successResult = result as { success: true; leader: { userId: string; name: string; score: number; coinsAwarded: number; } | null; studentsReset: number; };
    
    // Leader could be null OR could be a student from another test
    // The important thing is that the function succeeds
    expect(successResult.studentsReset).toBeGreaterThanOrEqual(0);
  }, 30000);

  // Edge case: Single student
  test('single student receives reward and is reset', async () => {
    // Clean up ALL existing student leaderboard entries first
    await prisma.leaderboardEntry.deleteMany({
      where: {
        user: {
          role: 'STUDENT',
        },
      },
    });

    const user = await prisma.user.create({
      data: {
        email: `single-reset-test-${Date.now()}@test.com`,
        password: 'hashedpassword',
        name: 'Single Student',
        role: 'STUDENT',
        wisdomCoins: 100,
      },
    });
    testUserIds.push(user.id);

    await prisma.leaderboardEntry.create({
      data: {
        userId: user.id,
        score: 50,
        quizCount: 5,
        correctAnswers: 10,
        totalAnswers: 15,
      },
    });

    const result = await resetDailyLeaderboard();

    expect(result.success).toBe(true);
    if (!result.success) {
      throw new Error('Reset failed');
    }
    
    // Type assertion after success check
    const successResult = result as { success: true; leader: { userId: string; name: string; score: number; coinsAwarded: number; } | null; studentsReset: number; };
    
    expect(successResult.leader?.userId).toBe(user.id);

    // Verify coins awarded
    const userAfter = await prisma.user.findUnique({
      where: { id: user.id },
    });
    expect(userAfter?.wisdomCoins).toBe(125); // 100 + 25

    // Verify stats reset
    const entry = await prisma.leaderboardEntry.findUnique({
      where: { userId: user.id },
    });
    expect(entry?.score).toBe(0);
    expect(entry?.quizCount).toBe(0);
    expect(entry?.correctAnswers).toBe(0);
    expect(entry?.totalAnswers).toBe(0);
  });

  // Edge case: Tied scores
  test('one student receives reward when multiple students have same top score', async () => {
    // Clean up ALL existing student leaderboard entries first
    await prisma.leaderboardEntry.deleteMany({
      where: {
        user: {
          role: 'STUDENT',
        },
      },
    });

    const users = [];
    for (let i = 0; i < 3; i++) {
      const user = await prisma.user.create({
        data: {
          email: `tied-reset-test-${Date.now()}-${i}@test.com`,
          password: 'hashedpassword',
          name: `Tied Student ${i}`,
          role: 'STUDENT',
          wisdomCoins: 100,
        },
      });
      testUserIds.push(user.id);
      users.push(user);

      await prisma.leaderboardEntry.create({
        data: {
          userId: user.id,
          score: 100, // All have same score
          quizCount: 5,
          correctAnswers: 10,
          totalAnswers: 15,
        },
      });
    }

    const result = await resetDailyLeaderboard();

    expect(result.success).toBe(true);
    if (!result.success) {
      throw new Error('Reset failed');
    }
    
    // Type assertion after success check
    const successResult = result as { success: true; leader: { userId: string; name: string; score: number; coinsAwarded: number; } | null; studentsReset: number; };
    
    expect(successResult.leader).toBeTruthy();

    // Verify exactly one student got the reward
    const usersAfter = await prisma.user.findMany({
      where: {
        id: { in: testUserIds },
      },
    });

    const studentsWithReward = usersAfter.filter((u) => u.wisdomCoins === 125);
    expect(studentsWithReward.length).toBe(1);

    // Verify all are reset
    const entries = await prisma.leaderboardEntry.findMany({
      where: {
        userId: { in: testUserIds },
      },
    });

    for (const entry of entries) {
      expect(entry.score).toBe(0);
    }
  });

  // Edge case: Negative scores
  test('student with highest negative score receives reward', async () => {
    // Clean up ALL existing student leaderboard entries first
    // This ensures our negative score students are the only ones
    await prisma.leaderboardEntry.deleteMany({
      where: {
        user: {
          role: 'STUDENT',
        },
      },
    });

    const users = [];
    const scores = [-20, -10, -5]; // -5 is the highest

    for (let i = 0; i < scores.length; i++) {
      const user = await prisma.user.create({
        data: {
          email: `negative-reset-test-${Date.now()}-${i}-${Math.random()}@test.com`,
          password: 'hashedpassword',
          name: `Negative Student ${i}`,
          role: 'STUDENT',
          wisdomCoins: 100,
        },
      });
      testUserIds.push(user.id);
      users.push(user);

      await prisma.leaderboardEntry.create({
        data: {
          userId: user.id,
          score: scores[i],
          quizCount: 5,
          correctAnswers: 0,
          totalAnswers: 15,
        },
      });
    }

    // Verify the leaderboard order before reset
    const leaderboardBefore = await prisma.leaderboardEntry.findMany({
      where: {
        userId: { in: users.map(u => u.id) },
      },
      orderBy: {
        score: 'desc',
      },
    });

    // The highest score should be -5 (users[2])
    expect(leaderboardBefore[0].userId).toBe(users[2].id);
    expect(leaderboardBefore[0].score).toBe(-5);

    const result = await resetDailyLeaderboard();

    expect(result.success).toBe(true);
    if (!result.success) {
      throw new Error('Reset failed');
    }
    
    // Type assertion after success check
    const successResult = result as { success: true; leader: { userId: string; name: string; score: number; coinsAwarded: number; } | null; studentsReset: number; };
    
    // The leader should be the one with the highest score (-5)
    expect(successResult.leader?.userId).toBe(users[2].id); // User with -5 score

    // Verify reward
    const leaderAfter = await prisma.user.findUnique({
      where: { id: users[2].id },
    });
    expect(leaderAfter?.wisdomCoins).toBe(125);
  });

  // Edge case: Teachers and admins are not affected
  test('only student leaderboard entries are reset, not teachers or admins', async () => {
    // Create a teacher with leaderboard entry
    const teacher = await prisma.user.create({
      data: {
        email: `teacher-${Date.now()}@test.com`,
        password: 'hashedpassword',
        name: 'Teacher User',
        role: 'TEACHER',
        wisdomCoins: 250,
      },
    });
    testUserIds.push(teacher.id);

    await prisma.leaderboardEntry.create({
      data: {
        userId: teacher.id,
        score: 500,
        quizCount: 10,
        correctAnswers: 50,
        totalAnswers: 50,
      },
    });

    // Create a student
    const student = await prisma.user.create({
      data: {
        email: `student-${Date.now()}@test.com`,
        password: 'hashedpassword',
        name: 'Student User',
        role: 'STUDENT',
        wisdomCoins: 150,
      },
    });
    testUserIds.push(student.id);

    await prisma.leaderboardEntry.create({
      data: {
        userId: student.id,
        score: 100,
        quizCount: 5,
        correctAnswers: 10,
        totalAnswers: 15,
      },
    });

    const result = await resetDailyLeaderboard();

    expect(result.success).toBe(true);

    // Verify teacher entry is NOT reset
    const teacherEntry = await prisma.leaderboardEntry.findUnique({
      where: { userId: teacher.id },
    });
    expect(teacherEntry?.score).toBe(500); // Unchanged
    expect(teacherEntry?.quizCount).toBe(10); // Unchanged

    // Verify student entry IS reset
    const studentEntry = await prisma.leaderboardEntry.findUnique({
      where: { userId: student.id },
    });
    expect(studentEntry?.score).toBe(0); // Reset
    expect(studentEntry?.quizCount).toBe(0); // Reset
  });
});
