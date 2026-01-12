import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (session.user.role !== "TEACHER" && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Only teachers and admins can view student progress" },
        { status: 403 }
      );
    }

    const { id: studentId } = await params;

    // Verify student exists and is a student
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        wisdomCoins: true,
        createdAt: true,
      },
    });

    if (!student) {
      return NextResponse.json(
        { success: false, error: "Student not found" },
        { status: 404 }
      );
    }

    if (student.role !== "STUDENT") {
      return NextResponse.json(
        { success: false, error: "User is not a student" },
        { status: 400 }
      );
    }

    // Get completed lessons (lessons with completed quiz attempts)
    const completedQuizAttempts = await prisma.quizAttempt.findMany({
      where: {
        userId: studentId,
        completedAt: { not: null },
      },
      include: {
        quiz: {
          include: {
            lesson: {
              include: {
                subject: true,
              },
            },
          },
        },
        answers: {
          include: {
            question: true,
          },
        },
      },
      orderBy: {
        completedAt: "desc",
      },
    });

    // Get quiz statistics
    const totalQuizzes = completedQuizAttempts.length;
    const perfectQuizzes = completedQuizAttempts.filter((attempt) => attempt.isPerfect).length;
    
    let totalAnswers = 0;
    let correctAnswers = 0;
    
    completedQuizAttempts.forEach((attempt) => {
      attempt.answers.forEach((answer) => {
        totalAnswers++;
        if (answer.isCorrect) {
          correctAnswers++;
        }
      });
    });

    const correctAnswerPercentage = totalAnswers > 0 
      ? Math.round((correctAnswers / totalAnswers) * 100) 
      : 0;

    // Get earned achievements
    const achievements = await prisma.userAchievement.findMany({
      where: {
        userId: studentId,
      },
      include: {
        achievement: true,
      },
      orderBy: {
        earnedAt: "desc",
      },
    });

    // Get leaderboard entry
    const leaderboardEntry = await prisma.leaderboardEntry.findUnique({
      where: {
        userId: studentId,
      },
    });

    // Get received lessons
    const receivedLessons = await prisma.sentLesson.findMany({
      where: {
        studentId,
      },
      include: {
        lesson: {
          include: {
            subject: true,
          },
        },
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        sentAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      student,
      progress: {
        totalQuizzes,
        perfectQuizzes,
        totalAnswers,
        correctAnswers,
        correctAnswerPercentage,
        completedLessons: completedQuizAttempts.map((attempt) => ({
          id: attempt.id,
          lessonTitle: attempt.quiz.lesson.title,
          subjectName: attempt.quiz.lesson.subject.name,
          score: attempt.score,
          isPerfect: attempt.isPerfect,
          completedAt: attempt.completedAt,
          correctAnswers: attempt.answers.filter((a) => a.isCorrect).length,
          totalQuestions: attempt.answers.length,
        })),
        achievements: achievements.map((ua) => ({
          id: ua.id,
          name: ua.achievement.name,
          description: ua.achievement.description,
          icon: ua.achievement.icon,
          earnedAt: ua.earnedAt,
        })),
        leaderboard: leaderboardEntry
          ? {
              score: leaderboardEntry.score,
              quizCount: leaderboardEntry.quizCount,
              correctAnswers: leaderboardEntry.correctAnswers,
              totalAnswers: leaderboardEntry.totalAnswers,
            }
          : null,
        receivedLessons: receivedLessons.map((sl) => ({
          id: sl.id,
          lessonTitle: sl.lesson.title,
          subjectName: sl.lesson.subject.name,
          teacherName: sl.teacher.name,
          sentAt: sl.sentAt,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching student progress:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch student progress" },
      { status: 500 }
    );
  }
}
