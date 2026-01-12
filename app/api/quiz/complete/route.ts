import { NextRequest, NextResponse } from 'next/server';
import { completeQuizAttempt } from '@/app/actions/quiz';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { attemptId } = body;

    if (!attemptId) {
      return NextResponse.json(
        { success: false, error: 'Missing attemptId' },
        { status: 400 }
      );
    }

    const result = await completeQuizAttempt(attemptId);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in complete quiz API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
