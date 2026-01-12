import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";

export default async function TeacherDashboard() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "TEACHER") {
    redirect("/login");
  }

  // Fetch teacher's lessons
  const myLessons = await prisma.lesson.findMany({
    where: {
      creatorId: session.user.id,
    },
    include: {
      subject: true,
      quiz: {
        select: {
          id: true,
          _count: {
            select: {
              attempts: true,
            },
          },
        },
      },
      _count: {
        select: {
          sentTo: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 5,
  });

  // Fetch students count
  const studentsCount = await prisma.sentLesson.groupBy({
    by: ['studentId'],
    where: {
      teacherId: session.user.id,
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
                Панель учителя
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/teacher/create-lesson"
              className="group flex items-center gap-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 p-6 text-white shadow-lg transition-all hover:shadow-xl hover:scale-[1.02]"
            >
              <div className="rounded-xl bg-white/20 p-3 text-3xl">✏️</div>
              <div>
                <h3 className="font-semibold">Создать урок</h3>
                <p className="text-sm text-indigo-100">AI-генерация</p>
              </div>
            </Link>

            <Link
              href="/teacher/lessons"
              className="group flex items-center gap-4 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-white shadow-lg transition-all hover:shadow-xl hover:scale-[1.02]"
            >
              <div className="rounded-xl bg-white/20 p-3 text-3xl">📚</div>
              <div>
                <h3 className="font-semibold">Мои уроки</h3>
                <p className="text-sm text-purple-100">{myLessons.length} создано</p>
              </div>
            </Link>

            <Link
              href="/teacher/students"
              className="group flex items-center gap-4 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 p-6 text-white shadow-lg transition-all hover:shadow-xl hover:scale-[1.02]"
            >
              <div className="rounded-xl bg-white/20 p-3 text-3xl">👥</div>
              <div>
                <h3 className="font-semibold">Ученики</h3>
                <p className="text-sm text-green-100">{studentsCount.length} учеников</p>
              </div>
            </Link>

            <div className="flex items-center gap-4 rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800">
              <div className="rounded-xl bg-yellow-100 p-3 text-3xl dark:bg-yellow-900/30">💰</div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Баланс</h3>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {session.user.wisdomCoins}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Recent Lessons */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              📚 Последние уроки
            </h2>
            <Link
              href="/teacher/lessons"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
            >
              Все уроки →
            </Link>
          </div>

          {myLessons.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {myLessons.map((lesson) => (
                <article
                  key={lesson.id}
                  className="rounded-xl bg-white p-5 shadow-md dark:bg-gray-800"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
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
                  <h3 className="mb-3 font-semibold text-gray-900 dark:text-white">
                    {lesson.title}
                  </h3>
                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                    <span>👥 {lesson._count.sentTo} учеников</span>
                    {lesson.quiz && (
                      <span>📝 {lesson.quiz._count.attempts} попыток</span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-xl bg-white p-8 text-center shadow-md dark:bg-gray-800">
              <div className="mb-4 text-5xl">✏️</div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                Создайте свой первый урок
              </h3>
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                Используйте AI для генерации уроков и квизов
              </p>
              <Link
                href="/teacher/create-lesson"
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 font-medium text-white hover:bg-indigo-700"
              >
                ✏️ Создать урок
              </Link>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
