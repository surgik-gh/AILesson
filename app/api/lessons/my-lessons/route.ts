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

    if (session.user.role !== "TEACHER" && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Only teachers and admins can view their lessons" },
        { status: 403 }
      );
    }

    // Get all lessons created by this teacher
    const lessons = await prisma.lesson.findMany({
      where: {
        creatorId: session.user.id,
      },
      include: {
        subject: true,
        sentTo: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      lessons,
    });
  } catch (error) {
    console.error("Error fetching lessons:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch lessons" },
      { status: 500 }
    );
  }
}
