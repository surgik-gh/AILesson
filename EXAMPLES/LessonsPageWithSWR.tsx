/**
 * Example: Lessons Page with SWR Integration
 * 
 * This is an example showing how to refactor the lessons page to use SWR
 * for data fetching and caching. Compare this with the original implementation
 * in app/(dashboard)/student/lessons/page.tsx
 * 
 * Benefits of SWR:
 * - Automatic caching
 * - Automatic revalidation
 * - Request deduplication
 * - Optimistic updates
 * - Less boilerplate code
 * 
 * Note: The Lesson type in types/index.ts doesn't include relations (creator, subject, quiz)
 * but the API returns lessons with these relations. We define LessonWithRelations to handle this.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DynamicScene, DynamicCard3D } from '@/components/3d';
import { useAvailableLessons, useSubjects } from '@/lib/hooks/useSWR';

// Extended Lesson type with relations
interface LessonWithRelations {
  id: string;
  title: string;
  content: string;
  keyPoints: string[];
  difficulty: string;
  subjectId: string;
  creatorId: string;
  subject: {
    id: string;
    name: string;
    icon?: string;
  };
  creator: {
    id: string;
    name: string;
  };
  quiz?: {
    id: string;
  };
}

export default function LessonsPageWithSWR() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [view3D, setView3D] = useState(false);

  // Use SWR hooks for data fetching - automatic caching and revalidation!
  const { lessons, isLoading: lessonsLoading, isError: lessonsError } = useAvailableLessons();
  const { subjects, isLoading: subjectsLoading } = useSubjects();

  // Cast lessons to the extended type since the API returns relations
  const lessonsWithRelations = (lessons || []) as unknown as LessonWithRelations[];

  // Filter lessons based on search and filters
  const filteredLessons = lessonsWithRelations.filter((lesson) => {
    const matchesSearch = 
      lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lesson.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lesson.creator.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSubject = 
      selectedSubject === 'all' || lesson.subject.id === selectedSubject;
    
    const matchesDifficulty = 
      selectedDifficulty === 'all' || lesson.difficulty === selectedDifficulty;
    
    return matchesSearch && matchesSubject && matchesDifficulty;
  });

  const handleLessonClick = (lessonId: string) => {
    router.push(`/student/lessons/${lessonId}`);
  };

  // Loading state
  if (lessonsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-8 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="mx-auto max-w-7xl">
          <div className="animate-pulse">
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-8"></div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (lessonsError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-8 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="mx-auto max-w-7xl">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">⚠️</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Error loading lessons
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Please try again later
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-8 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Browse Lessons
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Explore available lessons and start learning
          </p>
        </div>

        {/* Filters and Search */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search lessons by title, content, or creator..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 pl-12 text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
            />
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          {/* Filter Controls */}
          <div className="flex flex-wrap gap-4 items-center">
            {/* Subject Filter */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Subject
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                disabled={subjectsLoading}
              >
                <option value="all">All Subjects</option>
                {subjects?.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.icon} {subject.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Difficulty Filter */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Difficulty
              </label>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              >
                <option value="all">All Levels</option>
                <option value="BEGINNER">Beginner</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="ADVANCED">Advanced</option>
              </select>
            </div>

            {/* View Toggle */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                View Mode
              </label>
              <button
                onClick={() => setView3D(!view3D)}
                className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
              >
                {view3D ? '📋 Grid View' : '🎨 3D View'}
              </button>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Showing {filteredLessons.length} lesson{filteredLessons.length !== 1 ? 's' : ''}
        </div>

        {/* 3D View - Using Dynamic Components */}
        {view3D && filteredLessons.length > 0 && (
          <div className="mb-8 rounded-2xl bg-white p-8 shadow-lg dark:bg-gray-800">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              3D Lesson Cards
            </h2>
            <div className="h-[600px] rounded-xl overflow-hidden">
              <DynamicScene theme="BASIC">
                {filteredLessons.slice(0, 9).map((lesson, index) => {
                  const row = Math.floor(index / 3);
                  const col = index % 3;
                  const x = (col - 1) * 3;
                  const y = (1 - row) * 3.5;
                  
                  return (
                    <DynamicCard3D
                      key={lesson.id}
                      title={lesson.title}
                      content={`${lesson.subject.name} • ${lesson.difficulty}`}
                      position={[x, y, 0]}
                      onClick={() => handleLessonClick(lesson.id)}
                      color={
                        lesson.difficulty === 'BEGINNER' ? '#10b981' :
                        lesson.difficulty === 'INTERMEDIATE' ? '#f59e0b' :
                        '#ef4444'
                      }
                    />
                  );
                })}
              </DynamicScene>
            </div>
            {filteredLessons.length > 9 && (
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-400 text-center">
                Showing first 9 lessons in 3D view. Switch to grid view to see all.
              </p>
            )}
          </div>
        )}

        {/* Grid View */}
        {!view3D && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredLessons.map((lesson) => (
              <div
                key={lesson.id}
                onClick={() => handleLessonClick(lesson.id)}
                className="rounded-xl bg-white p-6 shadow-md dark:bg-gray-800 hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="inline-block rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                    {lesson.subject.icon} {lesson.subject.name}
                  </span>
                  <span
                    className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                      lesson.difficulty === 'BEGINNER'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : lesson.difficulty === 'INTERMEDIATE'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}
                  >
                    {lesson.difficulty}
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                  {lesson.title}
                </h3>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  By: {lesson.creator.name}
                </p>

                {lesson.keyPoints && lesson.keyPoints.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 dark:text-gray-500 mb-1">
                      Key Points:
                    </p>
                    <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                      {lesson.keyPoints.slice(0, 2).map((point, idx) => (
                        <li key={idx} className="line-clamp-1">• {point}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {lesson.quiz && (
                  <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                      ✓ Quiz Available
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {filteredLessons.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No lessons found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Try adjusting your filters or search query
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Key Differences from Original:
 * 
 * 1. Data Fetching:
 *    Before: useState + useEffect + manual fetch
 *    After: useSWR hooks (useAvailableLessons, useSubjects)
 * 
 * 2. Loading State:
 *    Before: Manual loading state management
 *    After: Automatic isLoading from SWR
 * 
 * 3. Error Handling:
 *    Before: Try-catch with console.error
 *    After: Automatic isError from SWR
 * 
 * 4. Caching:
 *    Before: No caching, refetch on every mount
 *    After: Automatic caching, instant data on remount
 * 
 * 5. Revalidation:
 *    Before: Manual refetch function
 *    After: Automatic revalidation on reconnect
 * 
 * 6. Code Size:
 *    Before: ~50 lines for data fetching
 *    After: ~5 lines for data fetching
 * 
 * 7. 3D Components:
 *    Before: Manual dynamic imports
 *    After: Pre-configured Dynamic components with code splitting
 */
