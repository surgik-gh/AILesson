import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

// POST /api/admin/experts/assign - Assign expert to user
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { userId, expertId } = body;

    if (!userId || !expertId) {
      return NextResponse.json(
        { error: "Missing userId or expertId" },
        { status: 400 }
      );
    }

    // Verify expert exists
    const expert = await prisma.expert.findUnique({
      where: { id: expertId },
    });

    if (!expert) {
      return NextResponse.json({ error: "Expert not found" }, { status: 404 });
    }

    // Assign expert to user
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        selectedExpertId: expertId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        selectedExpert: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Failed to assign expert:", error);
    return NextResponse.json(
      { error: "Failed to assign expert" },
      { status: 500 }
    );
  }
}
