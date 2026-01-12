'use server';

import { prisma } from '@/lib/db/prisma';

/**
 * Reset the daily leaderboard
 * 
 * This function:
 * 1. Finds the top-ranked student
 * 2. Awards +25 wisdom coins to the leader
 * 3. Resets all student leaderboard statistics
 * 
 * @returns Object with success status and details about the reset
 */
export async function resetDailyLeaderboard() {
  try {
    // Use a transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Find the top student by score (only students with leaderboard entries)
      const topStudent = await tx.leaderboardEntry.findFirst({
        where: {
          user: {
            role: 'STUDENT',
          },
        },
        orderBy: [
          { score: 'desc' },
          { userId: 'asc' }, // Tie-breaker: first user ID alphabetically
        ],
        include: {
          user: true,
        },
      });

      let leaderInfo = null;

      // Award 25 wisdom coins to the leader
      if (topStudent && topStudent.user) {
        await tx.user.update({
          where: { id: topStudent.userId },
          data: {
            wisdomCoins: {
              increment: 25,
            },
          },
        });

        await tx.tokenTransaction.create({
          data: {
            userId: topStudent.userId,
            amount: 25,
            type: 'LEADERBOARD_REWARD',
            description: 'Daily leaderboard winner',
          },
        });

        leaderInfo = {
          userId: topStudent.userId,
          name: topStudent.user.name,
          score: topStudent.score,
          coinsAwarded: 25,
        };
      }

      // Reset all student leaderboard entries
      const resetResult = await tx.leaderboardEntry.updateMany({
        where: {
          user: {
            role: 'STUDENT',
          },
        },
        data: {
          score: 0,
          quizCount: 0,
          correctAnswers: 0,
          totalAnswers: 0,
          lastResetAt: new Date(),
        },
      });

      return {
        success: true,
        leader: leaderInfo,
        studentsReset: resetResult.count,
      };
    });

    return result;
  } catch (error) {
    console.error('Error resetting leaderboard:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get the current leaderboard
 * 
 * @returns Array of leaderboard entries with user information
 */
export async function getLeaderboard() {
  try {
    const leaderboard = await prisma.leaderboardEntry.findMany({
      where: {
        user: {
          role: 'STUDENT',
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        score: 'desc',
      },
    });

    return {
      success: true,
      leaderboard,
    };
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      leaderboard: [],
    };
  }
}
