import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

// POST /api/admin/content/lessons/[id]/flag - Flag lesson for review
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
        const { id } = await params;
const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { reason } = body;

    // In a real application, you would store this flag in a separate table
    // For now, we'll just log it
    console.log(`Lesson ${id} flagged by admin ${session.user.id}: ${reason}`);

    // You could also add a "flagged" field to the Lesson model
    // and update it here

    return NextResponse.json({ success: true, message: "Lesson flagged successfully" });
  } catch (error) {
    console.error("Failed to flag lesson:", error);
    return NextResponse.json(
      { error: "Failed to flag lesson" },
      { status: 500 }
    );
  }
}
