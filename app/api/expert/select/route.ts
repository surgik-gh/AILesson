import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse request body
    const { expertId } = await request.json();

    if (!expertId) {
      return NextResponse.json(
        { error: "Expert ID is required" },
        { status: 400 }
      );
    }

    // Verify expert exists and belongs to user
    const expert = await prisma.expert.findUnique({
      where: { id: expertId },
    });

    if (!expert) {
      return NextResponse.json(
        { error: "Expert not found" },
        { status: 404 }
      );
    }

    if (expert.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only select your own experts" },
        { status: 403 }
      );
    }

    // Update user's selectedExpertId
    await prisma.user.update({
      where: { id: session.user.id },
      data: { selectedExpertId: expertId },
    });

    return NextResponse.json({
      success: true,
      message: "Expert selected successfully",
    });
  } catch (error) {
    console.error("Expert selection error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to select expert",
      },
      { status: 500 }
    );
  }
}
