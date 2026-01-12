'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getQuizAttempt } from '@/app/actions/quiz';

export default function QuizResultsPage() {
  const params = useParams();
  const router = useRouter();
  const attemptId = params.attemptId as string;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState<any>(null);
  const [newAchievements, setNewAchievements] = useState<any[]>([]);

  useEffect(() => {
    loadResults();
    // Check for achievements in URL params or session storage
    const achievementsData = sessionStorage.getItem('newAchievements');
    if (achievementsData) {
      try {
        const achievements = JSON.parse(achievementsData);
        setNewAchievements(achievements);
        sessionStorage.removeItem('newAchievements');
      } catch (e) {
        console.error('Error parsing achievements:', e);
      }
    }
  }, [attemptId]);

  const loadResults = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getQuizAttempt(attemptId);

      if (result.success && result.attempt) {
        setAttempt(result.attempt);
      } else {
        setError(result.error || 'Failed to load results');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error loading results:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-red-900 mb-2">Error</h2>
          <p className="text-red-800">{error || 'Results not found'}</p>
          <button
            onClick={() => router.push('/student')}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const correctAnswers = attempt.answers.filter((a: any) => a.isCorrect).length;
  const totalQuestions = attempt.quiz.questions.length;
  const percentage = Math.round((correctAnswers / totalQuestions) * 100);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Quiz Completed!
          </h1>
          <p className="text-gray-600">{attempt.quiz.lessonTitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-indigo-50 rounded-lg p-6 text-center">
            <div className="text-4xl font-bold text-indigo-600 mb-2">
              {percentage}%
            </div>
            <div className="text-sm text-gray-600">Score</div>
          </div>

          <div className="bg-green-50 rounded-lg p-6 text-center">
            <div className="text-4xl font-bold text-green-600 mb-2">
              {correctAnswers}/{totalQuestions}
            </div>
            <div className="text-sm text-gray-600">Correct Answers</div>
          </div>

          <div className="bg-purple-50 rounded-lg p-6 text-center">
            <div className="text-4xl font-bold text-purple-600 mb-2">
              {attempt.score}
            </div>
            <div className="text-sm text-gray-600">Points Earned</div>
          </div>
        </div>

        {attempt.isPerfect && (
          <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-center">
              <svg
                className="w-8 h-8 text-yellow-600 mr-3"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <div>
                <h3 className="text-lg font-bold text-yellow-900">
                  Perfect Score!
                </h3>
                <p className="text-yellow-800">
                  You answered all questions correctly and earned a +50 bonus!
                </p>
              </div>
            </div>
          </div>
        )}

        {newAchievements.length > 0 && (
          <div className="mb-8 space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">
              🎉 New Achievements Unlocked!
            </h2>
            {newAchievements.map((achievement) => (
              <div
                key={achievement.id}
                className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300 rounded-lg p-6"
              >
                <div className="flex items-center">
                  <div className="text-4xl mr-4">{achievement.icon}</div>
                  <div>
                    <h3 className="text-lg font-bold text-purple-900">
                      {achievement.name}
                    </h3>
                    <p className="text-purple-800">{achievement.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-4 mb-8">
          <h2 className="text-xl font-semibold text-gray-900">
            Question Review
          </h2>
          {attempt.answers.map((answer: any, index: number) => (
            <div
              key={answer.id}
              className={`p-4 rounded-lg border-2 ${
                answer.isCorrect
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-start">
                <div
                  className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                    answer.isCorrect ? 'bg-green-500' : 'bg-red-500'
                  }`}
                >
                  {answer.isCorrect ? (
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M5 13l4 4L19 7"></path>
                    </svg>
                  ) : (
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    Question {index + 1}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {answer.question.text}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => router.push('/student')}
            className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
          >
            Back to Dashboard
          </button>
          <button
            onClick={() => router.push(`/student/quiz/${params.id}`)}
            className="px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            Retake Quiz
          </button>
        </div>
      </div>
    </div>
  );
}
