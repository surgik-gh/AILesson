import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { getUserAchievements } from '@/lib/utils/achievements';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const achievements = await getUserAchievements(session.user.id);

    return NextResponse.json({
      success: true,
      achievements,
    });
  } catch (error) {
    console.error('Error fetching achievements:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
