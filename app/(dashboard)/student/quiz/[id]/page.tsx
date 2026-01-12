'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { initializeQuizAttempt } from '@/app/actions/quiz';

export default function QuizStartPage() {
  const params = useParams();
  const router = useRouter();
  const quizId = params.id as string;
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quizInfo, setQuizInfo] = useState<any>(null);

  useEffect(() => {
    // Load quiz info without starting attempt yet
    async function loadQuizInfo() {
      // For now, we'll just show a start button
      // In a full implementation, we'd fetch quiz metadata
      setQuizInfo({ id: quizId });
    }
    
    loadQuizInfo();
  }, [quizId]);

  const handleStartQuiz = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await initializeQuizAttempt(quizId);

      if (result.success && result.attemptId) {
        // Redirect to quiz gameplay page
        router.push(`/student/quiz/${quizId}/attempt/${result.attemptId}`);
      } else {
        setError(result.error || 'Failed to start quiz');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error starting quiz:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!quizInfo) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading quiz...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Ready to Start Quiz?
        </h1>
        
        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            This quiz will test your knowledge on the lesson material.
          </p>
          
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-4">
            <h2 className="font-semibold text-indigo-900 mb-2">Quiz Rules:</h2>
            <ul className="list-disc list-inside text-indigo-800 space-y-1">
              <li>Answer all questions to complete the quiz</li>
              <li>Earn +2 Wisdom Coins for each correct answer</li>
              <li>Get +50 bonus points for a perfect score</li>
              <li>Your leaderboard score will be updated</li>
            </ul>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="flex gap-4">
          <button
            onClick={handleStartQuiz}
            disabled={loading}
            className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Starting...' : 'Start Quiz'}
          </button>
          
          <button
            onClick={() => router.back()}
            disabled={loading}
            className="px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
