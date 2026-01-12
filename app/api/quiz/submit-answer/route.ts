import { NextRequest, NextResponse } from 'next/server';
import { submitQuizAnswer } from '@/app/actions/quiz';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { attemptId, questionId, answer } = body;

    if (!attemptId || !questionId || answer === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await submitQuizAnswer(attemptId, questionId, answer);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in submit-answer API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
