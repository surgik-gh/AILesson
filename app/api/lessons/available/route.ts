import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (session.user.role !== "STUDENT") {
      return NextResponse.json(
        { success: false, error: "Only students can view available lessons" },
        { status: 403 }
      );
    }

    // Get all lessons sent to this student
    const receivedLessons = await prisma.sentLesson.findMany({
      where: {
        studentId: session.user.id,
      },
      include: {
        lesson: {
          include: {
            subject: true,
            creator: {
              select: {
                id: true,
                name: true,
              },
            },
            quiz: {
              select: {
                id: true,
              },
            },
          },
        },
        teacher: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        sentAt: "desc",
      },
    });

    // Get all public lessons (for now, all lessons are available)
    const allLessons = await prisma.lesson.findMany({
      include: {
        subject: true,
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
        quiz: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Get recent achievements
    const recentAchievements = await prisma.userAchievement.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        achievement: true,
      },
      orderBy: {
        earnedAt: "desc",
      },
      take: 5,
    });

    return NextResponse.json({
      success: true,
      lessons: allLessons, // Changed from allLessons to lessons to match SWR hook
      receivedLessons: receivedLessons.map((sl) => sl.lesson),
      recentAchievements,
    });
  } catch (error) {
    console.error("Error fetching available lessons:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch lessons" },
      { status: 500 }
    );
  }
}
