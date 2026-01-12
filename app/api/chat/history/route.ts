import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const expertId = searchParams.get("expertId");

    if (!expertId) {
      return NextResponse.json(
        { error: "Expert ID is required" },
        { status: 400 }
      );
    }

    // Get chat messages for this user and expert
    const messages = await prisma.chatMessage.findMany({
      where: {
        userId: session.user.id,
        expertId: expertId,
      },
      orderBy: {
        createdAt: "asc",
      },
      select: {
        id: true,
        content: true,
        isFromUser: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      messages: messages.map((msg) => ({
        ...msg,
        createdAt: msg.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Failed to get chat history:", error);
    return NextResponse.json(
      { error: "Failed to get chat history" },
      { status: 500 }
    );
  }
}
