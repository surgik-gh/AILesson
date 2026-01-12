import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

// PUT /api/subjects/[id] - Update a subject
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    // Check if subject exists
    const existingSubject = await prisma.subject.findUnique({
      where: { id },
    });

    if (!existingSubject) {
      return NextResponse.json(
        { success: false, error: "Subject not found" },
        { status: 404 }
      );
    }

    // Check if new name conflicts with another subject
    if (name.trim() !== existingSubject.name) {
      const nameConflict = await prisma.subject.findUnique({
        where: { name: name.trim() },
      });

      if (nameConflict) {
        return NextResponse.json(
          { success: false, error: "Subject with this name already exists" },
          { status: 400 }
        );
      }
    }

    const subject = await prisma.subject.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        icon: icon?.trim() || null,
      },
    });

    return NextResponse.json({ success: true, subject });
  } catch (error) {
    console.error("Error updating subject:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update subject" },
      { status: 500 }
    );
  }
}

// DELETE /api/subjects/[id] - Delete a subject
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Check if subject exists
    const existingSubject = await prisma.subject.findUnique({
      where: { id },
      include: {
        _count: {
          select: { lessons: true },
        },
      },
    });

    if (!existingSubject) {
      return NextResponse.json(
        { success: false, error: "Subject not found" },
        { status: 404 }
      );
    }

    // Check if subject has associated lessons
    if (existingSubject._count.lessons > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete subject with ${existingSubject._count.lessons} associated lesson(s)`,
        },
        { status: 400 }
      );
    }

    await prisma.subject.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Subject deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting subject:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete subject" },
      { status: 500 }
    );
  }
}
