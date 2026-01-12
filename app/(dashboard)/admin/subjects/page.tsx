"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Subject {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  _count?: {
    lessons: number;
  };
}

export default function SubjectsManagement() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    icon: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/subjects");
      const data = await response.json();

      if (data.success) {
        setSubjects(data.subjects);
      } else {
        setError(data.error || "Failed to fetch subjects");
      }
    } catch (err) {
      setError("Failed to fetch subjects");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const url = editingId
        ? `/api/subjects/${editingId}`
        : "/api/subjects";
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        await fetchSubjects();
        setFormData({ name: "", description: "", icon: "" });
        setIsCreating(false);
        setEditingId(null);
      } else {
        setError(data.error || "Failed to save subject");
      }
    } catch (err) {
      setError("Failed to save subject");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (subject: Subject) => {
    setEditingId(subject.id);
    setFormData({
      name: subject.name,
      description: subject.description || "",
      icon: subject.icon || "",
    });
    setIsCreating(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this subject?")) {
      return;
    }

    try {
      const response = await fetch(`/api/subjects/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        await fetchSubjects();
      } else {
        setError(data.error || "Failed to delete subject");
      }
    } catch (err) {
      setError("Failed to delete subject");
      console.error(err);
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingId(null);
    setFormData({ name: "", description: "", icon: "" });
    setError(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-8 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="mx-auto max-w-7xl">
          <p className="text-gray-600 dark:text-gray-400">Loading subjects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-8 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Subject Management
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Create and manage learning subjects
            </p>
          </div>
          <button
            onClick={() => router.push("/admin")}
            className="rounded-lg bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            Back to Dashboard
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-800 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="mb-6 rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
          >
            + Create New Subject
          </button>
        )}

        {isCreating && (
          <div className="mb-8 rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800">
            <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
              {editingId ? "Edit Subject" : "Create New Subject"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Subject Name *
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., Mathematics"
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="Brief description of the subject"
                />
              </div>

              <div>
                <label
                  htmlFor="icon"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Icon (emoji or icon name)
                </label>
                <input
                  type="text"
                  id="icon"
                  value={formData.icon}
                  onChange={(e) =>
                    setFormData({ ...formData, icon: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., 📐 or calculator"
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-indigo-600 px-6 py-2 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                >
                  {submitting ? "Saving..." : editingId ? "Update" : "Create"}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={submitting}
                  className="rounded-lg bg-gray-200 px-6 py-2 font-semibold text-gray-700 hover:bg-gray-300 disabled:opacity-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {subjects.map((subject) => (
            <div
              key={subject.id}
              className="rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800"
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {subject.icon && (
                    <span className="text-3xl">{subject.icon}</span>
                  )}
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {subject.name}
                  </h3>
                </div>
              </div>

              {subject.description && (
                <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                  {subject.description}
                </p>
              )}

              <div className="mb-4 text-sm text-gray-500 dark:text-gray-500">
                {subject._count?.lessons || 0} lesson(s)
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(subject)}
                  className="flex-1 rounded-lg bg-indigo-100 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(subject.id)}
                  className="flex-1 rounded-lg bg-red-100 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {subjects.length === 0 && (
          <div className="rounded-2xl bg-white p-12 text-center shadow-lg dark:bg-gray-800">
            <p className="text-gray-600 dark:text-gray-400">
              No subjects yet. Create your first subject to get started!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
