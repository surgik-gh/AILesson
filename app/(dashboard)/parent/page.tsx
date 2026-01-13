import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function ParentDashboard() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "PARENT") {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/80">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Привет, {session.user.name}! 👋
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Панель родителя
              </p>
            </div>
            <Link
              href="/settings"
              className="rounded-full bg-gray-100 p-2 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
            >
              ⚙️
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="mb-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-lg">
              <div className="rounded-xl bg-white/20 p-3 text-3xl w-fit mb-4">👨‍👩‍👧</div>
              <h3 className="font-semibold text-lg">Мои дети</h3>
              <p className="text-sm text-blue-100">Скоро будет доступно</p>
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-green-500 to-green-600 p-6 text-white shadow-lg">
              <div className="rounded-xl bg-white/20 p-3 text-3xl w-fit mb-4">📊</div>
              <h3 className="font-semibold text-lg">Успеваемость</h3>
              <p className="text-sm text-green-100">Скоро будет доступно</p>
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-white shadow-lg">
              <div className="rounded-xl bg-white/20 p-3 text-3xl w-fit mb-4">📚</div>
              <h3 className="font-semibold text-lg">Задания</h3>
              <p className="text-sm text-purple-100">Скоро будет доступно</p>
            </div>
          </div>
        </section>

        <div className="rounded-2xl bg-white p-8 shadow-lg dark:bg-gray-800 text-center">
          <div className="text-5xl mb-4">🚧</div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Раздел в разработке
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Функционал для родителей скоро будет доступен. Вы сможете отслеживать успеваемость своих детей.
          </p>
        </div>
      </main>
    </div>
  );
}
