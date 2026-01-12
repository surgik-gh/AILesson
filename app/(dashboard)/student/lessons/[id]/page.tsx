import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";

interface LessonDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function LessonDetailPage({ params }: LessonDetailPageProps) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "STUDENT") {
    redirect("/login");
  }

  const { id } = await params;

  // Fetch the lesson with all related data
  const lesson = await prisma.lesson.findUnique({
    where: {
      id: id,
    },
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
          questions: {
            select: {
              id: true,
            },
          },
        },
      },
    },
  });

  if (!lesson) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-8 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="mx-auto max-w-4xl">
        {/* Back Button */}
        <Link
          href="/student"
          className="inline-flex items-center text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 mb-6"
        >
          ← Back to Dashboard
        </Link>

        {/* Lesson Header */}
        <div className="rounded-2xl bg-white p-8 shadow-lg dark:bg-gray-800 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex gap-3">
              <span className="inline-block rounded-full bg-indigo-100 px-4 py-1 text-sm font-semibold text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                {lesson.subject.name}
              </span>
              <span className="inline-block rounded-full bg-purple-100 px-4 py-1 text-sm font-semibold text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                {lesson.difficulty}
              </span>
            </div>
          </div>

          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {lesson.title}
          </h1>

          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Created by: {lesson.creator.name}
          </p>

          {/* Key Points */}
          {lesson.keyPoints && lesson.keyPoints.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Key Points
              </h2>
              <ul className="space-y-2">
                {lesson.keyPoints.map((point, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3 text-gray-700 dark:text-gray-300"
                  >
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                      •
                    </span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Lesson Content */}
        <div className="rounded-2xl bg-white p-8 shadow-lg dark:bg-gray-800 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Lesson Content
          </h2>
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <div
              className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: lesson.content }}
            />
          </div>
        </div>

        {/* Quiz Section */}
        {lesson.quiz && (
          <div className="rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 p-8 shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">Ready to Test Your Knowledge?</h2>
                <p className="text-indigo-100 mb-4">
                  Complete the quiz to earn wisdom coins and improve your ranking!
                </p>
                <p className="text-sm text-indigo-200">
                  {lesson.quiz.questions.length} questions • Earn up to{" "}
                  {lesson.quiz.questions.length * 2} coins
                </p>
              </div>
              <Link
                href={`/student/quiz/${lesson.quiz.id}`}
                className="rounded-xl bg-white px-8 py-4 text-lg font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors shadow-lg"
              >
                Start Quiz
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
