import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";

export default async function AdminDashboard() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/login");
  }

  // Gather overview statistics
  const [
    totalUsers,
    totalStudents,
    totalTeachers,
    totalLessons,
    totalQuizzes,
    totalExperts,
    totalSubjects,
    totalChatMessages,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.user.count({ where: { role: "TEACHER" } }),
    prisma.lesson.count(),
    prisma.quiz.count(),
    prisma.expert.count(),
    prisma.subject.count(),
    prisma.chatMessage.count(),
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-8 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Admin Dashboard
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Welcome back, {session.user.name}!
          </p>
        </div>

        {/* Overview Statistics */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Platform Overview
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl bg-white p-6 shadow-md dark:bg-gray-800">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
              <p className="mt-2 text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                {totalUsers}
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                {totalStudents} students, {totalTeachers} teachers
              </p>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-md dark:bg-gray-800">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Lessons</p>
              <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">
                {totalLessons}
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                {totalQuizzes} quizzes
              </p>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-md dark:bg-gray-800">
              <p className="text-sm text-gray-600 dark:text-gray-400">AI Experts</p>
              <p className="mt-2 text-3xl font-bold text-purple-600 dark:text-purple-400">
                {totalExperts}
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                {totalChatMessages} chat messages
              </p>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-md dark:bg-gray-800">
              <p className="text-sm text-gray-600 dark:text-gray-400">Subjects</p>
              <p className="mt-2 text-3xl font-bold text-orange-600 dark:text-orange-400">
                {totalSubjects}
              </p>
            </div>
          </div>
        </div>

        {/* Admin Navigation */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Admin Tools
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Link href="/admin/users">
              <div className="rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800 cursor-pointer hover:shadow-xl transition-shadow border-2 border-transparent hover:border-indigo-500">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    User Management
                  </h3>
                  <span className="text-2xl">👥</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Create, edit, and manage user accounts
                </p>
              </div>
            </Link>

            <Link href="/admin/subjects">
              <div className="rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800 cursor-pointer hover:shadow-xl transition-shadow border-2 border-transparent hover:border-indigo-500">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Subjects
                  </h3>
                  <span className="text-2xl">📚</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Manage learning subjects and categories
                </p>
              </div>
            </Link>

            <Link href="/admin/experts">
              <div className="rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800 cursor-pointer hover:shadow-xl transition-shadow border-2 border-transparent hover:border-indigo-500">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Expert Avatars
                  </h3>
                  <span className="text-2xl">🤖</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Create and manage AI expert avatars
                </p>
              </div>
            </Link>

            <Link href="/admin/content">
              <div className="rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800 cursor-pointer hover:shadow-xl transition-shadow border-2 border-transparent hover:border-indigo-500">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Content Moderation
                  </h3>
                  <span className="text-2xl">🛡️</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Review and moderate lessons and chats
                </p>
              </div>
            </Link>

            <Link href="/settings">
              <div className="rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800 cursor-pointer hover:shadow-xl transition-shadow border-2 border-transparent hover:border-indigo-500">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Settings
                  </h3>
                  <span className="text-2xl">⚙️</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Configure your account settings
                </p>
              </div>
            </Link>

            <div className="rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-6 shadow-lg cursor-default">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-white">
                  Wisdom Coins
                </h3>
                <span className="text-2xl">💎</span>
              </div>
              <p className="text-3xl font-bold text-white">Unlimited</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
