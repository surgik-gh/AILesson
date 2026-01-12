import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import bcrypt from "bcryptjs";

// GET /api/admin/users - List all users
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        wisdomCoins: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

// POST /api/admin/users - Create new user
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, password, role, wisdomCoins } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Determine wisdom coins based on role if not specified
    let finalWisdomCoins = wisdomCoins;
    if (finalWisdomCoins === undefined || finalWisdomCoins === null) {
      finalWisdomCoins =
        role === "STUDENT" ? 150 : role === "TEACHER" ? 250 : 999999;
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        wisdomCoins: finalWisdomCoins,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        wisdomCoins: true,
        createdAt: true,
      },
    });

    // Create initial transaction
    await prisma.tokenTransaction.create({
      data: {
        userId: user.id,
        amount: finalWisdomCoins,
        type: "INITIAL",
        description: "Initial wisdom coins allocation",
      },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error("Failed to create user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
