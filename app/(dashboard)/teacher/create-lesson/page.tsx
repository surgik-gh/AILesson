'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface Subject {
  id: string;
  name: string;
  description: string | null;
}

export default function CreateLessonPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [selectedSubject, setSelectedSubject] = useState('');
  const [materialText, setMaterialText] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Load subjects on mount
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

  // Check authorization
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (
      status === 'authenticated' &&
      session?.user?.role !== 'TEACHER' &&
      session?.user?.role !== 'ADMIN'
    ) {
      router.push('/');
    }
  }, [status, session, router]);

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

    // Validation
    if (!selectedSubject) {
      setError('Пожалуйста, выберите предмет');
      return;
    }

    if (!materialText.trim()) {
      setError('Пожалуйста, добавьте учебный материал или загрузите файл');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/lessons/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subjectId: selectedSubject,
          material: materialText,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create lesson');
      }

      setSuccess(true);
      
      // Reset form
      setSelectedSubject('');
      setMaterialText('');
      setUploadedFile(null);
      setUploadProgress(0);

      // Redirect to teacher lessons page after 2 seconds
      setTimeout(() => {
        router.push(`/teacher/lessons`);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create lesson');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Создать новый урок</h1>

      {session?.user?.role !== 'ADMIN' && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            💰 Баланс монет мудрости: <strong>{session?.user?.wisdomCoins || 0}</strong>
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
            Создание урока стоит 20 монет мудрости
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Subject Selection */}
        <div>
          <label htmlFor="subject" className="block text-sm font-medium mb-2">
            Предмет *
          </label>
          <select
            id="subject"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
            required
          >
            <option value="">Выберите предмет</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
        </div>

        {/* File Upload */}
        <div>
          <label htmlFor="file" className="block text-sm font-medium mb-2">
            Загрузить файл (необязательно)
          </label>
          <input
            type="file"
            id="file"
            onChange={handleFileChange}
            accept=".pdf,.txt,.jpg,.jpeg,.png,.gif,.webp"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
          />
          <p className="text-xs text-gray-500 mt-1">
            Поддерживаемые форматы: PDF, изображения (JPG, PNG, GIF, WebP), текстовые файлы
          </p>
          {uploadedFile && uploadProgress > 0 && (
            <div className="mt-2">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {uploadProgress === 100 ? 'Файл загружен' : `Загрузка... ${uploadProgress}%`}
              </p>
            </div>
          )}
        </div>

        {/* Material Text */}
        <div>
          <label htmlFor="material" className="block text-sm font-medium mb-2">
            Учебный материал *
          </label>
          <textarea
            id="material"
            value={materialText}
            onChange={(e) => setMaterialText(e.target.value)}
            rows={12}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 font-mono text-sm"
            placeholder="Введите или вставьте учебный материал здесь..."
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Опишите тему урока, ключевые концепции, примеры и любую другую информацию для создания урока
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-sm text-green-800 dark:text-green-200">
              ✅ Урок успешно создан! Перенаправление...
            </p>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading || success}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Создание урока...
              </span>
            ) : (
              'Создать урок'
            )}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Отмена
          </button>
        </div>
      </form>

      {/* Info Box */}
      <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h3 className="font-medium mb-2">ℹ️ Как это работает</h3>
        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li>1. Выберите предмет для урока</li>
          <li>2. Загрузите файл или введите материал вручную</li>
          <li>3. AI автоматически создаст структурированный урок</li>
          <li>4. Викторина будет сгенерирована автоматически</li>
          <li>5. Вы сможете отправить урок ученикам</li>
        </ul>
      </div>
    </div>
  );
}
