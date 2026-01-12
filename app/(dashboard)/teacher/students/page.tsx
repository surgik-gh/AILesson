"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Student {
  id: string;
  name: string;
  email: string;
}

export default function TeacherStudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/students");
      const data = await response.json();

      if (data.success) {
        setStudents(data.students);
      } else {
        setError(data.error || "Failed to load students");
      }
    } catch (error) {
      console.error("Error fetching students:", error);
      setError("Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  const viewStudentProgress = (studentId: string) => {
    router.push(`/teacher/students/${studentId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-8 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="mx-auto max-w-7xl">
          <p className="text-gray-600 dark:text-gray-400">Loading students...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-8 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Student Progress
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Track your students' performance and achievements
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-100 p-4 text-red-800 dark:bg-red-900 dark:text-red-200">
            {error}
          </div>
        )}

        {students.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center shadow-lg dark:bg-gray-800">
            <p className="text-gray-600 dark:text-gray-400">
              No students found in the system.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {students.map((student) => (
              <div
                key={student.id}
                className="cursor-pointer rounded-2xl bg-white p-6 shadow-lg transition-all hover:shadow-xl dark:bg-gray-800"
                onClick={() => viewStudentProgress(student.id)}
              >
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900">
                  <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                    {student.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {student.name}
                </h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {student.email}
                </p>
                <button className="mt-4 w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600">
                  View Progress
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
