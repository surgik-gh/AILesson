import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { aiService } from "@/lib/ai";

const CHAT_COST = 5; // Cost per message in wisdom coins

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Only students can use chat
    if (session.user.role !== "STUDENT") {
      return NextResponse.json(
        { error: "Only students can use chat" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { message, expertId } = body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    if (!expertId || typeof expertId !== "string") {
      return NextResponse.json(
        { error: "Expert ID is required" },
        { status: 400 }
      );
    }

    // Get user with current balance
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        wisdomCoins: true,
        selectedExpertId: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Validate user has sufficient coins
    if (user.wisdomCoins < CHAT_COST) {
      return NextResponse.json(
        { 
          error: `Insufficient wisdom coins. You need ${CHAT_COST} coins to send a message.`,
          currentBalance: user.wisdomCoins,
          required: CHAT_COST,
        },
        { status: 400 }
      );
    }

    // Verify expert exists and belongs to user or is selected by user
    const expert = await prisma.expert.findUnique({
      where: { id: expertId },
      select: {
        id: true,
        name: true,
        personality: true,
        communicationStyle: true,
        ownerId: true,
      },
    });

    if (!expert) {
      return NextResponse.json(
        { error: "Expert not found" },
        { status: 404 }
      );
    }

    // Verify this is the user's selected expert
    if (user.selectedExpertId !== expertId) {
      return NextResponse.json(
        { error: "This is not your selected expert" },
        { status: 403 }
      );
    }

    // Get recent chat history for context (last 10 messages)
    const recentMessages = await prisma.chatMessage.findMany({
      where: {
        userId: user.id,
        expertId: expertId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
      select: {
        content: true,
        isFromUser: true,
      },
    });

    // Convert to chat history format (reverse to get chronological order)
    const chatHistory = recentMessages
      .reverse()
      .map((msg) => ({
        role: msg.isFromUser ? ('user' as const) : ('assistant' as const),
        content: msg.content,
      }));

    // Use a transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Deduct wisdom coins
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          wisdomCoins: {
            decrement: CHAT_COST,
          },
        },
        select: {
          wisdomCoins: true,
        },
      });

      // Create token transaction record
      await tx.tokenTransaction.create({
        data: {
          userId: user.id,
          amount: -CHAT_COST,
          type: "CHAT_COST",
          description: `Chat message to ${expert.name}`,
        },
      });

      // Save user message to database
      const userMessage = await tx.chatMessage.create({
        data: {
          userId: user.id,
          expertId: expertId,
          content: message.trim(),
          isFromUser: true,
        },
        select: {
          id: true,
          content: true,
          isFromUser: true,
          createdAt: true,
        },
      });

      // Generate AI response
      let expertResponse: string;
      try {
        expertResponse = await aiService.generateChatResponse(
          message.trim(),
          expert.personality,
          expert.communicationStyle,
          expert.name,
          chatHistory
        );
      } catch (aiError) {
        console.error("AI service failed:", aiError);
        // Provide a fallback response
        expertResponse = `Извините, у меня возникли технические проблемы. Пожалуйста, попробуйте задать вопрос позже.`;
      }

      // Save expert response to database
      const expertMessage = await tx.chatMessage.create({
        data: {
          userId: user.id,
          expertId: expertId,
          content: expertResponse,
          isFromUser: false,
        },
        select: {
          id: true,
          content: true,
          isFromUser: true,
          createdAt: true,
        },
      });

      return {
        userMessage,
        expertMessage,
        newBalance: updatedUser.wisdomCoins,
      };
    });

    return NextResponse.json({
      userMessage: {
        ...result.userMessage,
        createdAt: result.userMessage.createdAt.toISOString(),
      },
      expertMessage: {
        ...result.expertMessage,
        createdAt: result.expertMessage.createdAt.toISOString(),
      },
      newBalance: result.newBalance,
    });
  } catch (error) {
    console.error("Failed to send chat message:", error);
    return NextResponse.json(
      { error: "Failed to send message. Please try again." },
      { status: 500 }
    );
  }
}
