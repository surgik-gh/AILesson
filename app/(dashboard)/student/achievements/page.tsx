'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { getUserAchievements } from '@/lib/utils/achievements';
import dynamic from 'next/dynamic';

// Dynamically import 3D components to avoid SSR issues
const Scene = dynamic(() => import('@/components/3d/Scene').then(mod => mod.Scene), {
  ssr: false,
  loading: () => <div className="w-full h-48 bg-gray-100 rounded-lg animate-pulse"></div>,
});

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: string;
  isEarned: boolean;
  earnedAt: Date | null;
  progress: number;
  total: number;
}

export default function AchievementsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get current user's achievements via API
      const response = await fetch('/api/achievements');
      const result = await response.json();

      if (result.success) {
        setAchievements(result.achievements);
      } else {
        setError(result.error || 'Failed to load achievements');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error loading achievements:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading achievements...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-red-900 mb-2">Error</h2>
          <p className="text-red-800">{error}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const earnedAchievements = achievements.filter((a) => a.isEarned);
  const lockedAchievements = achievements.filter((a) => !a.isEarned);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Achievements</h1>
        <p className="text-gray-600">
          Track your progress and unlock achievements as you learn
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6 border-2 border-purple-200">
          <div className="text-4xl font-bold text-purple-600 mb-2">
            {earnedAchievements.length}
          </div>
          <div className="text-sm text-gray-600">Achievements Earned</div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border-2 border-blue-200">
          <div className="text-4xl font-bold text-blue-600 mb-2">
            {achievements.length}
          </div>
          <div className="text-sm text-gray-600">Total Achievements</div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border-2 border-green-200">
          <div className="text-4xl font-bold text-green-600 mb-2">
            {Math.round((earnedAchievements.length / achievements.length) * 100)}%
          </div>
          <div className="text-sm text-gray-600">Completion Rate</div>
        </div>
      </div>

      {/* Earned Achievements */}
      {earnedAchievements.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            🏆 Earned Achievements
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {earnedAchievements.map((achievement) => (
              <div
                key={achievement.id}
                className="bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-300 rounded-lg p-6 shadow-lg transform hover:scale-105 transition-transform"
              >
                <div className="flex items-start">
                  <div className="text-5xl mr-4">{achievement.icon}</div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                      {achievement.name}
                    </h3>
                    <p className="text-sm text-gray-700 mb-2">
                      {achievement.description}
                    </p>
                    <p className="text-xs text-gray-500">
                      Earned on{' '}
                      {achievement.earnedAt
                        ? new Date(achievement.earnedAt).toLocaleDateString()
                        : 'Unknown'}
                    </p>
                  </div>
                  <div className="ml-4">
                    <svg
                      className="w-8 h-8 text-yellow-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Locked Achievements */}
      {lockedAchievements.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            🔒 Locked Achievements
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lockedAchievements.map((achievement) => (
              <div
                key={achievement.id}
                className="bg-gray-50 border-2 border-gray-200 rounded-lg p-6 opacity-75"
              >
                <div className="flex items-start">
                  <div className="text-5xl mr-4 grayscale">{achievement.icon}</div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-700 mb-1">
                      {achievement.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      {achievement.description}
                    </p>
                    
                    {/* Progress Bar */}
                    {achievement.total > 0 && (
                      <div>
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Progress</span>
                          <span>
                            {achievement.progress} / {achievement.total}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${(achievement.progress / achievement.total) * 100}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="ml-4">
                    <svg
                      className="w-8 h-8 text-gray-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Back Button */}
      <div className="mt-8">
        <button
          onClick={() => router.push('/student')}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
