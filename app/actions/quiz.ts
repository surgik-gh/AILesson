'use server';

import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { checkAchievements } from '@/lib/utils/achievements';

/**
 * Initialize a new quiz attempt for a user
 */
export async function initializeQuizAttempt(quizId: string) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify quiz exists
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        lesson: {
          include: {
            subject: true,
          },
        },
        questions: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!quiz) {
      return { success: false, error: 'Quiz not found' };
    }

    // Create quiz attempt
    const attempt = await prisma.quizAttempt.create({
      data: {
        quizId,
        userId: session.user.id,
      },
    });

    return {
      success: true,
      attemptId: attempt.id,
      quiz: {
        id: quiz.id,
        lessonTitle: quiz.lesson.title,
        subject: quiz.lesson.subject.name,
        questionCount: quiz.questions.length,
      },
    };
  } catch (error) {
    console.error('Error initializing quiz attempt:', error);
    return { success: false, error: 'Failed to initialize quiz attempt' };
  }
}

/**
 * Get quiz attempt details with questions
 */
export async function getQuizAttempt(attemptId: string) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: {
          include: {
            lesson: {
              include: {
                subject: true,
              },
            },
            questions: {
              orderBy: { order: 'asc' },
              select: {
                id: true,
                type: true,
                text: true,
                options: true,
                order: true,
                // Don't include correctAnswer - that's checked server-side
              },
            },
          },
        },
        answers: {
          include: {
            question: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            selectedExpert: {
              select: {
                id: true,
                name: true,
                personality: true,
                communicationStyle: true,
                appearance: true,
              },
            },
          },
        },
      },
    });

    if (!attempt) {
      return { success: false, error: 'Quiz attempt not found' };
    }

    // Verify user owns this attempt
    if (attempt.userId !== session.user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    return {
      success: true,
      attempt: {
        id: attempt.id,
        startedAt: attempt.startedAt,
        completedAt: attempt.completedAt,
        score: attempt.score,
        isPerfect: attempt.isPerfect,
        quiz: {
          id: attempt.quiz.id,
          lessonTitle: attempt.quiz.lesson.title,
          subject: attempt.quiz.lesson.subject.name,
          questions: attempt.quiz.questions,
        },
        answers: attempt.answers,
        user: attempt.user,
      },
    };
  } catch (error) {
    console.error('Error getting quiz attempt:', error);
    return { success: false, error: 'Failed to get quiz attempt' };
  }
}

/**
 * Check if an answer is correct
 */
function checkAnswer(question: any, userAnswer: any): boolean {
  const correctAnswer = question.correctAnswer;
  
  if (question.type === 'TEXT') {
    // For text answers, do case-insensitive comparison and trim whitespace
    const correct = String(correctAnswer).toLowerCase().trim();
    const user = String(userAnswer).toLowerCase().trim();
    return correct === user;
  } else if (question.type === 'SINGLE') {
    // For single choice, compare the index
    return Number(correctAnswer) === Number(userAnswer);
  } else if (question.type === 'MULTIPLE') {
    // For multiple choice, compare arrays
    const correctArray = Array.isArray(correctAnswer) ? correctAnswer : [correctAnswer];
    const userArray = Array.isArray(userAnswer) ? userAnswer : [userAnswer];
    
    if (correctArray.length !== userArray.length) return false;
    
    const sortedCorrect = correctArray.map(Number).sort();
    const sortedUser = userArray.map(Number).sort();
    
    return sortedCorrect.every((val, idx) => val === sortedUser[idx]);
  }
  
  return false;
}

/**
 * Submit an answer to a quiz question
 */
export async function submitQuizAnswer(
  attemptId: string,
  questionId: string,
  answer: any
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify attempt belongs to user
    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: {
          include: {
            questions: true,
          },
        },
      },
    });

    if (!attempt) {
      return { success: false, error: 'Quiz attempt not found' };
    }

    if (attempt.userId !== session.user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    if (attempt.completedAt) {
      return { success: false, error: 'Quiz already completed' };
    }

    // Get the question with correct answer
    const question = await prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      return { success: false, error: 'Question not found' };
    }

    // Check if answer is correct
    const isCorrect = checkAnswer(question, answer);

    // Save the answer
    await prisma.userAnswer.create({
      data: {
        questionId,
        userId: session.user.id,
        attemptId,
        answer,
        isCorrect,
      },
    });

    let pointsEarned = 0;
    let coinsEarned = 0;

    if (isCorrect) {
      pointsEarned = 10;
      coinsEarned = 2;

      // Update leaderboard
      await prisma.leaderboardEntry.upsert({
        where: { userId: session.user.id },
        update: {
          score: { increment: 10 },
          correctAnswers: { increment: 1 },
          totalAnswers: { increment: 1 },
        },
        create: {
          userId: session.user.id,
          score: 10,
          correctAnswers: 1,
          totalAnswers: 1,
        },
      });

      // Award wisdom coins
      await prisma.user.update({
        where: { id: session.user.id },
        data: { wisdomCoins: { increment: 2 } },
      });

      // Create transaction record
      await prisma.tokenTransaction.create({
        data: {
          userId: session.user.id,
          amount: 2,
          type: 'ANSWER_REWARD',
          description: 'Correct quiz answer',
        },
      });
    } else {
      pointsEarned = -1;

      // Update leaderboard (penalty for incorrect answer)
      await prisma.leaderboardEntry.upsert({
        where: { userId: session.user.id },
        update: {
          score: { increment: -1 },
          totalAnswers: { increment: 1 },
        },
        create: {
          userId: session.user.id,
          score: -1,
          correctAnswers: 0,
          totalAnswers: 1,
        },
      });
    }

    return {
      success: true,
      isCorrect,
      pointsEarned,
      coinsEarned,
    };
  } catch (error) {
    console.error('Error submitting quiz answer:', error);
    return { success: false, error: 'Failed to submit answer' };
  }
}

/**
 * Complete a quiz attempt and calculate final score
 */
export async function completeQuizAttempt(attemptId: string) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get attempt with all answers
    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: {
          include: {
            questions: true,
          },
        },
        answers: true,
      },
    });

    if (!attempt) {
      return { success: false, error: 'Quiz attempt not found' };
    }

    if (attempt.userId !== session.user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    if (attempt.completedAt) {
      return { success: false, error: 'Quiz already completed' };
    }

    // Check if all questions have been answered
    const totalQuestions = attempt.quiz.questions.length;
    const answeredQuestions = attempt.answers.length;

    if (answeredQuestions < totalQuestions) {
      return {
        success: false,
        error: `Please answer all questions. ${answeredQuestions}/${totalQuestions} answered.`,
      };
    }

    // Calculate final score
    const correctAnswers = attempt.answers.filter((a) => a.isCorrect).length;
    const isPerfect = correctAnswers === totalQuestions;

    // Calculate score: +10 per correct, -1 per incorrect
    const score = correctAnswers * 10 - (totalQuestions - correctAnswers);

    // Award perfect quiz bonus
    if (isPerfect) {
      // Award +50 bonus points to leaderboard
      await prisma.leaderboardEntry.update({
        where: { userId: session.user.id },
        data: {
          score: { increment: 50 },
        },
      });
    }

    // Update quiz attempt
    await prisma.quizAttempt.update({
      where: { id: attemptId },
      data: {
        completedAt: new Date(),
        score,
        isPerfect,
      },
    });

    // Update leaderboard quiz count
    await prisma.leaderboardEntry.update({
      where: { userId: session.user.id },
      data: {
        quizCount: { increment: 1 },
      },
    });

    // Check for achievements
    const achievementResult = await checkAchievements(session.user.id);

    return {
      success: true,
      score,
      correctAnswers,
      totalQuestions,
      isPerfect,
      bonusAwarded: isPerfect ? 50 : 0,
      newAchievements: achievementResult.newAchievements,
    };
  } catch (error) {
    console.error('Error completing quiz attempt:', error);
    return { success: false, error: 'Failed to complete quiz' };
  }
}
