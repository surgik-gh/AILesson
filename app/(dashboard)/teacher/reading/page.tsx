'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const CATEGORIES = [
  { value: 'DAILY', label: 'На день', icon: '📅' },
  { value: 'WEEKLY', label: 'На неделю', icon: '📆' },
  { value: 'VACATION', label: 'На каникулы', icon: '🏖️' },
  { value: 'POETRY', label: 'Стихотворение', icon: '📜' },
  { value: 'PROSE', label: 'Проза', icon: '📖' },
  { value: 'HOMEWORK', label: 'Домашнее задание', icon: '📝' },
  { value: 'EXTRA', label: 'Дополнительно', icon: '➕' },
];

interface Student {
  id: string;
  name: string;
}

interface Material {
  id: string;
  title: string;
  description: string | null;
  category: string;
  dueDate: string | null;
  createdAt: string;
  assignedTo: { student: Student }[];
}

export default function TeacherReadingPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    url: '',
    category: 'DAILY',
    dueDate: '',
    studentIds: [] as string[],
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMaterials();
    fetchStudents();
  }, [selectedCategory]);

  const fetchMaterials = async () => {
    try {
      const url = selectedCategory === 'all' 
        ? '/api/reading' 
        : `/api/reading?category=${selectedCategory}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.success) setMaterials(data.materials || []);
    } catch (err) {
      console.error('Error fetching materials:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/students');
      const data = await response.json();
      if (data.success) setStudents(data.students || []);
    } catch (err) {
      console.error('Error fetching students:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/reading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      
      if (data.success) {
        setMaterials([data.material, ...materials]);
        setShowForm(false);
        setFormData({ title: '', description: '', content: '', url: '', category: 'DAILY', dueDate: '', studentIds: [] });
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Ошибка при создании материала');
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryInfo = (cat: string) => CATEGORIES.find(c => c.value === cat) || { label: cat, icon: '📄' };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/80">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/teacher" className="text-gray-600 hover:text-gray-900 dark:text-gray-400">← Назад</Link>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">📚 Литература для чтения</h1>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
            >
              {showForm ? 'Отмена' : '+ Добавить'}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        {showForm && (
          <form onSubmit={handleSubmit} className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Новый материал</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Название *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Категория *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.icon} {cat.label}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Описание</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Ссылка</label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Срок</label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>
            {error && <p className="mt-4 text-red-600 dark:text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
            >
              {submitting ? 'Сохранение...' : 'Сохранить'}
            </button>
          </form>
        )}

        {/* Category Filter */}
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === 'all' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            Все
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === cat.value ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>

        {/* Materials List */}
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-40 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : materials.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl">
            <div className="text-5xl mb-4">📚</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Нет материалов</h3>
            <p className="text-gray-600 dark:text-gray-400">Добавьте первый материал для чтения</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {materials.map(material => {
              const catInfo = getCategoryInfo(material.category);
              return (
                <div key={material.id} className="p-5 bg-white dark:bg-gray-800 rounded-xl shadow-md">
                  <div className="flex items-start justify-between mb-3">
                    <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-medium">
                      {catInfo.icon} {catInfo.label}
                    </span>
                    {material.dueDate && (
                      <span className="text-xs text-gray-500">до {new Date(material.dueDate).toLocaleDateString('ru')}</span>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{material.title}</h3>
                  {material.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{material.description}</p>
                  )}
                  <div className="mt-3 text-xs text-gray-500">
                    👥 {material.assignedTo.length} учеников
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
