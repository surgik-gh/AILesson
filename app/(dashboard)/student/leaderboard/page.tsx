import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';

export default async function LeaderboardPage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  // Query leaderboard entries ordered by score (descending)
  const leaderboardEntries = await prisma.leaderboardEntry.findMany({
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

  // Calculate correct answer percentage for each entry
  const leaderboardWithPercentage = leaderboardEntries.map((entry, index) => {
    const correctPercentage =
      entry.totalAnswers > 0
        ? Math.round((entry.correctAnswers / entry.totalAnswers) * 100)
        : 0;

    return {
      ...entry,
      correctPercentage,
      rank: index + 1,
      isCurrentUser: entry.user.id === session.user.id,
    };
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 text-center">Leaderboard</h1>

      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-indigo-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Rank</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Student</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold">Score</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold">Quizzes</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold">Accuracy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {leaderboardWithPercentage.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      No leaderboard entries yet. Complete a quiz to appear on the leaderboard!
                    </td>
                  </tr>
                ) : (
                  leaderboardWithPercentage.map((entry) => (
                    <tr
                      key={entry.id}
                      className={`
                        ${entry.isCurrentUser ? 'bg-indigo-50 dark:bg-indigo-900/20 font-semibold' : ''}
                        hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors
                      `}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {entry.rank === 1 && (
                            <span className="text-2xl mr-2">🥇</span>
                          )}
                          {entry.rank === 2 && (
                            <span className="text-2xl mr-2">🥈</span>
                          )}
                          {entry.rank === 3 && (
                            <span className="text-2xl mr-2">🥉</span>
                          )}
                          <span className="text-lg">{entry.rank}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {entry.user.name}
                            {entry.isCurrentUser && (
                              <span className="ml-2 text-xs text-indigo-600 dark:text-indigo-400">
                                (You)
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {entry.user.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                          {entry.score}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {entry.quizCount}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {entry.correctPercentage}%
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            ({entry.correctAnswers}/{entry.totalAnswers})
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info section */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
            How the Leaderboard Works
          </h3>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• Earn +10 points for each correct answer</li>
            <li>• Lose -1 point for each incorrect answer</li>
            <li>• Get +50 bonus points for completing a quiz with 100% accuracy</li>
            <li>• The top student receives +25 wisdom coins at daily reset</li>
            <li>• Leaderboard resets daily to give everyone a fresh start</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
