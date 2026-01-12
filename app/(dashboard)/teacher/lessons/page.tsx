"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Student {
  id: string;
  name: string;
  email: string;
}

interface Lesson {
  id: string;
  title: string;
  content: string;
  difficulty: string;
  createdAt: string;
  subject: {
    id: string;
    name: string;
  };
  sentTo: Array<{
    id: string;
    student: {
      id: string;
      name: string;
      email: string;
    };
  }>;
}

export default function TeacherLessonsPage() {
  const router = useRouter();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [sharing, setSharing] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch lessons
      const lessonsRes = await fetch("/api/lessons/my-lessons");
      const lessonsData = await lessonsRes.json();
      
      if (lessonsData.success) {
        setLessons(lessonsData.lessons);
      }

      // Fetch students
      const studentsRes = await fetch("/api/students");
      const studentsData = await studentsRes.json();
      
      if (studentsData.success) {
        setStudents(studentsData.students);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setMessage({ type: "error", text: "Failed to load data" });
    } finally {
      setLoading(false);
    }
  };

  const handleShareLesson = async () => {
    if (!selectedLesson || selectedStudents.length === 0) {
      setMessage({ type: "error", text: "Please select a lesson and at least one student" });
      return;
    }

    try {
      setSharing(true);
      const response = await fetch("/api/lessons/share", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lessonId: selectedLesson,
          studentIds: selectedStudents,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: "success", text: data.message });
        setSelectedLesson(null);
        setSelectedStudents([]);
        fetchData(); // Refresh lessons to show updated sentTo
      } else {
        setMessage({ type: "error", text: data.error || "Failed to share lesson" });
      }
    } catch (error) {
      console.error("Error sharing lesson:", error);
      setMessage({ type: "error", text: "Failed to share lesson" });
    } finally {
      setSharing(false);
    }
  };

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-8 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="mx-auto max-w-7xl">
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-8 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            My Lessons
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Share lessons with your students
          </p>
        </div>

        {message && (
          <div
            className={`mb-6 rounded-lg p-4 ${
              message.type === "success"
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Lessons List */}
          <div className="rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800">
            <h2 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
              Your Lessons
            </h2>
            
            {lessons.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400">
                No lessons created yet.{" "}
                <button
                  onClick={() => router.push("/teacher/create-lesson")}
                  className="text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  Create your first lesson
                </button>
              </p>
            ) : (
              <div className="space-y-4">
                {lessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
                      selectedLesson === lesson.id
                        ? "border-indigo-600 bg-indigo-50 dark:border-indigo-400 dark:bg-indigo-900/20"
                        : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
                    }`}
                    onClick={() => setSelectedLesson(lesson.id)}
                  >
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {lesson.title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      Subject: {lesson.subject.name} • Difficulty: {lesson.difficulty}
                    </p>
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                      Shared with {lesson.sentTo.length} student(s)
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Student Selection */}
          <div className="rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800">
            <h2 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
              Select Students
            </h2>
            
            {!selectedLesson ? (
              <p className="text-gray-600 dark:text-gray-400">
                Select a lesson to share
              </p>
            ) : students.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400">
                No students available
              </p>
            ) : (
              <>
                <div className="mb-4 space-y-2">
                  {students.map((student) => (
                    <label
                      key={student.id}
                      className="flex cursor-pointer items-center rounded-lg border border-gray-200 p-3 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700"
                    >
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student.id)}
                        onChange={() => toggleStudentSelection(student.id)}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div className="ml-3">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {student.name}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {student.email}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>

                <button
                  onClick={handleShareLesson}
                  disabled={sharing || selectedStudents.length === 0}
                  className="w-full rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                >
                  {sharing ? "Sharing..." : `Share with ${selectedStudents.length} student(s)`}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
