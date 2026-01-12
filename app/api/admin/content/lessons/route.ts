import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

// GET /api/admin/content/lessons - List all lessons
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const lessons = await prisma.lesson.findMany({
      include: {
        creator: {
          select: {
            name: true,
            email: true,
          },
        },
        subject: {
          select: {
            name: true,
          },
        },
        quiz: {
          select: {
            id: true,
            questions: {
              select: {
                id: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ lessons });
  } catch (error) {
    console.error("Failed to fetch lessons:", error);
    return NextResponse.json(
      { error: "Failed to fetch lessons" },
      { status: 500 }
    );
  }
}
