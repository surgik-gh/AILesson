import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    if (session.user.role === 'TEACHER') {
      const materials = await prisma.readingMaterial.findMany({
        where: {
          teacherId: session.user.id,
          ...(category ? { category: category as any } : {}),
        },
        include: {
          assignedTo: { include: { student: { select: { id: true, name: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json({ success: true, materials });
    }

    // For students - get assigned materials
    const assignments = await prisma.readingAssignment.findMany({
      where: {
        studentId: session.user.id,
        ...(category ? { material: { category: category as any } } : {}),
      },
      include: {
        material: { include: { teacher: { select: { id: true, name: true } } } },
      },
      orderBy: { assignedAt: 'desc' },
    });
    return NextResponse.json({ success: true, assignments });
  } catch (error) {
    console.error('Error fetching reading materials:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch materials' }, { status: 500 });
  }
}


export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'TEACHER' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Only teachers can create materials' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, content, url, category, dueDate, studentIds } = body;

    if (!title || !category) {
      return NextResponse.json({ success: false, error: 'Title and category are required' }, { status: 400 });
    }

    const material = await prisma.readingMaterial.create({
      data: {
        title,
        description,
        content,
        url,
        category,
        dueDate: dueDate ? new Date(dueDate) : null,
        teacherId: session.user.id,
        assignedTo: studentIds?.length ? {
          create: studentIds.map((studentId: string) => ({ studentId })),
        } : undefined,
      },
      include: {
        assignedTo: { include: { student: { select: { id: true, name: true } } } },
      },
    });

    return NextResponse.json({ success: true, material });
  } catch (error) {
    console.error('Error creating reading material:', error);
    return NextResponse.json({ success: false, error: 'Failed to create material' }, { status: 500 });
  }
}
