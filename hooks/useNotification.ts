'use client';

import { useToast } from '@/lib/contexts/ToastContext';

/**
 * Hook for showing notifications with predefined messages
 * for common actions in the AILesson platform
 */
export function useNotification() {
  const toast = useToast();

  return {
    // Generic notifications
    success: toast.success,
    error: toast.error,
    info: toast.info,
    warning: toast.warning,

    // Achievement notifications
    achievementUnlocked: (achievementName: string) => {
      toast.achievement(
        'Достижение разблокировано! 🎉',
        `Вы получили достижение: ${achievementName}`
      );
    },

    // Coin transaction notifications
    coinsEarned: (amount: number, reason?: string) => {
      toast.success(
        `+${amount} монет мудрости`,
        reason || 'Монеты добавлены на ваш счёт'
      );
    },

    coinsSpent: (amount: number, reason?: string) => {
      toast.info(
        `-${amount} монет мудрости`,
        reason || 'Монеты списаны с вашего счёта'
      );
    },

    insufficientCoins: (required: number, current: number) => {
      toast.error(
        'Недостаточно монет мудрости',
        `Требуется: ${required}, у вас: ${current}`
      );
    },

    // Quiz notifications
    correctAnswer: () => {
      toast.success('Правильно! 🎯', '+2 монеты мудрости, +10 очков');
    },

    incorrectAnswer: () => {
      toast.error('Неправильно', '-1 очко в рейтинге');
    },

    perfectQuiz: () => {
      toast.achievement(
        'Идеальный результат! 🌟',
        '+50 бонусных очков за безошибочное прохождение'
      );
    },

    quizCompleted: (score: number) => {
      toast.success('Викторина завершена!', `Ваш результат: ${score} очков`);
    },

    // Lesson notifications
    lessonCreated: () => {
      toast.success('Урок создан!', 'Урок успешно сгенерирован и сохранён');
    },

    lessonShared: (studentName: string) => {
      toast.success('Урок отправлен', `Урок отправлен ученику: ${studentName}`);
    },

    // Expert notifications
    expertGenerated: (expertName: string) => {
      toast.success(
        'Эксперт создан!',
        `Ваш персональный эксперт ${expertName} готов помочь вам`
      );
    },

    expertSelected: (expertName: string) => {
      toast.info('Эксперт выбран', `Теперь вы работаете с экспертом ${expertName}`);
    },

    // Leaderboard notifications
    leaderboardWinner: (coins: number) => {
      toast.achievement(
        'Вы лидер дня! 👑',
        `Поздравляем! Вы получили ${coins} монет мудрости`
      );
    },

    leaderboardReset: () => {
      toast.info('Рейтинг обновлён', 'Ежедневный рейтинг был сброшен');
    },

    // Settings notifications
    settingsSaved: () => {
      toast.success('Настройки сохранены', 'Ваши изменения успешно применены');
    },

    passwordChanged: () => {
      toast.success('Пароль изменён', 'Ваш новый пароль сохранён');
    },

    themeChanged: (theme: string) => {
      toast.info('Тема изменена', `Применена тема: ${theme}`);
    },

    // Error notifications
    networkError: () => {
      toast.error(
        'Ошибка сети',
        'Проверьте подключение к интернету и попробуйте снова'
      );
    },

    serverError: () => {
      toast.error(
        'Ошибка сервера',
        'Что-то пошло не так. Попробуйте позже'
      );
    },

    unauthorized: () => {
      toast.error('Доступ запрещён', 'Пожалуйста, войдите в систему');
    },

    validationError: (message: string) => {
      toast.warning('Ошибка валидации', message);
    },

    // AI service notifications
    aiGenerating: () => {
      toast.info('Генерация...', 'AI создаёт контент, пожалуйста подождите');
    },

    aiError: () => {
      toast.error(
        'Ошибка AI сервиса',
        'Не удалось сгенерировать контент. Попробуйте снова'
      );
    },
  };
}
