import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  try {
    // Check authentication
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch user's experts
    const experts = await prisma.expert.findMany({
      where: {
        ownerId: session.user.id,
      },
      select: {
        id: true,
        name: true,
        personality: true,
        communicationStyle: true,
        appearance: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      experts,
    });
  } catch (error) {
    console.error("Expert list error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch experts",
      },
      { status: 500 }
    );
  }
}
