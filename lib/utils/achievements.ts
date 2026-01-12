import { prisma } from '@/lib/db/prisma';

/**
 * Achievement checking service
 * Checks if a user has earned any achievements and creates UserAchievement records
 */

interface AchievementCheckResult {
  newAchievements: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
  }>;
}

/**
 * Check and award achievements for a user after quiz completion
 * @param userId - The user's ID
 * @returns Array of newly earned achievements
 */
export async function checkAchievements(userId: string): Promise<AchievementCheckResult> {
  const newAchievements: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
  }> = [];

  try {
    // Get user's leaderboard entry to check quiz count
    const leaderboardEntry = await prisma.leaderboardEntry.findUnique({
      where: { userId },
    });

    if (!leaderboardEntry) {
      return { newAchievements: [] };
    }

    // Get all achievements
    const allAchievements = await prisma.achievement.findMany();

    // Get user's existing achievements
    const userAchievements = await prisma.userAchievement.findMany({
      where: { userId },
      select: { achievementId: true },
    });

    const earnedAchievementIds = new Set(userAchievements.map((ua) => ua.achievementId));

    // Check first_quiz achievement
    const firstQuizAchievement = allAchievements.find(
      (a) => a.condition === 'FIRST_QUIZ'
    );
    if (
      firstQuizAchievement &&
      !earnedAchievementIds.has(firstQuizAchievement.id) &&
      leaderboardEntry.quizCount >= 1
    ) {
      await prisma.userAchievement.create({
        data: {
          userId,
          achievementId: firstQuizAchievement.id,
        },
      });
      newAchievements.push({
        id: firstQuizAchievement.id,
        name: firstQuizAchievement.name,
        description: firstQuizAchievement.description,
        icon: firstQuizAchievement.icon,
      });
    }

    // Check perfect_quiz achievement
    // Need to check if the most recent quiz attempt was perfect
    const perfectQuizAchievement = allAchievements.find(
      (a) => a.condition === 'PERFECT_QUIZ'
    );
    if (perfectQuizAchievement && !earnedAchievementIds.has(perfectQuizAchievement.id)) {
      const recentPerfectAttempt = await prisma.quizAttempt.findFirst({
        where: {
          userId,
          isPerfect: true,
        },
        orderBy: {
          completedAt: 'desc',
        },
      });

      if (recentPerfectAttempt) {
        await prisma.userAchievement.create({
          data: {
            userId,
            achievementId: perfectQuizAchievement.id,
          },
        });
        newAchievements.push({
          id: perfectQuizAchievement.id,
          name: perfectQuizAchievement.name,
          description: perfectQuizAchievement.description,
          icon: perfectQuizAchievement.icon,
        });
      }
    }

    // Check ten_quizzes achievement
    const tenQuizzesAchievement = allAchievements.find(
      (a) => a.condition === 'TEN_QUIZZES'
    );
    if (
      tenQuizzesAchievement &&
      !earnedAchievementIds.has(tenQuizzesAchievement.id) &&
      leaderboardEntry.quizCount >= 10
    ) {
      await prisma.userAchievement.create({
        data: {
          userId,
          achievementId: tenQuizzesAchievement.id,
        },
      });
      newAchievements.push({
        id: tenQuizzesAchievement.id,
        name: tenQuizzesAchievement.name,
        description: tenQuizzesAchievement.description,
        icon: tenQuizzesAchievement.icon,
      });
    }

    return { newAchievements };
  } catch (error) {
    console.error('Error checking achievements:', error);
    return { newAchievements: [] };
  }
}

/**
 * Get all achievements for a user with earned status
 * @param userId - The user's ID
 * @returns Array of all achievements with earned status and progress
 */
export async function getUserAchievements(userId: string) {
  try {
    const allAchievements = await prisma.achievement.findMany();
    const userAchievements = await prisma.userAchievement.findMany({
      where: { userId },
      include: {
        achievement: true,
      },
    });

    const leaderboardEntry = await prisma.leaderboardEntry.findUnique({
      where: { userId },
    });

    const earnedAchievementIds = new Set(userAchievements.map((ua) => ua.achievementId));

    return allAchievements.map((achievement) => {
      const isEarned = earnedAchievementIds.has(achievement.id);
      const earnedData = userAchievements.find((ua) => ua.achievementId === achievement.id);

      // Calculate progress for locked achievements
      let progress = 0;
      let total = 0;

      if (!isEarned && leaderboardEntry) {
        switch (achievement.condition) {
          case 'FIRST_QUIZ':
            progress = Math.min(leaderboardEntry.quizCount, 1);
            total = 1;
            break;
          case 'TEN_QUIZZES':
            progress = Math.min(leaderboardEntry.quizCount, 10);
            total = 10;
            break;
          case 'FIFTY_QUIZZES':
            progress = Math.min(leaderboardEntry.quizCount, 50);
            total = 50;
            break;
          case 'HUNDRED_QUIZZES':
            progress = Math.min(leaderboardEntry.quizCount, 100);
            total = 100;
            break;
          case 'PERFECT_QUIZ':
            // For perfect quiz, we can't show progress easily
            progress = 0;
            total = 1;
            break;
          default:
            progress = 0;
            total = 1;
        }
      }

      return {
        id: achievement.id,
        name: achievement.name,
        description: achievement.description,
        icon: achievement.icon,
        condition: achievement.condition,
        isEarned,
        earnedAt: earnedData?.earnedAt || null,
        progress,
        total,
      };
    });
  } catch (error) {
    console.error('Error getting user achievements:', error);
    return [];
  }
}
