import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user with selected expert
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        selectedExpert: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      expert: user.selectedExpert,
    });
  } catch (error) {
    console.error("Failed to get selected expert:", error);
    return NextResponse.json(
      { error: "Failed to get selected expert" },
      { status: 500 }
    );
  }
}
