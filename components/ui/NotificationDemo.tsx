'use client';

import React from 'react';
import { useNotification } from '@/hooks/useNotification';

/**
 * Demo component showing how to use the notification system
 * This can be used as a reference for implementing notifications
 * throughout the application
 */
export function NotificationDemo() {
  const notify = useNotification();

  return (
    <div className="p-6 space-y-4 max-w-2xl">
      <h2 className="text-2xl font-bold mb-4">Notification System Demo</h2>
      
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Basic Notifications</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => notify.success('Success!', 'Operation completed successfully')}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Success
          </button>
          <button
            onClick={() => notify.error('Error!', 'Something went wrong')}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Error
          </button>
          <button
            onClick={() => notify.info('Info', 'Here is some information')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Info
          </button>
          <button
            onClick={() => notify.warning('Warning', 'Please be careful')}
            className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
          >
            Warning
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Achievement Notifications</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => notify.achievementUnlocked('Первая викторина')}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            Achievement Unlocked
          </button>
          <button
            onClick={() => notify.perfectQuiz()}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            Perfect Quiz
          </button>
          <button
            onClick={() => notify.leaderboardWinner(25)}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            Leaderboard Winner
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Coin Notifications</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => notify.coinsEarned(2, 'Правильный ответ')}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Coins Earned
          </button>
          <button
            onClick={() => notify.coinsSpent(20, 'Создание урока')}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Coins Spent
          </button>
          <button
            onClick={() => notify.insufficientCoins(20, 10)}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Insufficient Coins
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Quiz Notifications</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => notify.correctAnswer()}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Correct Answer
          </button>
          <button
            onClick={() => notify.incorrectAnswer()}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Incorrect Answer
          </button>
          <button
            onClick={() => notify.quizCompleted(85)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Quiz Completed
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Lesson & Expert Notifications</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => notify.lessonCreated()}
            className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700"
          >
            Lesson Created
          </button>
          <button
            onClick={() => notify.lessonShared('Иван Иванов')}
            className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700"
          >
            Lesson Shared
          </button>
          <button
            onClick={() => notify.expertGenerated('Профессор Знайка')}
            className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700"
          >
            Expert Generated
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Error Notifications</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => notify.networkError()}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Network Error
          </button>
          <button
            onClick={() => notify.serverError()}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Server Error
          </button>
          <button
            onClick={() => notify.unauthorized()}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Unauthorized
          </button>
          <button
            onClick={() => notify.aiError()}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            AI Error
          </button>
        </div>
      </div>
    </div>
  );
}
