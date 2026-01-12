import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

// PATCH /api/admin/experts/[id] - Update expert
export async function PATCH(
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
    const { name, personality, communicationStyle, appearance, ownerId } = body;

    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (personality !== undefined) updateData.personality = personality;
    if (communicationStyle !== undefined)
      updateData.communicationStyle = communicationStyle;
    if (appearance !== undefined) updateData.appearance = appearance;
    if (ownerId !== undefined) updateData.ownerId = ownerId;

    const expert = await prisma.expert.update({
      where: { id: id },
      data: updateData,
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

    return NextResponse.json({ expert });
  } catch (error) {
    console.error("Failed to update expert:", error);
    return NextResponse.json(
      { error: "Failed to update expert" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/experts/[id] - Delete expert
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
        const { id } = await params;
const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if any users are using this expert
    const expert = await prisma.expert.findUnique({
      where: { id: id },
      include: {
        _count: {
          select: {
            usersUsingThis: true,
          },
        },
      },
    });

    if (expert && expert._count.usersUsingThis > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete expert: ${expert._count.usersUsingThis} users are currently using this expert`,
        },
        { status: 400 }
      );
    }

    await prisma.expert.delete({
      where: { id: id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete expert:", error);
    return NextResponse.json(
      { error: "Failed to delete expert" },
      { status: 500 }
    );
  }
}
