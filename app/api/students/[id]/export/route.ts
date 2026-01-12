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
        { success: false, error: "Only teachers and admins can export student progress" },
        { status: 403 }
      );
    }

    const { id: studentId } = await params;

    // Get student data
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        name: true,
        email: true,
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

    // Get completed quiz attempts
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
        answers: true,
      },
      orderBy: {
        completedAt: "desc",
      },
    });

    // Get achievements
    const achievements = await prisma.userAchievement.findMany({
      where: { userId: studentId },
      include: {
        achievement: true,
      },
      orderBy: {
        earnedAt: "desc",
      },
    });

    // Get leaderboard entry
    const leaderboardEntry = await prisma.leaderboardEntry.findUnique({
      where: { userId: studentId },
    });

    // Generate CSV content
    let csv = "Student Progress Report\n\n";
    csv += "Student Information\n";
    csv += `Name,${student.name}\n`;
    csv += `Email,${student.email}\n`;
    csv += `Wisdom Coins,${student.wisdomCoins}\n`;
    csv += `Member Since,${new Date(student.createdAt).toLocaleDateString()}\n\n`;

    // Overall Statistics
    csv += "Overall Statistics\n";
    csv += `Total Quizzes Completed,${completedQuizAttempts.length}\n`;
    csv += `Perfect Quizzes,${completedQuizAttempts.filter((a) => a.isPerfect).length}\n`;
    
    let totalAnswers = 0;
    let correctAnswers = 0;
    completedQuizAttempts.forEach((attempt) => {
      attempt.answers.forEach((answer) => {
        totalAnswers++;
        if (answer.isCorrect) correctAnswers++;
      });
    });
    
    const correctPercentage = totalAnswers > 0 
      ? Math.round((correctAnswers / totalAnswers) * 100) 
      : 0;
    
    csv += `Total Answers,${totalAnswers}\n`;
    csv += `Correct Answers,${correctAnswers}\n`;
    csv += `Correct Answer Percentage,${correctPercentage}%\n`;
    
    if (leaderboardEntry) {
      csv += `Current Leaderboard Score,${leaderboardEntry.score}\n`;
    }
    
    csv += "\n";

    // Completed Lessons
    csv += "Completed Lessons\n";
    csv += "Lesson Title,Subject,Score,Perfect,Completed Date,Correct Answers,Total Questions\n";
    
    completedQuizAttempts.forEach((attempt) => {
      const correctCount = attempt.answers.filter((a) => a.isCorrect).length;
      csv += `"${attempt.quiz.lesson.title}",`;
      csv += `${attempt.quiz.lesson.subject.name},`;
      csv += `${attempt.score},`;
      csv += `${attempt.isPerfect ? "Yes" : "No"},`;
      csv += `${new Date(attempt.completedAt!).toLocaleDateString()},`;
      csv += `${correctCount},`;
      csv += `${attempt.answers.length}\n`;
    });
    
    csv += "\n";

    // Achievements
    csv += "Achievements\n";
    csv += "Achievement Name,Description,Earned Date\n";
    
    achievements.forEach((ua) => {
      csv += `"${ua.achievement.name}",`;
      csv += `"${ua.achievement.description}",`;
      csv += `${new Date(ua.earnedAt).toLocaleDateString()}\n`;
    });

    // Return CSV file
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="student-progress-${student.name.replace(/\s+/g, "-")}-${Date.now()}.csv"`,
      },
    });
  } catch (error) {
    console.error("Error exporting student progress:", error);
    return NextResponse.json(
      { success: false, error: "Failed to export student progress" },
      { status: 500 }
    );
  }
}
