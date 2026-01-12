"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

interface StudentProgress {
  student: {
    id: string;
    name: string;
    email: string;
    wisdomCoins: number;
    createdAt: string;
  };
  progress: {
    totalQuizzes: number;
    perfectQuizzes: number;
    totalAnswers: number;
    correctAnswers: number;
    correctAnswerPercentage: number;
    completedLessons: Array<{
      id: string;
      lessonTitle: string;
      subjectName: string;
      score: number;
      isPerfect: boolean;
      completedAt: string;
      correctAnswers: number;
      totalQuestions: number;
    }>;
    achievements: Array<{
      id: string;
      name: string;
      description: string;
      icon: string;
      earnedAt: string;
    }>;
    leaderboard: {
      score: number;
      quizCount: number;
      correctAnswers: number;
      totalAnswers: number;
    } | null;
    receivedLessons: Array<{
      id: string;
      lessonTitle: string;
      subjectName: string;
      teacherName: string;
      sentAt: string;
    }>;
  };
}

export default function StudentProgressDetailPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.id as string;

  const [data, setData] = useState<StudentProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (studentId) {
      fetchStudentProgress();
    }
  }, [studentId]);

  const fetchStudentProgress = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/students/${studentId}/progress`);
      const result = await response.json();

      if (result.success) {
        setData(result);
      } else {
        setError(result.error || "Failed to load student progress");
      }
    } catch (error) {
      console.error("Error fetching student progress:", error);
      setError("Failed to load student progress");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    window.open(`/api/students/${studentId}/export`, "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-8 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="mx-auto max-w-7xl">
          <p className="text-gray-600 dark:text-gray-400">Loading student progress...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-8 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-lg bg-red-100 p-4 text-red-800 dark:bg-red-900 dark:text-red-200">
            {error || "Failed to load student progress"}
          </div>
          <button
            onClick={() => router.push("/teacher/students")}
            className="mt-4 text-indigo-600 hover:underline dark:text-indigo-400"
          >
            ← Back to Students
          </button>
        </div>
      </div>
    );
  }

  const { student, progress } = data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-8 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="mx-auto max-w-7xl">
        <button
          onClick={() => router.push("/teacher/students")}
          className="mb-6 text-indigo-600 hover:underline dark:text-indigo-400"
        >
          ← Back to Students
        </button>

        {/* Export Button */}
        <div className="mb-6 flex justify-end">
          <button
            onClick={handleExport}
            className="rounded-lg bg-green-600 px-6 py-2 font-semibold text-white hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
          >
            📊 Export Progress Report (CSV)
          </button>
        </div>

        {/* Student Header */}
        <div className="mb-8 rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800">
          <div className="flex items-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900">
              <span className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                {student.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="ml-6">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {student.name}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">{student.email}</p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">
                Wisdom Coins: {student.wisdomCoins}
              </p>
            </div>
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">
              Total Quizzes
            </h3>
            <p className="mt-2 text-3xl font-bold text-indigo-600 dark:text-indigo-400">
              {progress.totalQuizzes}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">
              Perfect Quizzes
            </h3>
            <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">
              {progress.perfectQuizzes}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">
              Correct Answer %
            </h3>
            <p className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-400">
              {progress.correctAnswerPercentage}%
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">
              Leaderboard Score
            </h3>
            <p className="mt-2 text-3xl font-bold text-purple-600 dark:text-purple-400">
              {progress.leaderboard?.score || 0}
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Completed Lessons */}
          <div className="rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800">
            <h2 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
              Completed Lessons
            </h2>
            {progress.completedLessons.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400">
                No lessons completed yet
              </p>
            ) : (
              <div className="space-y-4">
                {progress.completedLessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {lesson.lessonTitle}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {lesson.subjectName}
                        </p>
                      </div>
                      {lesson.isPerfect && (
                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800 dark:bg-green-900 dark:text-green-200">
                          Perfect!
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        Score: {lesson.correctAnswers}/{lesson.totalQuestions}
                      </span>
                      <span className="text-gray-500 dark:text-gray-500">
                        {new Date(lesson.completedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Achievements */}
          <div className="rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800">
            <h2 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
              Achievements
            </h2>
            {progress.achievements.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400">
                No achievements earned yet
              </p>
            ) : (
              <div className="space-y-4">
                {progress.achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className="flex items-center rounded-lg border border-gray-200 p-4 dark:border-gray-700"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 text-2xl dark:bg-yellow-900">
                      {achievement.icon}
                    </div>
                    <div className="ml-4">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {achievement.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {achievement.description}
                      </p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                        Earned: {new Date(achievement.earnedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Received Lessons */}
          <div className="rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800 lg:col-span-2">
            <h2 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
              Lessons Sent to Student
            </h2>
            {progress.receivedLessons.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400">
                No lessons sent to this student yet
              </p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {progress.receivedLessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
                  >
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {lesson.lessonTitle}
                    </h3>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      Subject: {lesson.subjectName}
                    </p>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      From: {lesson.teacherName}
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                      Sent: {new Date(lesson.sentAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
