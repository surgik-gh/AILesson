import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";

export default async function StudentDashboard() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "STUDENT") {
    redirect("/login");
  }

  // Fetch received lessons
  const receivedLessons = await prisma.sentLesson.findMany({
    where: {
      studentId: session.user.id,
    },
    include: {
      lesson: {
        include: {
          subject: true,
          creator: {
            select: {
              id: true,
              name: true,
            },
          },
          quiz: {
            select: {
              id: true,
            },
          },
        },
      },
      teacher: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      sentAt: "desc",
    },
    take: 5,
  });

  // Fetch all available lessons
  const availableLessons = await prisma.lesson.findMany({
    include: {
      subject: true,
      creator: {
        select: {
          id: true,
          name: true,
        },
      },
      quiz: {
        select: {
          id: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 6,
  });

  // Fetch recent achievements
  const recentAchievements = await prisma.userAchievement.findMany({
    where: {
      userId: session.user.id,
    },
    include: {
      achievement: true,
    },
    orderBy: {
      earnedAt: "desc",
    },
    take: 3,
  });

  // Fetch quiz stats
  const quizStats = await prisma.quizAttempt.aggregate({
    where: {
      userId: session.user.id,
      completedAt: { not: null },
    },
    _count: true,
    _avg: {
      score: true,
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/80">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Привет, {session.user.name}! 👋
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Готов к новым знаниям?
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 rounded-full bg-yellow-100 px-4 py-2 dark:bg-yellow-900/30">
                <span className="text-xl">💰</span>
                <span className="font-bold text-yellow-700 dark:text-yellow-400">
                  {session.user.wisdomCoins}
                </span>
              </div>
              <Link
                href="/settings"
                className="rounded-full bg-gray-100 p-2 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                ⚙️
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Quick Actions */}
        <section className="mb-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Link
              href="/student/lessons"
              className="group flex items-center gap-4 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-lg transition-all hover:shadow-xl hover:scale-[1.02]"
            >
              <div className="rounded-xl bg-white/20 p-3 text-3xl">📚</div>
              <div>
                <h3 className="font-semibold">Уроки</h3>
                <p className="text-sm text-blue-100">Изучать материалы</p>
              </div>
            </Link>

            <Link
              href="/student/create-lesson"
              className="group flex items-center gap-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 p-6 text-white shadow-lg transition-all hover:shadow-xl hover:scale-[1.02]"
            >
              <div className="rounded-xl bg-white/20 p-3 text-3xl">✏️</div>
              <div>
                <h3 className="font-semibold">Создать урок</h3>
                <p className="text-sm text-indigo-100">AI-генерация</p>
              </div>
            </Link>

            <Link
              href="/student/chat"
              className="group flex items-center gap-4 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-white shadow-lg transition-all hover:shadow-xl hover:scale-[1.02]"
            >
              <div className="rounded-xl bg-white/20 p-3 text-3xl">🤖</div>
              <div>
                <h3 className="font-semibold">AI Эксперт</h3>
                <p className="text-sm text-purple-100">Задать вопрос</p>
              </div>
            </Link>

            <Link
              href="/student/leaderboard"
              className="group flex items-center gap-4 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 p-6 text-white shadow-lg transition-all hover:shadow-xl hover:scale-[1.02]"
            >
              <div className="rounded-xl bg-white/20 p-3 text-3xl">🏆</div>
              <div>
                <h3 className="font-semibold">Рейтинг</h3>
                <p className="text-sm text-orange-100">Таблица лидеров</p>
              </div>
            </Link>

            <Link
              href="/student/achievements"
              className="group flex items-center gap-4 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 p-6 text-white shadow-lg transition-all hover:shadow-xl hover:scale-[1.02]"
            >
              <div className="rounded-xl bg-white/20 p-3 text-3xl">🎖️</div>
              <div>
                <h3 className="font-semibold">Достижения</h3>
                <p className="text-sm text-green-100">{recentAchievements.length} получено</p>
              </div>
            </Link>
          </div>
        </section>

        {/* Stats */}
        <section className="mb-8">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-white p-6 shadow-md dark:bg-gray-800">
              <p className="text-sm text-gray-600 dark:text-gray-400">Пройдено квизов</p>
              <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">
                {quizStats._count || 0}
              </p>
            </div>
            <div className="rounded-xl bg-white p-6 shadow-md dark:bg-gray-800">
              <p className="text-sm text-gray-600 dark:text-gray-400">Средний балл</p>
              <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">
                {quizStats._avg?.score ? Math.round(quizStats._avg.score) : 0}%
              </p>
            </div>
            <div className="rounded-xl bg-white p-6 shadow-md dark:bg-gray-800">
              <p className="text-sm text-gray-600 dark:text-gray-400">Достижений</p>
              <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">
                {recentAchievements.length}
              </p>
            </div>
          </div>
        </section>

        {/* Lessons from Teachers */}
        {receivedLessons.length > 0 && (
          <section className="mb-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                📩 Уроки от учителей
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {receivedLessons.map((sentLesson) => (
                <Link
                  key={sentLesson.id}
                  href={`/student/lessons/${sentLesson.lesson.id}`}
                >
                  <article className="group rounded-xl bg-white p-5 shadow-md transition-all hover:shadow-lg dark:bg-gray-800">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                        {sentLesson.lesson.subject.icon} {sentLesson.lesson.subject.name}
                      </span>
                      {sentLesson.lesson.quiz && (
                        <span className="text-xs text-green-600 dark:text-green-400">✓ Квиз</span>
                      )}
                    </div>
                    <h3 className="mb-2 font-semibold text-gray-900 group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400">
                      {sentLesson.lesson.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      От: {sentLesson.teacher.name}
                    </p>
                  </article>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Available Lessons */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              📚 Доступные уроки
            </h2>
            <Link
              href="/student/lessons"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
            >
              Все уроки →
            </Link>
          </div>
          
          {availableLessons.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {availableLessons.map((lesson) => (
                <Link key={lesson.id} href={`/student/lessons/${lesson.id}`}>
                  <article className="group rounded-xl bg-white p-5 shadow-md transition-all hover:shadow-lg dark:bg-gray-800">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
                        {lesson.subject.icon} {lesson.subject.name}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        lesson.difficulty === 'BEGINNER' 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
                          : lesson.difficulty === 'INTERMEDIATE'
                          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                      }`}>
                        {lesson.difficulty === 'BEGINNER' ? 'Начальный' : 
                         lesson.difficulty === 'INTERMEDIATE' ? 'Средний' : 'Продвинутый'}
                      </span>
                    </div>
                    <h3 className="mb-2 font-semibold text-gray-900 group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400">
                      {lesson.title}
                    </h3>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {lesson.creator.name}
                      </p>
                      {lesson.quiz && (
                        <span className="text-xs text-green-600 dark:text-green-400">✓ Квиз</span>
                      )}
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-xl bg-white p-8 text-center shadow-md dark:bg-gray-800">
              <div className="mb-4 text-5xl">📚</div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                Пока нет уроков
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Уроки появятся здесь, когда учителя их создадут
              </p>
            </div>
          )}
        </section>

        {/* Recent Achievements */}
        {recentAchievements.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
              🎖️ Последние достижения
            </h2>
            <div className="flex flex-wrap gap-3">
              {recentAchievements.map((ua) => (
                <div
                  key={ua.id}
                  className="flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-md dark:bg-gray-800"
                >
                  <span className="text-2xl">{ua.achievement.icon}</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {ua.achievement.description}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
