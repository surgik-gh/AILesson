'use client';

import useSWR, { SWRConfiguration, mutate } from 'swr';
import { Lesson, Quiz, Expert } from '@/types';

// Type definitions for missing types
interface Subject {
  id: string;
  name: string;
  icon?: string;
  description?: string;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface LeaderboardEntry {
  id: string;
  userId: string;
  score: number;
  quizCount: number;
  correctAnswers: number;
  totalAnswers: number;
  user?: {
    name: string;
  };
}

interface ChatMessage {
  id: string;
  content: string;
  isFromUser: boolean;
  createdAt: Date;
}

// Generic fetcher function
const fetcher = async (url: string) => {
  const res = await fetch(url);
  
  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.');
    // Attach extra info to the error object
    (error as any).info = await res.json();
    (error as any).status = res.status;
    throw error;
  }
  
  return res.json();
};

// Default SWR configuration
const defaultConfig: SWRConfiguration = {
  revalidateOnFocus: false, // Don't revalidate on window focus
  revalidateOnReconnect: true, // Revalidate when reconnecting
  dedupingInterval: 2000, // Dedupe requests within 2 seconds
  errorRetryCount: 3, // Retry failed requests 3 times
  errorRetryInterval: 5000, // Wait 5 seconds between retries
};

// Hook for fetching available lessons
export function useAvailableLessons(config?: SWRConfiguration) {
  const { data, error, isLoading, mutate: revalidate } = useSWR<{ lessons: Lesson[] }>(
    '/api/lessons/available',
    fetcher,
    { ...defaultConfig, ...config }
  );

  return {
    lessons: data?.lessons,
    isLoading,
    isError: error,
    revalidate,
  };
}

// Hook for fetching a specific lesson
export function useLesson(lessonId: string | null, config?: SWRConfiguration) {
  const { data, error, isLoading, mutate: revalidate } = useSWR<{ lesson: Lesson; quiz: Quiz }>(
    lessonId ? `/api/lessons/${lessonId}` : null,
    fetcher,
    { ...defaultConfig, ...config }
  );

  return {
    lesson: data?.lesson,
    quiz: data?.quiz,
    isLoading,
    isError: error,
    revalidate,
  };
}

// Hook for fetching quiz data
export function useQuiz(quizId: string | null, config?: SWRConfiguration) {
  const { data, error, isLoading, mutate: revalidate } = useSWR<{ quiz: Quiz }>(
    quizId ? `/api/quiz/${quizId}` : null,
    fetcher,
    { ...defaultConfig, ...config }
  );

  return {
    quiz: data?.quiz,
    isLoading,
    isError: error,
    revalidate,
  };
}

// Hook for fetching user's selected expert
export function useSelectedExpert(config?: SWRConfiguration) {
  const { data, error, isLoading, mutate: revalidate } = useSWR<{ expert: Expert | null }>(
    '/api/expert/selected',
    fetcher,
    { ...defaultConfig, ...config }
  );

  return {
    expert: data?.expert,
    isLoading,
    isError: error,
    revalidate,
  };
}

// Hook for fetching available experts
export function useExperts(config?: SWRConfiguration) {
  const { data, error, isLoading, mutate: revalidate } = useSWR<{ experts: Expert[] }>(
    '/api/expert/list',
    fetcher,
    { ...defaultConfig, ...config }
  );

  return {
    experts: data?.experts,
    isLoading,
    isError: error,
    revalidate,
  };
}

// Hook for fetching subjects
export function useSubjects(config?: SWRConfiguration) {
  const { data, error, isLoading, mutate: revalidate } = useSWR<{ subjects: Subject[] }>(
    '/api/subjects',
    fetcher,
    { ...defaultConfig, ...config }
  );

  return {
    subjects: data?.subjects,
    isLoading,
    isError: error,
    revalidate,
  };
}

// Hook for fetching achievements
export function useAchievements(config?: SWRConfiguration) {
  const { data, error, isLoading, mutate: revalidate } = useSWR<{ 
    achievements: Achievement[];
    userAchievements: any[];
  }>(
    '/api/achievements',
    fetcher,
    { ...defaultConfig, ...config }
  );

  return {
    achievements: data?.achievements,
    userAchievements: data?.userAchievements,
    isLoading,
    isError: error,
    revalidate,
  };
}

// Hook for fetching leaderboard
export function useLeaderboard(config?: SWRConfiguration) {
  const { data, error, isLoading, mutate: revalidate } = useSWR<{ 
    leaderboard: LeaderboardEntry[];
    currentUser?: LeaderboardEntry;
  }>(
    '/api/leaderboard',
    fetcher,
    { 
      ...defaultConfig, 
      refreshInterval: 30000, // Refresh every 30 seconds
      ...config 
    }
  );

  return {
    leaderboard: data?.leaderboard,
    currentUser: data?.currentUser,
    isLoading,
    isError: error,
    revalidate,
  };
}

// Hook for fetching chat history
export function useChatHistory(config?: SWRConfiguration) {
  const { data, error, isLoading, mutate: revalidate } = useSWR<{ messages: ChatMessage[] }>(
    '/api/chat/history',
    fetcher,
    { ...defaultConfig, ...config }
  );

  return {
    messages: data?.messages,
    isLoading,
    isError: error,
    revalidate,
  };
}

// Hook for fetching teacher's lessons
export function useTeacherLessons(config?: SWRConfiguration) {
  const { data, error, isLoading, mutate: revalidate } = useSWR<{ lessons: Lesson[] }>(
    '/api/lessons/my-lessons',
    fetcher,
    { ...defaultConfig, ...config }
  );

  return {
    lessons: data?.lessons,
    isLoading,
    isError: error,
    revalidate,
  };
}

// Hook for fetching students (for teachers)
export function useStudents(config?: SWRConfiguration) {
  const { data, error, isLoading, mutate: revalidate } = useSWR<{ students: any[] }>(
    '/api/students',
    fetcher,
    { ...defaultConfig, ...config }
  );

  return {
    students: data?.students,
    isLoading,
    isError: error,
    revalidate,
  };
}

// Hook for fetching student progress
export function useStudentProgress(studentId: string | null, config?: SWRConfiguration) {
  const { data, error, isLoading, mutate: revalidate } = useSWR<{ 
    student: any;
    progress: any;
  }>(
    studentId ? `/api/students/${studentId}/progress` : null,
    fetcher,
    { ...defaultConfig, ...config }
  );

  return {
    student: data?.student,
    progress: data?.progress,
    isLoading,
    isError: error,
    revalidate,
  };
}

// Utility function for optimistic updates
export function optimisticUpdate<T>(
  key: string,
  updateFn: (data: T) => T,
  revalidate = true
) {
  return mutate(
    key,
    async (currentData: T | undefined) => {
      // If no current data, return undefined
      if (!currentData) {
        return undefined;
      }
      
      // Optimistically update the data
      const optimisticData = updateFn(currentData);
      
      // Return the optimistic data immediately
      return optimisticData;
    },
    { revalidate } // Optionally revalidate after update
  );
}

// Utility function to invalidate cache
export function invalidateCache(key: string | string[]) {
  if (Array.isArray(key)) {
    return Promise.all(key.map(k => mutate(k)));
  }
  return mutate(key);
}

// Utility function to prefetch data
export async function prefetchData(key: string) {
  return mutate(key, fetcher(key), false);
}
