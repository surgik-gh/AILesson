import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/auth.config";

export default async function Home() {
  const session = await getServerSession(authOptions);

  // Если пользователь авторизован, перенаправляем на его дашборд
  if (session?.user) {
    const role = session.user.role;
    if (role === "ADMIN") redirect("/admin");
    if (role === "TEACHER") redirect("/teacher");
    if (role === "STUDENT") redirect("/student");
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/80">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">🎓</div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">AILesson</h1>
          </div>
          <div className="flex gap-3">
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Вход
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              Регистрация
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <div className="max-w-4xl space-y-8">
          <div className="space-y-4">
            <h2 className="text-5xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
              Обучение с искусственным интеллектом
            </h2>
            <p className="mx-auto max-w-2xl text-xl text-gray-600 dark:text-gray-300">
              Персонализированные уроки, интерактивные квизы и AI-эксперты для помощи в обучении
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/register"
              className="flex h-12 w-full items-center justify-center rounded-lg bg-blue-600 px-8 text-base font-semibold text-white transition-all hover:bg-blue-700 hover:shadow-lg dark:bg-blue-500 dark:hover:bg-blue-600 sm:w-auto"
            >
              Начать обучение
            </Link>
            <Link
              href="/login"
              className="flex h-12 w-full items-center justify-center rounded-lg border-2 border-gray-300 bg-white px-8 text-base font-semibold text-gray-700 transition-all hover:border-gray-400 hover:shadow-md dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-gray-500 sm:w-auto"
            >
              Уже есть аккаунт
            </Link>
          </div>

          {/* Features */}
          <div className="mt-16 grid gap-8 sm:grid-cols-3">
            <div className="rounded-xl bg-white p-6 shadow-md dark:bg-gray-800">
              <div className="mb-3 text-4xl">🤖</div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                AI-эксперты
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Получайте помощь от виртуальных экспертов в любое время
              </p>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-md dark:bg-gray-800">
              <div className="mb-3 text-4xl">📚</div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                Умные уроки
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Создавайте и проходите уроки, адаптированные под ваш уровень
              </p>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-md dark:bg-gray-800">
              <div className="mb-3 text-4xl">🏆</div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                Достижения
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Зарабатывайте монеты и соревнуйтесь в таблице лидеров
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white/80 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/80">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-gray-600 dark:text-gray-400">
          © 2026 AILesson Platform. Образовательная платформа с искусственным интеллектом.
        </div>
      </footer>
    </div>
  );
}
