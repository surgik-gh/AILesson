import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function TeacherDashboard() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "TEACHER") {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-8 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Teacher Dashboard
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Welcome back, {session.user.name}!
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Wisdom Coins
            </h3>
            <p className="mt-2 text-3xl font-bold text-indigo-600 dark:text-indigo-400">
              {session.user.wisdomCoins}
            </p>
          </div>

          <Link
            href="/teacher/create-lesson"
            className="rounded-2xl bg-white p-6 shadow-lg transition-all hover:shadow-xl dark:bg-gray-800"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Create Lesson
            </h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Generate AI-powered lessons
            </p>
          </Link>

          <Link
            href="/teacher/lessons"
            className="rounded-2xl bg-white p-6 shadow-lg transition-all hover:shadow-xl dark:bg-gray-800"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              My Lessons
            </h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Share lessons with students
            </p>
          </Link>

          <Link
            href="/teacher/students"
            className="rounded-2xl bg-white p-6 shadow-lg transition-all hover:shadow-xl dark:bg-gray-800"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Student Progress
            </h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Track student performance
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
