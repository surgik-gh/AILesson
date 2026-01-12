import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
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
        { success: false, error: "Only teachers and admins can share lessons" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { lessonId, studentIds } = body;

    if (!lessonId || !Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "Invalid request data" },
        { status: 400 }
      );
    }

    // Verify lesson exists and belongs to teacher (or is admin)
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!lesson) {
      return NextResponse.json(
        { success: false, error: "Lesson not found" },
        { status: 404 }
      );
    }

    if (lesson.creatorId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "You can only share your own lessons" },
        { status: 403 }
      );
    }

    // Create SentLesson records for each student
    const sentLessons = await Promise.all(
      studentIds.map(async (studentId: string) => {
        // Check if already sent
        const existing = await prisma.sentLesson.findUnique({
          where: {
            lessonId_studentId: {
              lessonId,
              studentId,
            },
          },
        });

        if (existing) {
          return existing;
        }

        return prisma.sentLesson.create({
          data: {
            lessonId,
            studentId,
            teacherId: session.user.id,
          },
        });
      })
    );

    return NextResponse.json({
      success: true,
      sentLessons,
      message: `Lesson shared with ${sentLessons.length} student(s)`,
    });
  } catch (error) {
    console.error("Error sharing lesson:", error);
    return NextResponse.json(
      { success: false, error: "Failed to share lesson" },
      { status: 500 }
    );
  }
}
