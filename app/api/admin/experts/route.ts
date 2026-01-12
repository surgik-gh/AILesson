import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

// GET /api/admin/experts - List all experts
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const experts = await prisma.expert.findMany({
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            usersUsingThis: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ experts });
  } catch (error) {
    console.error("Failed to fetch experts:", error);
    return NextResponse.json(
      { error: "Failed to fetch experts" },
      { status: 500 }
    );
  }
}

// POST /api/admin/experts - Create new expert
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, personality, communicationStyle, appearance, ownerId } = body;

    if (!name || !personality || !communicationStyle || !appearance || !ownerId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const expert = await prisma.expert.create({
      data: {
        name,
        personality,
        communicationStyle,
        appearance,
        ownerId,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            usersUsingThis: true,
          },
        },
      },
    });

    return NextResponse.json({ expert }, { status: 201 });
  } catch (error) {
    console.error("Failed to create expert:", error);
    return NextResponse.json(
      { error: "Failed to create expert" },
      { status: 500 }
    );
  }
}
