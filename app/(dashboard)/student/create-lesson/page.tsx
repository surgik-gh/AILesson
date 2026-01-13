'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Subject {
  id: string;
  name: string;
  description: string | null;
}

export default function StudentCreateLessonPage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [selectedSubject, setSelectedSubject] = useState('');
  const [materialText, setMaterialText] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    async function loadSubjects() {
      try {
        const response = await fetch('/api/subjects');
        if (response.ok) {
          const data = await response.json();
          setSubjects(data.subjects || []);
        }
      } catch (err) {
        console.error('Failed to load subjects:', err);
      }
    }
    loadSubjects();
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    setError(null);
    setUploadProgress(10);

    try {
      const formData = new FormData();
      formData.append('file', file);
      setUploadProgress(30);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      setUploadProgress(70);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload file');
      }

      const data = await response.json();
      setMaterialText(data.text || '');
      setUploadProgress(100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file');
      setUploadedFile(null);
      setUploadProgress(0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!selectedSubject) {
      setError('Пожалуйста, выберите предмет');
      return;
    }
    if (!materialText.trim()) {
      setError('Пожалуйста, добавьте учебный материал');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/lessons/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectId: selectedSubject, material: materialText }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create lesson');

      setSuccess(true);
      setSelectedSubject('');
      setMaterialText('');
      setUploadedFile(null);
      setUploadProgress(0);

      setTimeout(() => router.push('/student/lessons'), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create lesson');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/80">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/student" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
              ← Назад
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Создать урок</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl bg-white p-8 shadow-lg dark:bg-gray-800">
          <div>
            <label htmlFor="subject" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Предмет *
            </label>
            <select
              id="subject"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              required
            >
              <option value="">Выберите предмет</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>{subject.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="file" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Загрузить файл (необязательно)
            </label>
            <input
              type="file"
              id="file"
              onChange={handleFileChange}
              accept=".pdf,.txt,.jpg,.jpeg,.png,.gif,.webp"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700"
            />
            {uploadedFile && uploadProgress > 0 && (
              <div className="mt-2">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-indigo-600 h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="material" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Учебный материал *
            </label>
            <textarea
              id="material"
              value={materialText}
              onChange={(e) => setMaterialText(e.target.value)}
              rows={10}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white font-mono text-sm"
              placeholder="Введите учебный материал..."
              required
            />
          </div>

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
              <p className="text-sm text-green-800 dark:text-green-200">✅ Урок создан! Перенаправление...</p>
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading || success}
              className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Создание...' : 'Создать урок'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Отмена
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
