import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

/**
 * Daily Leaderboard Reset API Route
 * 
 * This endpoint should be called daily (e.g., via a cron job or scheduled task)
 * to reset the leaderboard and award the top student.
 * 
 * Process:
 * 1. Find the top-ranked student
 * 2. Award +25 wisdom coins to the leader
 * 3. Reset all student leaderboard statistics
 */
export async function POST(request: Request) {
  try {
    // Optional: Add authentication/authorization for this endpoint
    // For example, check for a secret token in headers
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET || 'your-secret-token';
    
    if (authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Find the top student by score
    const topStudent = await prisma.leaderboardEntry.findFirst({
      where: {
        user: {
          role: 'STUDENT',
        },
      },
      orderBy: {
        score: 'desc',
      },
      include: {
        user: true,
      },
    });

    let leaderName = null;
    let leaderScore = null;

    // Award 25 wisdom coins to the leader
    if (topStudent) {
      leaderName = topStudent.user.name;
      leaderScore = topStudent.score;

      await prisma.user.update({
        where: { id: topStudent.userId },
        data: {
          wisdomCoins: {
            increment: 25,
          },
        },
      });

      await prisma.tokenTransaction.create({
        data: {
          userId: topStudent.userId,
          amount: 25,
          type: 'LEADERBOARD_REWARD',
          description: 'Daily leaderboard winner',
        },
      });
    }

    // Reset all student leaderboard entries
    const resetResult = await prisma.leaderboardEntry.updateMany({
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

    return NextResponse.json({
      success: true,
      message: 'Leaderboard reset successfully',
      leader: topStudent
        ? {
            name: leaderName,
            score: leaderScore,
            coinsAwarded: 25,
          }
        : null,
      studentsReset: resetResult.count,
    });
  } catch (error) {
    console.error('Error resetting leaderboard:', error);
    return NextResponse.json(
      {
        error: 'Failed to reset leaderboard',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
