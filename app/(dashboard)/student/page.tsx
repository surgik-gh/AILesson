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

  // Fetch all available lessons grouped by subject
  const subjects = await prisma.subject.findMany({
    include: {
      lessons: {
        include: {
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
        take: 3,
      },
    },
    orderBy: {
      name: "asc",
    },
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-8 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Student Dashboard
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Welcome back, {session.user.name}!
          </p>
        </header>

        <main id="main-content">
          {/* Stats Cards */}
          <section aria-labelledby="stats-heading" className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <h2 id="stats-heading" className="sr-only">Dashboard Statistics</h2>
            <div className="rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800" role="region" aria-label="Wisdom Coins Balance">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Wisdom Coins
              </h3>
              <p className="mt-2 text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                {session.user.wisdomCoins}
              </p>
            </div>

            <Link href="/student/achievements" aria-label="View all achievements">
              <div className="rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800 hover:shadow-xl transition-shadow cursor-pointer">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Achievements
                </h3>
                <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">
                  {recentAchievements.length}
                </p>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Earned
                </p>
              </div>
            </Link>

            <Link href="/student/leaderboard" aria-label="View leaderboard rankings">
              <div className="rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800 hover:shadow-xl transition-shadow cursor-pointer">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Leaderboard
                </h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  View rankings
                </p>
              </div>
            </Link>

            <Link href="/student/chat" aria-label="Chat with your AI expert">
              <div className="rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800 hover:shadow-xl transition-shadow cursor-pointer">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Chat with Expert
                </h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Get help
                </p>
              </div>
            </Link>
          </section>

          {/* Recent Achievements */}
          {recentAchievements.length > 0 && (
            <section aria-labelledby="recent-achievements-heading" className="mb-8">
              <h2 id="recent-achievements-heading" className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Recent Achievements
              </h2>
              <div className="grid gap-4 md:grid-cols-3">
                {recentAchievements.map((ua) => (
                  <article
                    key={ua.id}
                    className="rounded-xl bg-white p-4 shadow-md dark:bg-gray-800"
                    aria-label={`Achievement: ${ua.achievement.name}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-3xl" role="img" aria-label={`${ua.achievement.name} icon`}>{ua.achievement.icon}</div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {ua.achievement.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {ua.achievement.description}
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* Received Lessons from Teachers */}
          {receivedLessons.length > 0 && (
            <section aria-labelledby="teacher-lessons-heading" className="mb-8">
              <h2 id="teacher-lessons-heading" className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Lessons from Your Teachers
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {receivedLessons.map((sentLesson) => (
                  <Link
                    key={sentLesson.id}
                    href={`/student/lessons/${sentLesson.lesson.id}`}
                    aria-label={`View lesson: ${sentLesson.lesson.title} from ${sentLesson.teacher.name}`}
                  >
                    <article className="rounded-xl bg-white p-6 shadow-md dark:bg-gray-800 hover:shadow-xl transition-shadow cursor-pointer">
                      <div className="flex items-start justify-between mb-2">
                        <span className="inline-block rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                          {sentLesson.lesson.subject.name}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {sentLesson.lesson.difficulty}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {sentLesson.lesson.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        From: {sentLesson.teacher.name}
                      </p>
                      {sentLesson.lesson.quiz && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                          <span className="text-xs text-green-600 dark:text-green-400" role="status">
                            ✓ Quiz Available
                          </span>
                        </div>
                      )}
                    </article>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Available Lessons by Subject */}
          <section aria-labelledby="available-lessons-heading">
            <div className="flex items-center justify-between mb-4">
              <h2 id="available-lessons-heading" className="text-2xl font-bold text-gray-900 dark:text-white">
                Available Lessons
              </h2>
              <Link
                href="/student/lessons"
                className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm font-medium"
                aria-label="View all available lessons"
              >
                View All →
              </Link>
            </div>
            
            {subjects.map((subject) => (
              subject.lessons.length > 0 && (
                <section key={subject.id} className="mb-8" aria-labelledby={`subject-${subject.id}-heading`}>
                  <h3 id={`subject-${subject.id}-heading`} className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    <span role="img" aria-label={`${subject.name} icon`}>{subject.icon}</span> {subject.name}
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {subject.lessons.map((lesson) => (
                      <Link
                        key={lesson.id}
                        href={`/student/lessons/${lesson.id}`}
                        aria-label={`View ${subject.name} lesson: ${lesson.title} by ${lesson.creator.name}`}
                      >
                        <article className="rounded-xl bg-white p-6 shadow-md dark:bg-gray-800 hover:shadow-xl transition-shadow cursor-pointer">
                          <div className="flex items-start justify-between mb-2">
                            <span className="inline-block rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                              {lesson.difficulty}
                            </span>
                          </div>
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            {lesson.title}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            By: {lesson.creator.name}
                          </p>
                          {lesson.quiz && (
                            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                              <span className="text-xs text-green-600 dark:text-green-400" role="status">
                                ✓ Quiz Available
                              </span>
                            </div>
                          )}
                        </article>
                      </Link>
                    ))}
                  </div>
                </section>
              )
            ))}
          </section>
        </main>
      </div>
    </div>
  );
}
