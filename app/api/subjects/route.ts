import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

// GET /api/subjects - List all subjects
export async function GET() {
  try {
    const subjects = await prisma.subject.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { lessons: true },
        },
      },
    });

    return NextResponse.json({ success: true, subjects });
  } catch (error) {
    console.error("Error fetching subjects:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch subjects" },
      { status: 500 }
    );
  }
}

// POST /api/subjects - Create a new subject
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, description, icon } = body;

    // Validation
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Subject name is required" },
        { status: 400 }
      );
    }

    // Check if subject already exists
    const existingSubject = await prisma.subject.findUnique({
      where: { name: name.trim() },
    });

    if (existingSubject) {
      return NextResponse.json(
        { success: false, error: "Subject with this name already exists" },
        { status: 400 }
      );
    }

    const subject = await prisma.subject.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        icon: icon?.trim() || null,
      },
    });

    return NextResponse.json({ success: true, subject }, { status: 201 });
  } catch (error) {
    console.error("Error creating subject:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create subject" },
      { status: 500 }
    );
  }
}
