import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';
import { aiService } from '@/lib/ai';

interface CreateLessonRequest {
  subjectId: string;
  material: string;
}

interface CreateLessonResponse {
  success: boolean;
  lessonId?: string;
  error?: string;
  code?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<CreateLessonResponse>> {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Не авторизован', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // All authenticated users can create lessons

    // Parse request body
    const body: CreateLessonRequest = await request.json();
    const { subjectId, material } = body;

    // Validate input
    if (!subjectId || !material?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Предмет и материал обязательны', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Check if subject exists
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
    });

    if (!subject) {
      return NextResponse.json(
        { success: false, error: 'Предмет не найден', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Check wisdom coins (unless admin)
    if (session.user.role !== 'ADMIN') {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { wisdomCoins: true },
      });

      if (!user || user.wisdomCoins < 20) {
        return NextResponse.json(
          {
            success: false,
            error: `Недостаточно монет мудрости. У вас ${user?.wisdomCoins || 0}, требуется 20.`,
            code: 'INSUFFICIENT_FUNDS',
          },
          { status: 400 }
        );
      }
    }

    // Generate lesson using AI
    let lessonData;
    try {
      lessonData = await aiService.generateLesson(material, subject.name);
    } catch (aiError) {
      console.error('AI service error:', aiError);
      return NextResponse.json(
        {
          success: false,
          error: 'Не удалось сгенерировать содержание урока. Попробуйте снова.',
          code: 'AI_SERVICE_ERROR',
        },
        { status: 500 }
      );
    }

    // Generate quiz using AI
    let quizData;
    try {
      quizData = await aiService.generateQuiz(lessonData.content, lessonData.title);
    } catch (aiError) {
      console.error('AI quiz generation error:', aiError);
      return NextResponse.json(
        {
          success: false,
          error: 'Не удалось сгенерировать тест. Попробуйте снова.',
          code: 'AI_SERVICE_ERROR',
        },
        { status: 500 }
      );
    }

    // Create lesson in database with transaction
    const lesson = await prisma.$transaction(async (tx) => {
      // Create lesson
      const newLesson = await tx.lesson.create({
        data: {
          title: lessonData.title,
          content: lessonData.content,
          keyPoints: lessonData.keyPoints,
          difficulty: lessonData.difficulty,
          subjectId: subjectId,
          creatorId: session.user.id,
        },
      });

      // Create quiz linked to lesson
      const quiz = await tx.quiz.create({
        data: {
          lessonId: newLesson.id,
          questions: {
            create: quizData.questions.map((q) => ({
              type: q.type,
              text: q.text,
              correctAnswer: q.correctAnswer,
              options: q.options ? q.options : Prisma.JsonNull,
              order: q.order,
            })),
          },
        },
      });

      // Deduct wisdom coins (unless admin)
      if (session.user.role !== 'ADMIN') {
        await tx.user.update({
          where: { id: session.user.id },
          data: { wisdomCoins: { decrement: 20 } },
        });

        // Create transaction record
        await tx.tokenTransaction.create({
          data: {
            userId: session.user.id,
            amount: -20,
            type: 'LESSON_COST',
            description: `Created lesson: ${newLesson.title}`,
          },
        });
      }

      return newLesson;
    });

    return NextResponse.json({
      success: true,
      lessonId: lesson.id,
    });
  } catch (error) {
    console.error('Lesson creation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Не удалось создать урок',
        code: 'DATABASE_ERROR',
      },
      { status: 500 }
    );
  }
}
