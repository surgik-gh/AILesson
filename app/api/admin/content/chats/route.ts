import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

// GET /api/admin/content/chats - List all chat conversations
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all users who have chat messages
    const usersWithChats = await prisma.user.findMany({
      where: {
        chatMessages: {
          some: {},
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        selectedExpert: {
          select: {
            name: true,
          },
        },
        chatMessages: {
          select: {
            id: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
        _count: {
          select: {
            chatMessages: true,
          },
        },
      },
    });

    const conversations = usersWithChats.map((user) => ({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      expertName: user.selectedExpert?.name || "No expert selected",
      messageCount: user._count.chatMessages,
      lastMessageAt: user.chatMessages[0]?.createdAt || new Date().toISOString(),
    }));

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error("Failed to fetch conversations:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}
