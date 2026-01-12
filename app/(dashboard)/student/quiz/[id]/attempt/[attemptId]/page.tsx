'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getQuizAttempt } from '@/app/actions/quiz';
import { QuestionDisplay, Question } from '@/components/quiz/QuestionDisplay';
import dynamic from 'next/dynamic';

// Dynamically import 3D components to avoid SSR issues
const Scene = dynamic(() => import('@/components/3d/Scene').then(mod => mod.Scene), {
  ssr: false,
  loading: () => <div className="w-full h-64 bg-gray-100 rounded-lg animate-pulse"></div>,
});

const ExpertAvatar = dynamic(() => import('@/components/3d/ExpertAvatar').then(mod => mod.ExpertAvatar), {
  ssr: false,
});

export default function QuizAttemptPage() {
  const params = useParams();
  const router = useRouter();
  const attemptId = params.attemptId as string;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState<any>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; message: string } | null>(null);

  useEffect(() => {
    loadAttempt();
  }, [attemptId]);

  const loadAttempt = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getQuizAttempt(attemptId);

      if (result.success && result.attempt) {
        setAttempt(result.attempt);
        
        // If quiz is already completed, redirect to results
        if (result.attempt.completedAt) {
          router.push(`/student/quiz/${params.id}/results/${attemptId}`);
        }
      } else {
        setError(result.error || 'Failed to load quiz');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error loading quiz attempt:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async (answer: any) => {
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const currentQuestion = attempt.quiz.questions[currentQuestionIndex];
      
      // Submit answer via server action (will be implemented in next sub-task)
      const response = await fetch('/api/quiz/submit-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId,
          questionId: currentQuestion.id,
          answer,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Show feedback
        setFeedback({
          isCorrect: result.isCorrect,
          message: result.isCorrect
            ? `Correct! +${result.coinsEarned} Wisdom Coins, +${result.pointsEarned} points`
            : `Incorrect. ${result.pointsEarned} points`,
        });

        // Check if this was the last question
        const isLastQuestion = currentQuestionIndex >= attempt.quiz.questions.length - 1;

        // Move to next question or complete quiz after a delay
        setTimeout(async () => {
          if (!isLastQuestion) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
            setFeedback(null);
          } else {
            // Complete the quiz
            const completeResponse = await fetch('/api/quiz/complete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ attemptId }),
            });

            const completeResult = await completeResponse.json();

            if (completeResult.success) {
              // Store achievements in session storage for results page
              if (completeResult.newAchievements && completeResult.newAchievements.length > 0) {
                sessionStorage.setItem('newAchievements', JSON.stringify(completeResult.newAchievements));
              }
              
              // Redirect to results page
              router.push(`/student/quiz/${params.id}/results/${attemptId}`);
            } else {
              setError(completeResult.error || 'Failed to complete quiz');
            }
          }
        }, 2000);
      } else {
        setError(result.error || 'Failed to submit answer');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error submitting answer:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-red-900 mb-2">Error</h2>
          <p className="text-red-800">{error || 'Quiz not found'}</p>
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

  const currentQuestion = attempt.quiz.questions[currentQuestionIndex];

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Quiz Area */}
        <div className="lg:col-span-2">
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-gray-900">
              {attempt.quiz.lessonTitle}
            </h1>
            <p className="text-gray-600">{attempt.quiz.subject}</p>
          </div>

          {feedback && (
            <div
              className={`mb-4 p-4 rounded-lg ${
                feedback.isCorrect
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}
            >
              <p
                className={`font-semibold ${
                  feedback.isCorrect ? 'text-green-900' : 'text-red-900'
                }`}
              >
                {feedback.message}
              </p>
            </div>
          )}

          <QuestionDisplay
            question={currentQuestion}
            questionNumber={currentQuestionIndex + 1}
            totalQuestions={attempt.quiz.questions.length}
            onSubmitAnswer={handleSubmitAnswer}
            isSubmitting={isSubmitting}
          />
        </div>

        {/* Expert Avatar Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-lg p-6 sticky top-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Your Expert Guide
            </h3>
            
            {attempt.user.selectedExpert ? (
              <>
                <div className="mb-4">
                  <Suspense fallback={<div className="w-full h-64 bg-gray-100 rounded-lg animate-pulse"></div>}>
                    <Scene theme="BASIC">
                      <ExpertAvatar
                        expert={attempt.user.selectedExpert}
                        animated={true}
                      />
                    </Scene>
                  </Suspense>
                </div>
                
                <p className="text-center font-medium text-gray-900 mb-2">
                  {attempt.user.selectedExpert.name}
                </p>
                
                <div className="bg-indigo-50 rounded-lg p-3 text-sm text-indigo-900">
                  <p className="italic">
                    "Take your time and think carefully about each question. You've got this!"
                  </p>
                </div>
              </>
            ) : (
              <div className="text-center text-gray-500">
                <p>No expert selected</p>
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Progress</span>
                <span className="font-semibold text-gray-900">
                  {currentQuestionIndex + 1} / {attempt.quiz.questions.length}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${((currentQuestionIndex + 1) / attempt.quiz.questions.length) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
